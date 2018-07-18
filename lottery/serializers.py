from .models import Lottery, Slot, Account
from rest_framework import serializers

class AccountSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Lottery
        fields = '__all__'


class SlotSerializer(serializers.HyperlinkedModelSerializer):
    selectedAccount = AccountSerializer(read_only=True)
    registeredAccounts = AccountSerializer(many=True, read_only=True, allow_empty=True)
    reg_count = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        exclude = ('createdAt', 'updatedAt', 'lottery', )

    def get_reg_count(self, obj):
        return obj.registeredAccounts.count()


class LotterySerializer(serializers.HyperlinkedModelSerializer):
    slots = SlotSerializer(many=True, read_only=True, allow_empty=True)

    class Meta:
        model = Lottery
        exclude = ('createdAt', 'updatedAt')
