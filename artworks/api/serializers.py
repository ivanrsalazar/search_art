from rest_framework import serializers
from ..models import Artwork, Like

class ArtworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artwork
        fields = ['title', 'artist', 'date', 'medium', 'dimensions', 'image_url', 'description', 'all_required','api_source']

class LikeSerializer(serializers.ModelSerializer):
    artwork = ArtworkSerializer()

    class Meta:
        model = Like
        fields = ['user', 'artwork', 'created_at']

