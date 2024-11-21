# artworks/api/artic_api.py
from ..models import Artwork  # Import the Django Artwork model
from .base_api import BaseAPI
from typing import Any, Dict, Optional, List
import asyncio
from django.db import IntegrityError
from .serializers import ArtworkSerializer
from asgiref.sync import sync_to_async  # Import sync_to_async

class ArticAPI(BaseAPI):
    """
    API client for the Art Institute of Chicago API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.artic.edu/api/v1", api_key=api_key)

    async def search_artworks(self, search_term: str, page=1) -> List[Dict[str, Any]]:
        endpoint = "/artworks/search"
        params = {"q": search_term, 'limit': 25, 'offset':(page-1)*25}
        json_response = await self.get(endpoint=endpoint, params=params)
        return json_response.get('data', [])
    
    async def get_artworks(self, works: List[Dict[str, Any]]) -> List[Artwork]:
        """
        Retrieves artwork details, saves them to the database, and returns a list of Artwork model instances.
        """
        artworks = []
        seen_image_urls = set()  # Set to keep track of unique image URLs
        
        # Create tasks for concurrent execution
        tasks = [self.get_and_save_artwork(work) for work in works]
        
        # Await all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if result is None:
                print("result is None")
            elif isinstance(result, Artwork) and result.image_url not in seen_image_urls:
                artworks.append(result)
                seen_image_urls.add(result.image_url)
            else:
                print(f"(Artic): URL already seen: {result.image_url}")
        
        return artworks


    @sync_to_async
    def get_existing_artwork(self, image_url: str):
        return Artwork.objects.filter(image_url=image_url).first()

    async def get_and_save_artwork(self, work: Dict[str, Any]) -> Optional[Artwork]:
        """
        Retrieves details for a single artwork, saves it as a Django Artwork model, and returns the instance.
        """
        try:
            work_id = work['id']
            endpoint = f"/artworks/{work_id}?fields=id,title,image_id,date_display,artist_display,medium_display,dimensions,dimensions_display,artist_title"
            json_response = await self.get(endpoint)
            work_details = json_response.get("data", {})
            artist_name = work_details.get('artist_display')
            image_id = work_details.get('image_id')
            image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/1686,/0/default.jpg'
            artwork_title = work_details.get('title')
            date = work_details.get('date_display')
            medium = work_details.get('medium_display')
            dimensions = work_details.get('dimensions')
            all_required = True
            existing_artwork = await self.get_existing_artwork(image_url=image_url)  # Use the async function here
            print(f"Artic: existing artwork: {image_url}: {existing_artwork}")
            if existing_artwork:
                print(f"Artwork with image_url {existing_artwork.image_url} already exists. Returning existing artwork.")
                return existing_artwork  # Return the existing artwork if found None")
        

            # Create the Django Artwork model instance
            artwork_model = Artwork(
                api_source='Artic',
                title=artwork_title,
                artist=artist_name,
                date=date,
                medium=medium,
                dimensions=dimensions,
                image_url=image_url,
                all_required=True  # Assuming the data is complete; adjust this logic if needed
            )
            # Save the Artwork model instance using sync_to_async
            await sync_to_async(artwork_model.save)()  # Offload save to a sync thread
            print("Artic: artwork added")
        except KeyError as e:
            print(f"KeyError while processing artwork: {e}")
            return None
        except IntegrityError as e:
            print(f"IntegrityError: Artwork with image_url {image_url} already exists. Skipping save.")
            # If an IntegrityError occurs, check again if the artwork exists
            existing_artwork = await self.get_existing_artwork(image_url)  # Ensure we use the async function
            if existing_artwork:
                print("artwork exists")
                return existing_artwork  # Return the existing artwork if found
            return None 
        except Exception as e:
            print(f"Unexpected error while processing artwork: {e} Artic")
            return None
        
        return artwork_model  # Return the saved Artwork model instance

    