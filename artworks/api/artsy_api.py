# artworks/api/artsy_api.py

from .base_api import BaseAPI
from .artwork import Artwork
from typing import Any, Dict, List, Optional
import os
import asyncio

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
            print(f"Authentication error: {e}")
            raise

    async def search_artworks(self, query):
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
            'offset': 0
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
        Retrieves artwork details and returns a list of Artwork instances.
        """
        if not self.token:
            await self.authenticate()

        headers = {
            "X-Xapp-Token": self.token
        }

        # Filter only artworks
        artwork_objects = [obj for obj in objects if obj.get('type') == "artwork"]

        # Create tasks for fetching individual artworks
        tasks = [self.get_single_artwork(obj, headers) for obj in artwork_objects]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        artworks = []
        for result in results:
            if isinstance(result, Exception):
                print(f"Error fetching single artwork: {result}")
                continue
            if result:
                artworks.append(result)

        return artworks

    async def get_single_artwork(self, obj: Dict[str, Any], headers: Dict[str, str]) -> Optional[Artwork]:
        """
        Retrieves details for a single artwork and returns an Artwork instance.
        """
        artwork = Artwork()
        try:
            # Extract and format image URL
            thumbnail_url = obj['_links']['thumbnail']['href']
            normalized_image_url = thumbnail_url.replace("square.jpg", "normalized.jpg")
            artwork.image_url = normalized_image_url

            # Extract and format title and artist
            title_parts = obj['title'].split(',')
            artwork.artist = title_parts[0].strip() if len(title_parts) > 0 else ''
            artwork.title = ','.join(title_parts[1:]).strip() if len(title_parts) > 1 else obj['title']

            # Extract and format medium and dimensions
            description = obj.get('description', '')
            description_parts = description.split(',') if description else []
            artwork.medium = description_parts[0].strip() if len(description_parts) > 0 else ''
            artwork.dimensions = ','.join(description_parts[1:]).strip() if len(description_parts) > 1 else ''
            artwork.id = obj['_links']['self']['href'].replace("https://api.artsy.net/api/artworks/","")
            # Set additional fields
            artwork.api_source = 'Artsy'
            artwork.all_required = artwork.is_complete()
        except KeyError as e:
            print(f"KeyError while processing artwork: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error while processing artwork: {e}")
            return None

        return artwork

    async def get_image(self, image_url: str) -> Optional[str]:
        """
        Fetches the image from the given URL and returns the image URL.
        """
        if image_url:
            try:
                response = await self.get(endpoint=image_url.replace(self.base_url, ''), params=None)
                # Assuming the image URL is valid and accessible
                return image_url
            except Exception as e:
                print(f"Error fetching image from {image_url}: {e}")
                return None
        return None

    