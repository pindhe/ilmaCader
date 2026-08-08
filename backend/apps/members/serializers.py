from rest_framework import serializers

from apps.members.models import FamilyMember, Relationship


class FamilyMemberSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = FamilyMember
        fields = (
            "id",
            "family",
            "user",
            "full_name",
            "profile_photo",
            "gender",
            "date_of_birth",
            "age",
            "phone",
            "email",
            "occupation",
            "education",
            "city",
            "country",
            "marital_status",
            "blood_type",
            "emergency_contact",
            "biography",
            "joined_date",
            "family_role",
            "is_archived",
            "is_deleted",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "family",
            "is_archived",
            "is_deleted",
            "created_at",
            "updated_at",
        )

    def get_age(self, obj):
        if not obj.date_of_birth:
            return None
        from django.utils import timezone

        today = timezone.now().date()
        born = obj.date_of_birth
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class RelationshipSerializer(serializers.ModelSerializer):
    from_member_name = serializers.CharField(source="from_member.full_name", read_only=True)
    to_member_name = serializers.CharField(source="to_member.full_name", read_only=True)

    class Meta:
        model = Relationship
        fields = (
            "id",
            "family",
            "from_member",
            "from_member_name",
            "to_member",
            "to_member_name",
            "relation_type",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        from_member = attrs.get("from_member") or getattr(self.instance, "from_member", None)
        to_member = attrs.get("to_member") or getattr(self.instance, "to_member", None)
        family = attrs.get("family") or getattr(self.instance, "family", None)

        if from_member and to_member and from_member.pk == to_member.pk:
            raise serializers.ValidationError("A member cannot have a relationship with themselves.")

        if family and from_member and from_member.family_id != family.id:
            raise serializers.ValidationError(
                {"from_member": "from_member must belong to the same family."}
            )
        if family and to_member and to_member.family_id != family.id:
            raise serializers.ValidationError(
                {"to_member": "to_member must belong to the same family."}
            )
        if from_member and to_member and from_member.family_id != to_member.family_id:
            raise serializers.ValidationError("Both members must belong to the same family.")
        return attrs
