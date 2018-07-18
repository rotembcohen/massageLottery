# -*- coding: utf-8 -*-
from __future__ import unicode_literals
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
        addEmail = request.data['addEmail']
        addFirst = request.data['addFirst']
        addLast = request.data['addLast']
        obj, created = Account.objects.get_or_create(
            email=addEmail,
            firstName=addFirst,
            lastName=addLast
        )
        if obj not in slot.registeredAccounts.all():
            slot.registeredAccounts.add(obj)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LotteryViewSet(viewsets.ModelViewSet):
    queryset = Lottery.objects.all()
    serializer_class = LotterySerializer

class CreateSlotBatch(APIView):
    
    def post(self, request, *args, **kwargs):
        DEFAULT_SLOT_INTERVAL = 20
        DEFAULT_SLOT_AMOUNT = 9
        MINUTE = timedelta(minutes=1)

        amount = DEFAULT_SLOT_AMOUNT
        interval = DEFAULT_SLOT_INTERVAL

        lottery = Lottery.objects.create()
        startTimeObject = datetime.strptime(request.data['startTime'],'%Y-%m-%dT%H:%M:%S.%fZ')

        for i in xrange(amount):
            slot = Slot()
            slot.lottery = lottery
            slot.startTime = startTimeObject + i * interval * MINUTE
            slot.save()

        return Response({'lotteryId':lottery.id})