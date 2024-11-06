# artworks/urls.py

from django.urls import path
from .views import artwork_search_view, home_view, artwork_detail_view, get_image_view

urlpatterns = [
    path('', home_view, name='home'),
    path('search/', artwork_search_view, name='artwork_search'),
    path('artwork/<int:artwork_id>/', artwork_detail_view, name='artwork_detail'),
    path('get_image/', get_image_view, name='get_image'),
]