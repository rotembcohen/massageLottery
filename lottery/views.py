# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import random
import jwt
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

class CreateSlotBatch(APIView):
    
    def post(self, request, *args, **kwargs):
        DEFAULT_SLOT_INTERVAL = 20
        DEFAULT_SLOT_AMOUNT = 9
        DEFAULT_LOCATION = "Conference Room 3A"

        MINUTE = timedelta(minutes=1)

        amount = DEFAULT_SLOT_AMOUNT
        interval = DEFAULT_SLOT_INTERVAL

        lottery = Lottery.objects.create(location=DEFAULT_LOCATION)
        startTimeObject = datetime.strptime(request.data['startTime'],'%Y-%m-%dT%H:%M:%S.%fZ')

        for i in xrange(amount):
            slot = Slot()
            slot.lottery = lottery
            slot.startTime = startTimeObject + i * interval * MINUTE
            slot.save()

        return Response({'lotteryId':lottery.id})

class RunLottery(APIView):

    def post(self, request, *args, **kwargs):
        lotteryId = request.data['lotteryId']
        lottery = get_object_or_404(Lottery.objects.all(), pk=lotteryId)
        slots = Slot.objects.filter(lottery=lottery)
        
        winners = {}
        for slot in slots:
            #TODO: add minimal wins filter
            if not lottery.isFinished:
                minWinnersRegAccounts = slot.entries.all()
                if minWinnersRegAccounts.count() > 0:
                    slot.winner = random.choice(minWinnersRegAccounts)
                    slot.save()
            winners[slot.pk] = slot.winner.email
        
        lottery.isFinished = True
        lottery.save()
        
        return Response({'winners':winners})








