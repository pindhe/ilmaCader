from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.families.models import FamilyMembership


ROLE_RANK = {
    "viewer": 1,
    "family_member": 2,
    "family_admin": 3,
    "super_admin": 4,
}


def get_membership(user, family_id):
    if not user or not user.is_authenticated:
        return None
    if getattr(user, "role", None) == "super_admin" or user.is_superuser:
        return type("M", (), {"role": "super_admin", "is_active": True})()
    return (
        FamilyMembership.objects.filter(
            user=user, family_id=family_id, is_active=True
        )
        .select_related("family")
        .first()
    )


def user_has_min_role(user, family_id, min_role):
    membership = get_membership(user, family_id)
    if not membership:
        return False
    return ROLE_RANK.get(membership.role, 0) >= ROLE_RANK.get(min_role, 0)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == "super_admin" or request.user.is_superuser)
        )


class IsFamilyAdmin(BasePermission):
    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return request.user.is_authenticated
        return user_has_min_role(request.user, family_id, "family_admin")


class IsFamilyMember(BasePermission):
    def has_permission(self, request, view):
        family_id = (
            view.kwargs.get("family_id")
            or request.query_params.get("family")
            or request.data.get("family")
        )
        if not family_id:
            return request.user.is_authenticated
        return user_has_min_role(request.user, family_id, "family_member")


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
            return user_has_min_role(request.user, family_id, "viewer")
        return user_has_min_role(request.user, family_id, "family_admin")
