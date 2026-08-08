from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.core.mixins import FamilyScopedQuerysetMixin, SoftDeleteMixin
from apps.core.permissions import ReadOnlyOrFamilyAdmin, user_has_min_role
from apps.core.utils import api_response, log_activity, notify_family_members
from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer


class TaskViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Task.objects.select_related("family", "assigned_member", "created_by")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["status", "priority", "assigned_member", "family"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "priority", "status", "created_at", "title"]
    ordering = ["status", "due_date", "-priority"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        family_id = self.get_family_id()
        if family_id and not user_has_min_role(user, family_id, "admin"):
            return qs.filter(assigned_member__user=user)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Tasks retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(True, "Task retrieved.", self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        family_id = self.get_family_id()
        if not family_id:
            return api_response(
                False,
                "family query param or body field is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "family_member"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(family_id=family_id, created_by=request.user)
        log_activity(
            request,
            "Created task",
            module="tasks",
            family=task.family,
            details={"id": str(task.id), "title": task.title},
        )
        notify_family_members(
            task.family,
            "New task created",
            f'"{task.title}" was created.',
            notification_type="task",
            link=f"/tasks/{task.id}",
            exclude_user=request.user,
        )
        return api_response(
            True,
            "Task created.",
            self.get_serializer(task).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        task = self.get_object()
        if not user_has_min_role(request.user, task.family_id, "family_member"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(task, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(family=task.family)
        log_activity(
            request,
            "Updated task",
            module="tasks",
            family=task.family,
            details={"id": str(task.id)},
        )
        return api_response(True, "Task updated.", self.get_serializer(task).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not user_has_min_role(request.user, task.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def kanban(self, request):
        family_id = self.get_family_id()
        if not family_id:
            return api_response(
                False,
                "family query param is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        qs = self.filter_queryset(self.get_queryset().filter(family_id=family_id))
        grouped = {key: [] for key, _ in Task.Status.choices}
        serializer = self.get_serializer(qs, many=True)
        for item in serializer.data:
            status_key = item.get("status")
            if status_key in grouped:
                grouped[status_key].append(item)
            else:
                grouped.setdefault(status_key, []).append(item)
        return api_response(True, "Kanban board retrieved.", grouped)
