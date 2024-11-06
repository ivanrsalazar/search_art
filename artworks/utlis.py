# artworks/utils.py

import requests
import numpy as np
import cv2
import base64

def get_image(artwork, high_res=True):
    image_id = artwork.get('image_id')
    if image_id:
        size = "1686," if high_res else "843,"
        image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
        
        response = requests.get(image_url)
        
        if response.status_code != 200 and high_res:
            size = "843,"
            image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
            response = requests.get(image_url)
        
        if response.status_code == 200:
            nparr = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            avg_color_per_row = np.average(img, axis=0)
            avg_color = np.average(avg_color_per_row, axis=0).astype(int)
            avg_color_hex = '#{:02x}{:02x}{:02x}'.format(avg_color[2], avg_color[1], avg_color[0])

            _, buffer = cv2.imencode('.jpg', img)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return img_base64, avg_color_hex
    
    return None, "#ffffff"