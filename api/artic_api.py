from base_api import BaseAPI
import requests
import cv2
from artwork import Artwork
from typing import Any, Dict, Optional
import numpy as np
class ArticAPI(BaseAPI):
    """
    API client for the Art Institute of Chicago API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.artic.edu/api/v1", api_key=api_key)

    def search_artworks(self,search_term):
        endpoint="/artworks/search"
        params={"q":search_term, 'limit':100}
        json_response = self.get(endpoint=endpoint,params=params)
        return json_response.get('data', [])


    def get_artworks(self,works):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        for work in works:
            artwork = Artwork()
            work_id = work['id']
            endpoint = f"/artworks/{work_id}?fields=id,title,image_id,date_display,artist_display,medium_display,dimensions,dimensions_display,artist_title"
            json_response = self.get(endpoint)
            work_details = json_response.get("data",{})
            artwork.artist = work_details['artist_display']
            image = self.get_image(work_details)
            if image is not None:
                artwork.image, artwork.image_url = image
            artwork.title = work_details['title']
            artwork.date = work_details['date_display']
            artwork.medium = work_details['medium_display']
            artwork.dimensions = work_details['dimensions']
            artwork.all_required = artwork.is_complete()
            artworks.append(artwork) 
        return artworks


    def get_image(self,artwork_details):
        image_id = artwork_details.get('image_id')
        if image_id:
            image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/1686,/0/default.jpg'
            response = requests.get(image_url)
            if response.status_code != 200:
                image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/1686,/0/default.jpg'
                response = requests.get(image_url)
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    return None
                cv2.imshow("title",img)
                cv2.waitKey(0)  # Wait for a key press to close the window
                cv2.destroyAllWindows()
                return img, image_url
        return None




artic_api = ArticAPI()

works = artic_api.search_artworks('picasso')
artworks = artic_api.get_artworks(works)

