"""
Users app serializers.

Rules (from CONVENTIONS.md):
- Serializers validate and transform only — no business logic here
- Business logic lives exclusively in services.py
"""

from rest_framework import serializers

from users.models import User, UserRole


# ---------------------------------------------------------------------------
# Auth serializers
# ---------------------------------------------------------------------------

class MagicLinkRequestSerializer(serializers.Serializer):
    """Validates the email for POST /auth/magic-link/"""
    email = serializers.EmailField()


# ---------------------------------------------------------------------------
# User profile serializers
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """
    Full user profile — returned by /auth/me/ and /auth/verify/.
    Used for the currently authenticated user.
    """
    club_rank = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'is_cu_student',
            'student_uid',
            'batch',
            'phone',
            'institution',
            'degree_type',
            'graduation_year',
            'club_points',
            'club_rank',
            'github_url',
            'linkedin_url',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_cu_student', 'club_points', 'club_rank']

    def get_club_rank(self, obj):
        if hasattr(obj, 'annotated_club_rank'):
            return obj.annotated_club_rank
        if getattr(obj, 'club_points', None) is None:
            return None
        # Rank is number of users with strictly more points + 1
        return User.objects.filter(club_points__gt=obj.club_points).count() + 1


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Validates updates to a user's own profile via PATCH /users/me/
    Email and role cannot be changed via this endpoint.
    """

    class Meta:
        model = User
        fields = [
            'full_name',
            'student_uid',
            'batch',
            'phone',
            'institution',
            'degree_type',
            'graduation_year',
            'github_url',
            'linkedin_url',
        ]

    def validate_graduation_year(self, value):
        if value is not None and not (2020 <= value <= 2040):
            raise serializers.ValidationError('Graduation year must be between 2020 and 2040.')
        return value

    def validate_phone(self, value):
        if value is not None:
            normalized = value.replace(' ', '').replace('-', '')
            check_val = normalized[1:] if normalized.startswith('+') else normalized
            if not check_val.isdigit() or len(check_val) < 7 or len(check_val) > 15:
                raise serializers.ValidationError(
                    'Enter a valid phone number (7–15 digits).'
                )
            return normalized
        return value


class UserListSerializer(serializers.ModelSerializer):
    """
    Compact user representation — returned by admin's GET /users/ list.
    """

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'is_cu_student',
            'date_joined',
        ]
        read_only_fields = fields


class UserRoleSerializer(serializers.Serializer):
    """
    Validates the role field for PATCH /users/{id}/role/
    """
    role = serializers.ChoiceField(choices=UserRole.choices)
