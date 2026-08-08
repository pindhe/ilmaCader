from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.families.models import FamilyMembership


ROLE_RANK = {
    "member": 1,
    "admin": 2,
}

ROLE_ALIASES = {
    "viewer": "member",
    "family_member": "member",
    "family_admin": "admin",
    "super_admin": "admin",
}


def normalize_role(role):
    if not role:
        return "member"
    return ROLE_ALIASES.get(role, role)


def get_membership(user, family_id):
    if not user or not user.is_authenticated:
        return None
    membership = (
        FamilyMembership.objects.filter(user=user, family_id=family_id, is_active=True)
        .select_related("family")
        .first()
    )
    if membership:
        return membership
    if user.is_superuser:
        return type("M", (), {"role": "admin", "is_active": True})()
    return None


def user_has_min_role(user, family_id, min_role):
    membership = get_membership(user, family_id)
    if not membership:
        return False
    user_role = normalize_role(membership.role)
    required = normalize_role(min_role)
    return ROLE_RANK.get(user_role, 0) >= ROLE_RANK.get(required, 0)


def is_admin_user(user, family_id=None):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if family_id:
        return user_has_min_role(user, family_id, "admin")
    return normalize_role(getattr(user, "role", None)) == "admin"


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsFamilyAdmin(BasePermission):
    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return is_admin_user(request.user)
        return user_has_min_role(request.user, family_id, "admin")


class IsFamilyMember(BasePermission):
    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return request.user.is_authenticated
        return user_has_min_role(request.user, family_id, "member")


class ReadOnlyOrFamilyAdmin(BasePermission):
    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return request.user.is_authenticated
        if request.method in SAFE_METHODS:
            return user_has_min_role(request.user, family_id, "member")
        return user_has_min_role(request.user, family_id, "admin")


class IsFamilyContributor(BasePermission):
    """Family members and admins can read/write (object scoping done in views)."""

    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return request.user.is_authenticated
        return user_has_min_role(request.user, family_id, "member")
