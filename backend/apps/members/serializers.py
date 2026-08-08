from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.families.models import FamilyMembership
from apps.members.models import FamilyMember, Relationship


class FamilyMemberSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    access_role = serializers.ChoiceField(
        choices=[("admin", "Admin"), ("member", "Member")],
        write_only=True,
        required=False,
        default="member",
    )
    create_login = serializers.BooleanField(write_only=True, required=False, default=True)

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
            "password",
            "access_role",
            "create_login",
        )
        read_only_fields = (
            "id",
            "family",
            "user",
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

    def validate(self, attrs):
        create_login = attrs.get("create_login", True)
        password = attrs.get("password") or ""
        email = (attrs.get("email") or getattr(self.instance, "email", "") or "").strip().lower()
        if self.instance is None and create_login:
            if not email:
                raise serializers.ValidationError({"email": "Email is required to create a login."})
            if not password:
                raise serializers.ValidationError(
                    {"password": "Password is required to create a login."}
                )
            validate_password(password)
            if User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError(
                    {"email": "A user with this email already exists."}
                )
        attrs["email"] = email
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", "")
        access_role = validated_data.pop("access_role", "member") or "member"
        create_login = validated_data.pop("create_login", True)
        family = validated_data.get("family")

        user = None
        if create_login and validated_data.get("email") and password:
            role = User.Role.ADMIN if access_role == "admin" else User.Role.MEMBER
            user = User.objects.create_user(
                username=validated_data["email"],
                email=validated_data["email"],
                password=password,
                full_name=validated_data.get("full_name", ""),
                phone=validated_data.get("phone", ""),
                role=role,
                email_verified=True,
            )
            FamilyMembership.objects.create(
                family=family,
                user=user,
                role=(
                    FamilyMembership.Role.ADMIN
                    if access_role == "admin"
                    else FamilyMembership.Role.MEMBER
                ),
                is_active=True,
            )

        return FamilyMember.objects.create(user=user, **validated_data)


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

        if from_member and to_member and from_member.id == to_member.id:
            raise serializers.ValidationError("A member cannot have a relationship with themselves.")
        if family and from_member and from_member.family_id != family.id:
            raise serializers.ValidationError("from_member must belong to the same family.")
        if family and to_member and to_member.family_id != family.id:
            raise serializers.ValidationError("to_member must belong to the same family.")
        return attrs
