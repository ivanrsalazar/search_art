# art_project/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('artworks.urls')),  # Include URLs from the artworks app

    # Catch-all pattern to serve React's index.html for any other routes
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]