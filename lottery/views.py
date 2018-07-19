# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import random
import jwt
import json
from .models import Slot, Lottery, Account
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from .serializers import SlotSerializer, LotterySerializer, AccountSerializer
from datetime import datetime, timedelta
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status

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
        
            winners = {}
            for slot in slots:
                #TODO: add minimal wins filter
                if not lottery.isFinished:
                    minWinnersRegAccounts = slot.entries.all()
                    if minWinnersRegAccounts.count() > 0:
                        slot.winner = random.choice(minWinnersRegAccounts)
                        slot.save()
                if slot.winner:
                    winners[slot.pk] = slot.winner.email
                else:
                    winners[slot.pk] = None
            lottery.isFinished = True
            lottery.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

class CreateSlotBatch(APIView):
    
    def post(self, request, *args, **kwargs):
        DEFAULT_SLOT_INTERVAL = 20
        DEFAULT_SLOT_AMOUNT = 9
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

        return Response({'lotteryId':lottery.id})

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









