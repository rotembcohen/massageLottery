# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import random
import jwt
import json
import mandrill
from datetime import datetime
from faker import Faker
from .models import Slot, Lottery, Account
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from .serializers import SlotSerializer, LotterySerializer, AccountSerializer
from datetime import datetime, timedelta
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status

mandrill_client = mandrill.Mandrill('O8Jtn3GLlDfYQT0rfauUvA')

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer    

class SlotViewSet(viewsets.ModelViewSet):
    queryset = Slot.objects.all()
    serializer_class = SlotSerializer

    def partial_update(self, request, pk=None):
        slot = get_object_or_404(self.queryset, pk=pk)
        header = request.META['HTTP_AUTHORIZATION'].replace("Bearer ", "")
        jwtHeader = jwt.decode(header, verify=False)
        addEmail = jwtHeader['email']
        addFirst = jwtHeader['given_name']
        addLast = jwtHeader['family_name']
        emailDomain = addEmail.split("@")[1]
        if (emailDomain != "wework.com") and (emailDomain != "meetup.com"):
            return Response({"error": "open only for wework employees"})
        isSelected = request.data['isSelected']
        obj, created = Account.objects.get_or_create(
            email=addEmail,
            firstName=addFirst,
            lastName=addLast
        )

        prevSlots = obj.slotsRegistered.filter(lottery=slot.lottery)
        for prevSlot in prevSlots:
            prevSlot.entries.remove(obj)

        slotEntries = slot.entries.all()
        if isSelected:
            if obj not in slotEntries:
                slot.entries.add(obj)

        return Response(status=status.HTTP_204_NO_CONTENT)


class LotteryViewSet(viewsets.ModelViewSet):
    queryset = Lottery.objects.all()
    serializer_class = LotterySerializer

    def partial_update(self, request, pk=None):
        isFinished = request.data['isFinished']
        lottery = get_object_or_404(self.queryset, pk=pk)

        if isFinished and not lottery.isFinished:
            slots = Slot.objects.filter(lottery=lottery)
        
            emailClient = Email()
            winners = {}
            for slot in slots:
                if not lottery.isFinished:
                    if slot.entries.count() > 0:
                        #find the minimum winCount between all accounts registered to slot
                        winCountMin = slot.entries.aggregate(Min('winCount'))['winCount__min']
                        minWinnersRegAccounts = slot.entries.filter(winCount=winCountMin)
                    
                        slot.winner = random.choice(minWinnersRegAccounts)
                        slot.save()
                if slot.winner:
                    winners[slot.pk] = slot.winner.email
                    #sends email
                    slotTimeStr = slot.startTime.strftime("%A, %B %d, %H:%M")
                    emailClient.sendEmail(slot.winner.email, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), lottery.location, slotTimeStr)

                else:
                    winners[slot.pk] = None
            lottery.isFinished = True
            lottery.save()


        return Response(status=status.HTTP_204_NO_CONTENT)

class CreateSlotBatch(APIView):
    
    def post(self, request, *args, **kwargs):
        DEFAULT_SLOT_INTERVAL = 20
        DEFAULT_SLOT_AMOUNT = 12
        DEFAULT_LOCATION = "Conference Room 3A"

        MINUTE = timedelta(minutes=1)

        amount = DEFAULT_SLOT_AMOUNT
        interval = DEFAULT_SLOT_INTERVAL

        lottery = Lottery.objects.create(location=DEFAULT_LOCATION)
        startTimeArray = request.data['startTimes']
        for startTime in startTimeArray:
            startTimeObject = datetime.strptime(startTime,'%Y-%m-%dT%H:%M:%S.%fZ')
            for i in xrange(amount):
                slot = Slot()
                slot.lottery = lottery
                slot.startTime = startTimeObject + i * interval * MINUTE
                slot.save()

        # allAccounts = Account.objects.all()
        # allSlots = Slot.objects.filter(lottery=lottery)
        # for account in allAccounts:
        #     slot = random.choice(allSlots)
        #     slot.entries.add(account)
        #     slot.save()

        return Response({'lotteryId':lottery.id})

class CreateAccountBatch(APIView):

    def post(self, request, *args, **kwargs):
        faker = Faker()
        for i in xrange(100):
            fake_name = faker.name().split(" ")
            Account.objects.create(
                email=fake_name[0]+"."+fake_name[1]+"@wework.com",
                firstName=fake_name[0],
                lastName=fake_name[1]
            )
        return Response({'status':'ok'})

class LotterySelection(APIView):

    def get(self, request, lotteryId, *args, **kwargs):
        lottery = get_object_or_404(Lottery.objects.all(), pk=lotteryId)
        
        header = request.META['HTTP_AUTHORIZATION'].replace("Bearer ", "")
        jwtHeader = jwt.decode(header, verify=False)
        
        account, created = Account.objects.get_or_create(
            email=jwtHeader['email'],
            firstName=jwtHeader['given_name'],
            lastName=jwtHeader['family_name']
        )

        prevSlots = account.slotsRegistered.filter(lottery=lottery).values_list('pk',flat=True)
        if len(prevSlots) > 0:
            selectedSlotId = prevSlots[0]
        else:
            selectedSlotId = None
        return Response({'selectedSlotId': selectedSlotId})


class Email():

    def sendEmail(self, user_email, send_at, slot_location, slot_time):
        try:
            message = {
                'subject': 'Congratulations! You Won The Massage Lottery',
                # 'text': 'You are getting a massage!',
                'html': '<h3>So, it seems like you are getting a massage</h3><h4>Be at '
                + slot_location + ' on </h4><h3>' + slot_time + '</h3> <p><img src="https://media.giphy.com/media/GqrLv648FAFkk/giphy.gif" width="636" height="341"></p><h1>Enjoy!</h1>',
                "from_email": "no.reply@wework.com",
                "from_name": "NYCHQ Community Team",
                'to': [{
                    'email': user_email,
                     'name': user_email,
                     'type': 'to'
                },],
                "async": False,
                "ip_pool": "Main Pool",
                "send_at": send_at,
                "return_path_domain": None
            }

            mandrill_client.messages.send(
                message=message, 
                async=False, 
                ip_pool='Main Pool', 
                send_at='2018-07-15 12:00:00'
            )

        except mandrill.Error, e:
            # Mandrill errors are thrown as exceptions
            print 'A mandrill error occurred: %s - %s' % (e.__class__, e)
            # A mandrill error occurred: <class 'mandrill.UnknownSubaccountError'> - No subaccount exists with the id 'customer-123'
            raise



