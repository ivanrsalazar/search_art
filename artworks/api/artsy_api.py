# artworks/api/artsy_api.py

from ..models import Artwork
from .base_api import BaseAPI
from typing import Any, Dict, List, Optional
import os
import asyncio
from django.db import IntegrityError, transaction
from .serializers import ArtworkSerializer
from asgiref.sync import sync_to_async
import logging

logger = logging.getLogger(__name__)

class ArtsyAPI(BaseAPI):
    """
    API client for the Artsy API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.artsy.net/", api_key=api_key)
        self.public_key = os.getenv("ARTSY_PUBLIC_KEY")
        self.private_key = os.getenv("ARTSY_PRIVATE_KEY")
        self.token = None  # Will be set after authentication

    async def authenticate(self):
        """
        Authenticates with the Artsy API to obtain an Xapp token.
        """
        endpoint = 'api/tokens/xapp_token'
        data = {
            "client_id": self.public_key,
            "client_secret": self.private_key
        }
        try:
            json_response = await self.post(endpoint=endpoint, data=data)
            if json_response and "token" in json_response:
                self.token = json_response["token"]
                self.headers["X-Xapp-Token"] = self.token  # Update headers with the token
            else:
                raise ValueError("Authentication failed: No token received.")
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise

    async def search_artworks(self, query, page=1):
        """
        Search for artworks using Artsy API.
        """
        if not self.token:
            await self.authenticate()
        endpoint = "api/search"
        params = {
            'q': query,
            'size': 10,
            'type': "artwork",
            'offset': (page - 1) * 30
        }
        headers = {
            "X-Xapp-Token": self.token
        }

        results = []
        for _ in range(3):
            json_response = await self.get(endpoint=endpoint, params=params, headers=headers)
            results.extend(json_response["_embedded"]["results"])
            params['offset'] += 10
        return results

    async def get_artworks(self, objects: List[Dict[str, Any]]) -> List[Artwork]:
        """
        Retrieves artwork details and saves them as Artwork model instances.
        """
        if not self.token:
            await self.authenticate()

        artworks = []
        seen_image_urls = set()
        semaphore = asyncio.Semaphore(1)  # Limit concurrency

        async def get_and_save_with_limit(obj):
            async with semaphore:
                return await self.get_and_save_artwork(obj)

        tasks = [get_and_save_with_limit(obj) for obj in objects]
        results = await asyncio.gather(*tasks)

        for result in results:
            if result is None:
                logger.info("Result is None, skipping.")
                continue
            if isinstance(result, Artwork):
                if result.image_url not in seen_image_urls:
                    artworks.append(result)
                    seen_image_urls.add(result.image_url)
                else:
                    logger.info(f"Duplicate image_url detected: {result.image_url}")
            else:
                logger.warning(f"Unexpected result type: {type(result)}")

        return artworks

    async def get_and_save_artwork(self, obj: Dict[str, Any]) -> Optional[Artwork]:
        """
        Retrieves details for a single artwork, saves it as a Django Artwork model, and returns the instance.
        """
        try:
            # Normalize the thumbnail URL to derive the image URL
            thumbnail_url = obj['_links']['thumbnail']['href']
            image_url = thumbnail_url.replace("square.jpg", "normalized.jpg")

            # Parse title and artist details
            title_parts = obj['title'].split(',')
            artist_name = title_parts[0].strip() if len(title_parts) > 0 else ''
            artwork_title = ','.join(title_parts[1:]).strip() if len(title_parts) > 1 else obj['title']

            # Extract other details
            description = obj.get('description', '')
            description_parts = description.split(',') if description else []
            medium = description_parts[0].strip() if len(description_parts) > 0 else ''
            dimensions = ','.join(description_parts[1:]).strip() if len(description_parts) > 1 else ''
            date = obj.get('date_display')

            # Use atomic transaction to prevent race conditions
            @sync_to_async
            def get_or_create_artwork():
                try:
                    artwork, created = Artwork.objects.get_or_create(
                        image_url=image_url,
                        defaults={
                            'api_source': 'Artsy',
                            'title': artwork_title,
                            'artist': artist_name,
                            'date': date,
                            'medium': medium,
                            'dimensions': dimensions,
                            'description': description,
                            'all_required': True
                        }
                    )
                    return artwork, created
                except IntegrityError as e:
                    logger.error(f"IntegrityError when creating artwork: {e}")
                    # Attempt to retrieve the artwork
                    try:
                        artwork = Artwork.objects.get(image_url=image_url)
                        return artwork, False
                    except Artwork.DoesNotExist as e2:
                        logger.error(f"Artwork with image_url {image_url} does not exist after IntegrityError: {e2}")
                        # Possible database inconsistency, re-raise exception
                        raise

            artwork_model, created = await get_or_create_artwork()
            logger.info(f"{'Created' if created else 'Retrieved'} artwork with image_url {image_url}")
            return artwork_model

        except Exception as e:
            logger.error(f"Error processing artwork: {e}")
            return None

    async def get_image(self, image_url: str) -> Optional[str]:
        """
        Fetches the image from the given URL and returns the image URL.
        """
        if image_url:
            try:
                response = await self.get(endpoint=image_url.replace(self.base_url, ''), params=None)
                return image_url  # Assuming the image URL is valid and accessible
            except Exception as e:
                logger.error(f"Error fetching image from {image_url}: {e}")
                return None
        return None