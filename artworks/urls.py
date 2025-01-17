# artworks/urls.py

from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from .views import artwork_search_view, artwork_detail_view, get_image_view, register, login
from .views import (
    LikeArtworkView,
    UnlikeArtworkView,
    UserLikedArtworksView,
    twitter_login, twitter_callback, post_tweet
)
import os

urlpatterns = [
    path('api/search/', artwork_search_view, name='artwork_search'),
    path('api/artwork/<str:image_hash>/', artwork_detail_view, name='artwork_detail'),
    path('api/get-image/', get_image_view, name='get_image'),
    path('api/register/', register, name='register'),
    path('api/login/', login, name='login'),
    path('api/likes/user/', UserLikedArtworksView.as_view(), name='user-liked-artworks'),  # GET user's liked artworks
    path('api/likes/', LikeArtworkView.as_view(), name='like-artwork'),  # POST to like an artwork
    path('api/likes/<path:image_url>/', UnlikeArtworkView.as_view(), name='unlike-artwork'),  # DELETE to unlike an artwork
    path('api/twitter/login/', twitter_login, name='twitter-login'),
    path('api/twitter/callback/', twitter_callback, name='twitter-callback'),
    path('api/twitter/post/', post_tweet, name='post-tweet'),
]

if settings.DEBUG:
    # Serve static files during development
    urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'frontend', 'build', 'static'))
    # Serve root files like manifest.json
    urlpatterns += static('/manifest.json', document_root=os.path.join(settings.BASE_DIR, 'frontend', 'build', 'manifest.json'))
    urlpatterns += static('/logo192.png', document_root=os.path.join(settings.BASE_DIR, 'frontend', 'build', 'logo192.png'))

# Catch-all pattern to serve React's index.html for any other routes
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='index'),
]