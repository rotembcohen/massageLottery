from .models import Lottery, Slot, Account
from rest_framework import serializers

class AccountSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Account
        fields = ('email', )


class SlotSerializer(serializers.HyperlinkedModelSerializer):
    selectedAccount = serializers.StringRelatedField(read_only=True, )
    registeredAccounts = serializers.StringRelatedField(many=True, allow_empty=True, )
    registeredCount = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = ('pk', 'selectedAccount', 'registeredAccounts', 'registeredCount')

    def get_registeredCount(self, obj):
        return obj.registeredAccounts.count()


class LotterySerializer(serializers.HyperlinkedModelSerializer):
    slots = SlotSerializer(many=True, read_only=True, allow_empty=True)

    class Meta:
        model = Lottery
        exclude = ('createdAt', 'updatedAt')
