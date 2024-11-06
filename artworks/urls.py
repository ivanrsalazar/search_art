# artworks/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.artwork_search_view, name='artwork_search'),
    path('artwork/<int:artwork_id>/', views.artwork_detail_view, name='artwork_detail'),
]