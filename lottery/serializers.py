from .models import Lottery, Slot, Account
from rest_framework import serializers

class AccountSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Account
        fields = ('email', )


class SlotSerializer(serializers.ModelSerializer):
    winner = serializers.StringRelatedField(read_only=True, )
    entries = serializers.StringRelatedField(many=True, allow_empty=True, )
    entryCount = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = ('id', 'winner', 'entries', 'entryCount', 'startTime', )

    def get_entryCount(self, obj):
        return obj.entries.count()


class LotterySerializer(serializers.ModelSerializer):
    slots = SlotSerializer(many=True, read_only=True, allow_empty=True)

    class Meta:
        model = Lottery
        exclude = ('createdAt', 'updatedAt')
