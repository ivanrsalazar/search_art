from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import os
from artwork import Artwork
import requests
import numpy as np
import cv2
class HarvardAPI(BaseAPI):
    """
    API client for the Harvard Art Museum API
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.harvardartmuseums.org/", api_key=api_key)

    def search_artworks(self, query: str, page: int = 1, size: int = 100) -> List[Dict[str, Any]]:
        """
        Searches for artworks based on a query term.

        :param query: The search term for the artwork.
        :param page: Page number for pagination.
        :param size: Number of results per page.
        :return: List of artworks found by the search.
        """
        endpoint = "object"
        params = {
            "apikey": self.api_key,
            "q": query,
            "page": page,
            "size": size,
            "hasimage" : 1
        }
        json_response = self.get(endpoint=endpoint, params=params)
        return json_response.get('records', [])

    def get_artworks(self, objects: List[Dict[str, Any]]) -> List[Artwork]:
        """
        Retrieves detailed information about each artwork and returns a list of Artwork instances.

        :param objects: List of basic artwork data from search results.
        :return: List of Artwork instances with detailed information.
        """
        artworks = []
        params = {
            "apikey": self.api_key,
        }
        print(len(objects))
        for obj in objects:
            if len(artworks) > 75:
                break
            object_id = obj['id']
            endpoint = f"object/{object_id}"
            json_response = self.get(endpoint,params=params)
            if not json_response['primaryimageurl']:
                print(object_id)
                continue
            object_details = json_response
            image = self.get_image(object_details)
            # Creating Artwork instance with required fields
            artwork = Artwork(
                id=object_details['id'],
                title=object_details['title'],
                artist=', '.join([artist.get('name') for artist in object_details.get('people', [])]) if object_details.get('people') else None,
                date=object_details.get('dated'),
                medium=object_details.get('medium'),
                dimensions=object_details.get('dimensions'),
                image_url=object_details.get('primaryimageurl'),
                api_source="Harvard"
            )
            artwork.image = image
            artwork.all_required = artwork.is_complete()
            artworks.append(artwork)

        return artworks

    def get_image(self,artwork_details):
        image_url = artwork_details.get('primaryimageurl')
        if image_url:
            response = requests.get(image_url)
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                cv2.imshow("title",img)
                cv2.waitKey(0)  # Wait for a key press to close the window
                cv2.destroyAllWindows()
                return img
        return None



# Usage example
api_key = os.getenv("HARVARD_API_KEY")
harvard_api = HarvardAPI(api_key=api_key)

# Search for artworks related to "van gogh"
results = harvard_api.search_artworks("warhol")

'''
for result in results:
    url =  f"https://api.harvardartmuseums.org/object/{result['id']}?apikey={api_key}"
    response = requests.get(url)
    print(response.text)
    break
'''
artworks = harvard_api.get_artworks(results)


    
