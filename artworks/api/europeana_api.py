from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import numpy as np
import cv2
from artwork import Artwork
import requests
import os

class EuropeanaAPI(BaseAPI):
    """
    API client for the Art Institute of Chicago API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://api.europeana.eu/", api_key=api_key)


    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        endpoint = "record/v2/search.json"
        params = {
            'query':query,
            'wskey':self.api_key,
            'rows':50,
            'completeness':10
        }
        header = {'X-Api-Key':self.api_key}
        json_response = self.get(endpoint=endpoint,params=params)
        return json_response.get('items',[])


    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        print(len(objects))
        for obj in objects:
            try:
                artwork = Artwork()
                artwork.image_url = obj['edmIsShownBy'][0]
                artwork.image = self.get_image(artwork.image_url)
                if artwork.image is None:
                    print("Link isn't image")
                    continue
                artwork.title = obj['dcTitleLangAware']['en']
                artwork.id=obj['id']
                artwork.api_source='Europeana'
                '''
                endpoint=f'record/v2/{artwork.id}.json'
                params = {
                    'wskey':self.api_key
                }
                json_response = self.get(endpoint=endpoint,params=params)
                
                break
                '''
            except KeyError as error_message:
                print(f'KEY ERROR: {error_message}')
                continue
            if artwork.is_complete():
                print("artwork is full")
            else:
                print("artwork is NOT COMPLETE")
            artworks.append(artwork)
            
        return artworks


    def get_image(self, image_url):
        if image_url:
            response = requests.get(image_url)
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    return None
                print(f"dimensions: {img.shape}")
                cv2.imshow("title",img)
                cv2.waitKey(0)  # Wait for a key press to close the window
                cv2.destroyAllWindows()
                return img
        return None

api_key = os.getenv('EUROPEANA_API_KEY')
europeana_api = EuropeanaAPI(api_key=api_key)
records = europeana_api.search_artworks("dada")
europeana_api.get_artworks(records)