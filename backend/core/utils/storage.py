"""
Azure Blob Storage utility.

All file uploads go through this module — validate first in views/services,
then call upload_to_blob() here.

Blob containers used:
  - event-banners/{event_id}/banner.{ext}
  - qr-codes/{registration_id}/qr.png
  - team-photos/{member_id}/photo.{ext}
"""

import logging
from io import BytesIO

from django.conf import settings

logger = logging.getLogger(__name__)


def _get_bytes(file_data: bytes | BytesIO) -> bytes:
    if isinstance(file_data, BytesIO):
        file_data.seek(0)
        return file_data.read()
    return file_data


def upload_to_blob(blob_path: str, file_data: bytes | BytesIO, content_type: str) -> str:
    """
    Upload a file to Azure Blob Storage.

    Args:
        blob_path: The path within the container, e.g. 'qr-codes/uuid/qr.png'
        file_data: Raw bytes or a BytesIO object
        content_type: MIME type, e.g. 'image/png'

    Returns:
        The public URL of the uploaded blob.

    Raises:
        AppError with code='STORAGE_ERROR' if upload fails.
    """
    from core.exceptions import AppError

    connection_string = getattr(settings, 'AZURE_STORAGE_CONNECTION_STRING', None)
    container_name = getattr(settings, 'AZURE_STORAGE_CONTAINER_NAME', None)

    if not connection_string:
        if not settings.DEBUG:
            raise AppError(
                code='STORAGE_ERROR',
                message='Azure storage connection string not configured in production.',
                status=500,
            )
        # Stub mode for local development without Azure credentials: save to MEDIA_ROOT
        logger.warning('AZURE_STORAGE_CONNECTION_STRING not set. Saving to local MEDIA_ROOT instead.')
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os

        data = _get_bytes(file_data)

        # Save file locally
        path = default_storage.save(blob_path, ContentFile(data))
        
        # Build absolute URL using localhost:8000
        return f"http://localhost:8000{default_storage.url(path)}"

    try:
        from azure.storage.blob import BlobServiceClient, ContentSettings

        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=blob_path,
        )

        data = _get_bytes(file_data)

        blob_client.upload_blob(
            data,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )

        # Construct the public URL
        account_name = blob_service_client.account_name
        return (
            f'https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}'
        )

    except Exception as exc:
        logger.exception('Azure Blob Storage upload failed for path %s: %s', blob_path, exc)
        raise AppError(
            code='STORAGE_ERROR',
            message='File upload failed. Please try again.',
            status=500,
        ) from exc


def delete_blob(blob_path: str) -> None:
    """
    Delete a blob from Azure Blob Storage.
    Silently no-ops if the blob doesn't exist.
    """
    connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
    container_name = settings.AZURE_STORAGE_CONTAINER_NAME

    if not connection_string:
        logger.warning('AZURE_STORAGE_CONNECTION_STRING not set. Delete skipped.')
        return

    try:
        from azure.storage.blob import BlobServiceClient

        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_path
        )
        blob_client.delete_blob(delete_snapshots='include')
    except Exception as exc:
        logger.warning('Azure Blob Storage delete failed for path %s: %s', blob_path, exc)


def delete_blob_from_url(url: str) -> None:
    """
    Given an Azure Blob Storage public URL, extract the blob path and delete it.
    Also handles local media (localhost:8000/media/...) for dev mode.
    Silently no-ops if the URL is empty, not Azure, or deletion fails.
    """
    if not url:
        return

    from urllib.parse import urlparse
    parsed = urlparse(url)

    # Local dev media file
    if parsed.netloc in ('localhost:8000', '127.0.0.1:8000') and parsed.path.startswith('/media/'):
        try:
            from django.core.files.storage import default_storage
            path = parsed.path.replace('/media/', '', 1)
            if default_storage.exists(path):
                default_storage.delete(path)
        except Exception as exc:
            logger.warning('Local media delete failed for %s: %s', url, exc)
        return

    # Azure Blob Storage URL: https://<account>.blob.core.windows.net/<container>/<blob_path>
    if parsed.netloc.endswith('.blob.core.windows.net'):
        # Strip leading slash and split off container name
        path_parts = parsed.path.lstrip('/').split('/', 1)
        if len(path_parts) == 2:
            container = path_parts[0]
            if container == getattr(settings, 'AZURE_STORAGE_CONTAINER_NAME', None):
                blob_path = path_parts[1]  # everything after the container name
                delete_blob(blob_path)
            else:
                logger.warning('delete_blob_from_url: container mismatch for %s', url)
        return

    logger.debug('delete_blob_from_url: unrecognised URL scheme, skipping: %s', url)
