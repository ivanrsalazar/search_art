from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import numpy as np
import cv2
from artwork import Artwork
import requests
import os
import time
class HewittAPI(BaseAPI):
    """
    API client for the Cooper Hewitt API
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.collection.cooperhewitt.org/rest/", api_key=api_key)

    
    

    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        params = {
            "method": "cooperhewitt.search.objects",
            "access_token": self.api_key,
            "query": query,
            "has_images": "true",  # Ensuring we only get items with images
            "per_page": 25
        }
        endpoint = ""

        # Start the timer
        start_time = time.perf_counter()

        # Perform the GET request
        json_response = self.get(endpoint=endpoint, params=params)

        # Stop the timer
        end_time = time.perf_counter()

        # Calculate elapsed time
        elapsed_time = end_time - start_time
        print(f"GET request took {elapsed_time:.4f} seconds")

        return json_response.get("objects", [])


    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        for obj in objects:
            if not obj['images']:
                continue
            artwork = Artwork()
            artwork.api_source = 'Hewitt'
            artwork.title =  obj['title']
            artwork.artist = " ".join([participant['person_name'] for participant in obj['participants']])
            artwork.medium = obj['medium']
            artwork.date = obj['date']
            artwork.dimensions = obj['dimensions']
            artwork.image_url = obj['images'][0]['b']['url']
            artwork.image = self.get_image(artwork.image_url)
            artwork.all_required = artwork.is_complete()
            if not artwork.all_required:
                continue
            artworks.append(artwork)

        return artworks


    def get_image(self, image_url):
        if image_url:
            response = requests.get(image_url)
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                return img
        return None

api_key = os.getenv("HEWITT_API_KEY")
hewitt_api = HewittAPI(api_key=api_key)
results = hewitt_api.search_artworks("dieter")



