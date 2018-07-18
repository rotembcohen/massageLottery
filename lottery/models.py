# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

class Account(models.Model):
	email = models.EmailField(max_length=255)
	firstName = models.CharField(max_length=255, blank=True, null=True)
	lastName = models.CharField(max_length=255, blank=True, null=True)
	winCount = models.PositiveIntegerField(default=0)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	def __unicode__(self):
		return self.firstName + " " + self.lastName

class Lottery(models.Model):
	isFinished = models.BooleanField(default=False)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	def __unicode__(self):
		return self.createdAt.strftime("%Y-%m-%d %H:%M:%S");

class Slot(models.Model):
	lottery = models.ForeignKey(Lottery, related_name='slots', on_delete=models.CASCADE)
	startTime = models.DateTimeField()
	registeredAccounts = models.ManyToManyField(Account, related_name='slotsRegistered', blank=True)
	selectedAccount = models.ForeignKey(
		Account, 
		related_name='slotsWon', 
		on_delete=models.CASCADE, 
		blank=True, 
		null=True
	)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	def __unicode__(self):
		if (self.selectedAccount):
			return self.startTime.strftime("%Y-%m-%d %H:%M:%S") + " - " + self.selectedAccount.email
		return self.startTime.strftime("%Y-%m-%d %H:%M:%S")


