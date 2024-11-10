# artworks/api/artic_api.py

from .base_api import BaseAPI
from .artwork import Artwork
from typing import Any, Dict, Optional, List
import asyncio

class ArticAPI(BaseAPI):
    """
    API client for the Art Institute of Chicago API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.artic.edu/api/v1", api_key=api_key)

    async def search_artworks(self, search_term: str) -> List[Dict[str, Any]]:
        endpoint = "/artworks/search"
        params = {"q": search_term, 'limit': 25}
        json_response = await self.get(endpoint=endpoint, params=params)
        return json_response.get('data', [])

    async def get_artworks(self, works: List[Dict[str, Any]]) -> List[Artwork]:
        """
        Retrieve artworks and return a list of Artwork instances.
        """
        artworks = []
        # Create tasks for concurrent execution
        tasks = [self.get_single_artwork(work['id']) for work in works]
        # Await all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Artwork):
                artworks.append(result)
        return artworks

    async def get_single_artwork(self, work_id: int) -> Optional[Artwork]:
        artwork = Artwork()
        endpoint = f"/artworks/{work_id}?fields=id,title,image_id,date_display,artist_display,medium_display,dimensions,dimensions_display,artist_title"
        json_response = await self.get(endpoint=endpoint)
        work_details = json_response.get("data", {})
        artwork.artist = work_details.get('artist_display')
        image_id = work_details.get('image_id')
        artwork.id = work_id
        artwork.image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/1686,/0/default.jpg' if image_id else None
        artwork.title = work_details.get('title')
        artwork.date = work_details.get('date_display')
        artwork.medium = work_details.get('medium_display')
        artwork.dimensions = work_details.get('dimensions')
        artwork.api_source = 'Artic'
        artwork.all_required = artwork.is_complete()
        return artwork

    