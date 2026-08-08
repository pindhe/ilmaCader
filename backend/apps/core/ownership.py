from apps.core.permissions import user_has_min_role
from apps.members.models import FamilyMember


def get_user_member(user, family_id):
    if not user or not family_id:
        return None
    return (
        FamilyMember.objects.filter(
            user=user,
            family_id=family_id,
            is_deleted=False,
            is_archived=False,
        )
        .select_related("family")
        .first()
    )


def scope_to_own_member(qs, user, family_id, owner_field):
    """Admins see all; members see only rows linked to their FamilyMember."""
    if not family_id:
        return qs
    if user_has_min_role(user, family_id, "admin"):
        return qs
    member = get_user_member(user, family_id)
    if not member:
        return qs.none()
    return qs.filter(**{owner_field: member})


def attach_owner_on_create(serializer, user, family_id, owner_field, **extra):
    member = get_user_member(user, family_id)
    kwargs = dict(extra)
    if family_id:
        kwargs["family_id"] = family_id
    if "created_by" in [f.name for f in serializer.Meta.model._meta.fields]:
        kwargs["created_by"] = user
    # Members must own the record; admins can pass owner or leave unset
    if not user_has_min_role(user, family_id, "admin"):
        if not member:
            raise PermissionError("No member profile linked to this account.")
        kwargs[owner_field] = member
    elif owner_field not in serializer.validated_data and member:
        kwargs[owner_field] = member
    return serializer.save(**kwargs)
