from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import PermissionDenied


class AdministratorRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_administrator

    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            raise PermissionDenied("Administrator access required.")
        return super().handle_no_permission()


class UserOnlyMixin(LoginRequiredMixin):
    """Ensure object ownership for non-admins."""

    ownership_field = "user"

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        user = self.request.user
        if user.is_administrator:
            return obj
        owner = obj
        for part in self.ownership_field.split("."):
            owner = getattr(owner, part)
        if owner != user:
            raise PermissionDenied("You can only access your own records.")
        return obj
