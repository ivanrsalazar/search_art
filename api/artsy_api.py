from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import numpy as np
import cv2
from artwork import Artwork
import requests
import os

class ArtsyAPI(BaseAPI):
    """
    API client for the Artsy API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.artsy.net/", api_key=api_key)
        public_key = os.getenv("ARTSY_PUBLIC_KEY")
        private_key = os.getenv("ARTSY_PRIVATE_KEY")
        endpoint = 'api/tokens/xapp_token'
        data = {
            "client_id":public_key,
            "client_secret": private_key
        }
        url=f'{self.base_url}{endpoint}?'
        response = requests.post(url, data=data)
        print(response)
        if response.status_code == 201:
            # Extract token from response
            xapp_token = response.json().get("token")
            self.token = xapp_token
            print("XAPP Token:", xapp_token)

        

    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        endpoint = "api/search"
        params={
            'q':query,
            'size':10,
            'type':"artwork",
            'offset':0
        }
        headers = {
            "X-Xapp-Token": self.token
        }
        
        results = []
        for _ in range(3):
            json_response = self.get(endpoint=endpoint,params=params,headers=headers)
            results.extend(json_response["_embedded"]["results"])
            params['offset'] += 10
        return results



    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        print(len(objects))
        for obj in objects:
            if obj['type'] != "artwork":
                print('not artwork')
                continue
            artwork = Artwork()
            try:
                artwork.image_url = obj['_links']['thumbnail']['href'].replace("square.jpg","normalized.jpg")
                artwork.image = self.get_image(artwork.image_url)
                artwork.artist, artwork.title = obj['title'].split(',')
                artwork.medium, artwork.dimensions = obj['description'].split(',')
            except ValueError as error_message:
                print(error_message)
                artwork.title = obj['title']
                artwork.description = obj['description']
            artwork.api_source = 'Artsy'


        pass


    def get_image(self,image_url):
        """
        """
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
    

artsy_api = ArtsyAPI()
records = artsy_api.search_artworks("rugrats")
artworks = artsy_api.get_artworks(records)
