from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import numpy as np
import cv2
from artwork import Artwork
import requests
class MetAPI(BaseAPI):
    """
    API client for the Museum of Modern Art
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://collectionapi.metmuseum.org/public/collection/v1/", api_key=api_key)

    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        endpoint = "search"
        params ={
            "q":query
        }
        json_response = self.get(endpoint=endpoint,params=params)
        return json_response.get('objectIDs',{})
        


    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        for obj in objects:
            if len(artworks) > 9:
                break
            if obj in [artwork.id for artwork in artworks]:
                continue
            endpoint = f"objects/{obj}"
            object_details = self.get(endpoint)
            if not object_details or not object_details['primaryImage']:
                continue
            
            # Creating Artwork instance with required fields
            artwork = Artwork(
                id=object_details['objectID'],
                title=object_details['title'],
                artist=object_details['artistDisplayName'],
                date=f"{object_details.get('objectBeginDate')}-{object_details.get('objectEndDate')}",
                medium=object_details.get('medium'),
                dimensions=object_details.get('dimensions'),
                image_url=object_details.get('primaryImage'),
                api_source="MET"
            )
            print(artwork.image_url)
            artwork.image =  self.get_image(artwork.image_url)
            artwork.all_required = artwork.is_complete()
            artworks.append(artwork)
        return artworks


    def get_image(self,image_url):
        if image_url:
            print(image_url)
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

met_api = MetAPI()

# Search for artworks related to "van gogh"
results = met_api.search_artworks("Warhol")
print(results)
artworks = met_api.get_artworks(results)
'''
for artwork in artworks:
    cv2.imshow(artwork.title,artwork.image)
    cv2.waitKey(0)  # Wait for a key press to close the window
    cv2.destroyAllWindows()
'''