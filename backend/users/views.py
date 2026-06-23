from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import login, logout
from sesame.utils import get_user
from rest_framework.authtoken.models import Token
from .services import send_magic_link
from .models import User

class MagicLinkView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Email is required.", "fields": {"email": "Enter a valid email address."}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        send_magic_link(email)
        
        return Response({
            "message": "Magic link sent. Check your email.",
            "email": email
        })

class VerifyMagicLinkView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response(
                {"error": {"code": "INVALID_TOKEN", "message": "This link is invalid or has expired. Please request a new one."}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_user(token)
        if user is None:
            return Response(
                {"error": {"code": "INVALID_TOKEN", "message": "This link is invalid or has expired. Please request a new one."}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # We no longer use session login for the frontend, we use Token Auth
        token_obj, created = Token.objects.get_or_create(user=user)
        
        return Response({
            "token": token_obj.key,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_cu_student": user.is_cu_student
            }
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        logout(request) # Also clear session if it exists
        return Response({"message": "Logged out successfully."})

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_cu_student": user.is_cu_student,
            "student_uid": user.student_uid,
            "branch": user.branch,
            "year": user.year,
            "semester": user.semester,
            "batch": user.batch,
            "phone": user.phone
        })

    def patch(self, request):
        user = request.user
        allowed_fields = ['full_name', 'student_uid', 'branch', 'year', 'semester', 'batch', 'phone']
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return self.get(request)
