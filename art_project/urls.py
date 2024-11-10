# art_project/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('artworks.urls')),  # Include URLs from the artworks app
    
]