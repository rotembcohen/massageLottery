from .models import Lottery, Slot, Account
from rest_framework import serializers

class AccountSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Account
        fields = ('email', )


class SlotSerializer(serializers.HyperlinkedModelSerializer):
    winner = serializers.StringRelatedField(read_only=True, )
    entries = serializers.StringRelatedField(many=True, allow_empty=True, )
    entryCount = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = ('pk', 'winner', 'entries', 'entryCount', )

    def get_entryCount(self, obj):
        return obj.entries.count()


class LotterySerializer(serializers.HyperlinkedModelSerializer):
    slots = SlotSerializer(many=True, read_only=True, allow_empty=True)

    class Meta:
        model = Lottery
        exclude = ('createdAt', 'updatedAt')
