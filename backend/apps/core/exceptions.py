from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
            message = detail["detail"]
            data = {"success": False, "message": str(message), "errors": detail}
        else:
            data = {
                "success": False,
                "message": "Validation error" if response.status_code == 400 else "Request failed",
                "errors": detail,
            }
        response.data = data
        return response

    return Response(
        {
            "success": False,
            "message": "Something went wrong",
            "errors": {"detail": str(exc)},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
