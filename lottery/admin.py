# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import Account, Lottery, Slot

admin.site.register(Account)
admin.site.register(Lottery)
admin.site.register(Slot)

