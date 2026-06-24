"""
Standard pagination class used across all list endpoints.
Registered in settings.py as REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS'].
Produces the response shape documented in API_SPEC.md:

    {
        "count": 100,
        "next": "https://api.csquare.in/api/events/?page=2",
        "previous": null,
        "results": [...]
    }
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
