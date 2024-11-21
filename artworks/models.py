from django.db import models
from django.contrib.auth.models import User

class Artwork(models.Model):
    image_url = models.CharField(max_length=200, primary_key=True)
    api_source = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    date = models.CharField(max_length=255, null=True)
    medium = models.CharField(max_length=255)
    dimensions = models.CharField(max_length=255)
    image = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    all_required = models.BooleanField()

    def is_complete(self):
        """
        This method will check if the artwork object has all the required fields filled.
        """
        required_fields = [self.title, self.artist, self.date, self.medium, self.dimensions, self.image_url]
        
        # Check if all required fields are filled
        if not all(required_fields):
            self.all_required = False
            return False
        
        # You can also check if the `image` is a valid image in your model or skip based on requirements.
        if not self.image:
            self.all_required = False
            return False
        
        self.all_required = True
        return True

    def __str__(self):
        return f"{self.title} by {self.artist} ({self.date})"

    class Meta:
        # This is where you define your model's behavior (e.g., ordering, table name, etc.)
        verbose_name = 'Artwork'
        verbose_name_plural = 'Artworks'


class ArtworkLike(models.Model):
    artwork = models.ForeignKey(
        Artwork,
        on_delete=models.CASCADE,
        to_field='image_url',  # Use the new primary key
    )