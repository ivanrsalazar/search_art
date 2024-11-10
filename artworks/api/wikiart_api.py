from base_api import BaseAPI
from typing import Any, Dict, List, Optional
import numpy as np
import cv2
from artwork import Artwork
import requests
import os
import time
class WikiArtAPI(BaseAPI):
    """
    API client for the WikiArt API.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(base_url="https://www.wikiart.org/en/api/2/", api_key=api_key)
        self.public_key = os.getenv("WIKIART_PUBLIC_KEY")
        self.private_key = os.getenv("WIKIART_PRIVATE_KEY")
        self.session_key = 'bbe78a9cc0ae'
        params = {
            "accessCode":self.public_key,
            "secretCode":self.private_key
        }
        endpoint = 'login'
        json_response = self.get(endpoint=endpoint,params=params)


    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        endpoint = "PaintingSearch"
        params = {
            "term":query
        }
        json_response = self.get(endpoint=endpoint,params=params)
        return json_response.get("data",[])
        


    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        artworks = []
        print(len(objects))
        for obj in objects:
            print(obj)
            if len(artworks) > 75:
                break
            artwork = Artwork(
                title=obj['title'],
                artist=obj['artistName'],
                image_url=obj['image'].replace("Large.jpg","HD.jpg")
            )
            artwork.date = obj['completitionYear']
            artwork.id = obj['id']
            endpoint = "Painting"
            params ={
                "id":artwork.id
            }
            details = self.get(endpoint=endpoint,params=params)
            artwork.medium = " ".join(details.get('media',[]))
            artwork.dimensions = f"{details['sizeX']}cm x {details['sizeY']}cm"
            #artwork.image = self.get_image(artwork.image_url)
        pass


    def get_image(self, image_url):
        if image_url:
            print(image_url)
            response = requests.get(image_url)
            if response.status_code != 200:
                image_url = image_url.replace("HD.jpg",'HalfHD.jpg')
                response = requests.get(image_url)
                print(f'new url: {image_url}')
            if response.status_code != 200:
                image_url = image_url.replace("HalfHD.jpg",'Large.jpg')
                response = requests.get(image_url)
                print(f'new url: {image_url}')
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    return None
                cv2.imshow("title",img)
                cv2.waitKey(0)  # Wait for a key press to close the window
                cv2.destroyAllWindows()
                
                return img
        return None


wikiart_api = WikiArtAPI()
start_time = time.perf_counter()
results = wikiart_api.search_artworks("warhol")
end_time = time.perf_counter()
elapsed_time = end_time - start_time
print(f"response time: {elapsed_time}")

start_time = time.perf_counter()
wikiart_api.get_artworks(results)
end_time = time.perf_counter()
elapsed_time = end_time - start_time
print(f"process time: {elapsed_time}")