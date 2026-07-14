"""
Team app services.
All business logic for club team member management.
"""

import logging
import uuid

from core.exceptions import AppError
from core.utils.storage import upload_to_blob
from team.models import TeamMember

logger = logging.getLogger(__name__)


def create_team_member(validated_data: dict) -> TeamMember:
    """Create a new club team member."""
    member = TeamMember.objects.create(**validated_data)
    logger.info('Team member created: %s', member.full_name)
    return member


def update_team_member(member: TeamMember, validated_data: dict) -> TeamMember:
    """Partial update of a club team member. Only updates provided fields."""
    for field, value in validated_data.items():
        setattr(member, field, value)
    member.save(update_fields=list(validated_data.keys()) + ['updated_at'])
    logger.info('Team member updated: %s', member.full_name)
    return member


def delete_team_member(member: TeamMember) -> None:
    """
    Hard delete — completely removes the record.
    """
    member_name = member.full_name
    member.delete()
    logger.info('Team member deleted: %s', member_name)


def upload_team_photo(member: TeamMember, file) -> TeamMember:
    """
    Validate and upload a team member photo to Azure Blob Storage.

    File validation (type/size) is done in the serializer.
    """
    ext_map = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}
    ext = ext_map.get(file.content_type, 'jpg')
    blob_path = f'team-photos/{member.id}/photo.{ext}'

    url = upload_to_blob(blob_path=blob_path, file_data=file.read(), content_type=file.content_type)
    member.photo_url = url
    member.save(update_fields=['photo_url', 'updated_at'])
    logger.info('Team photo uploaded for %s: %s', member.full_name, url)
    return member


def get_team_member_or_404(member_id: uuid.UUID) -> TeamMember:
    """Get any team member by ID (including inactive). Admin use."""
    try:
        return TeamMember.objects.get(pk=member_id)
    except TeamMember.DoesNotExist:
        raise AppError('NOT_FOUND', 'Team member not found.', 404) from None
