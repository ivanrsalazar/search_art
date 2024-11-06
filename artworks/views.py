# artworks/views.py
from django.shortcuts import render
from django.http import JsonResponse
import requests
import numpy as np
import random
import base64
import cv2
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from .models import Artwork  # Replace with your actual model or data source
from rest_framework.decorators import api_view
from rest_framework.response import Response

# artworks/views.py



def search_artworks(search_term, limit=100):
    search_url = f'https://api.artic.edu/api/v1/artworks/search?q={search_term}&limit={limit}'
    response = requests.get(search_url)
    if response.status_code == 200:
        return response.json().get('data', [])
    else:
        response.raise_for_status()

def get_artwork_details(artwork_id):
    artwork_url = f'https://api.artic.edu/api/v1/artworks/{artwork_id}?fields=id,title,image_id,artist_display,date_display,dimensions,medium_display,artist_title'
    response = requests.get(artwork_url)
    if response.status_code == 200:
        return response.json().get('data', {})
    else:
        response.raise_for_status()

# artworks/views.py

def get_image(artwork, size="1686,"):
    image_id = artwork.get('image_id')
    if image_id:
        # Construct the URL for the requested size
        image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
        
        response = requests.get(image_url)
        
        # Fallback to 843 size if the requested size is unavailable
        if response.status_code != 200 and size == "1686,":
            size = "843,"
            image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
            response = requests.get(image_url)
        
        # Check if the response has content before processing
        if response.status_code == 200 and response.content:
            nparr = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                # Get the actual dimensions of the image
                height, width = img.shape[:2]
                actual_size = f"{width}x{height}"

                # Convert image to base64
                _, buffer = cv2.imencode('.jpg', img)
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                return img_base64, actual_size
    
    # Return None if the image could not be fetched or decoded
    return None, "0x0"



def artwork_search_view(request):
    search_term = request.GET.get('q', '')
    if not search_term:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    artworks_data = search_artworks(search_term, limit=100)[:25]
    random.shuffle(artworks_data)

    images = []
    for artwork_data in artworks_data:
        if len(images) >= 10:
            break
        artwork = get_artwork_details(artwork_data['id'])
        img, _ = get_image(artwork)
        if img:
            title = artwork.get('title', 'Untitled')
            images.append({'id': artwork_data['id'], 'title': title, 'image': img})

    return JsonResponse({'images': images})

def home_view(request):
    return render(request, 'artworks/home.html')


# artworks/views.py

@api_view(['GET'])
def artwork_detail_view(request, artwork_id):
    artwork = get_artwork_details(artwork_id)
    image, avg_color = get_image(artwork)

    context = {
        'title': artwork.get('title', 'Untitled'),
        'artist': artwork.get('artist_display', ''),
        'date': artwork.get('date_display', ''),
        'dimensions': artwork.get('dimensions', ''),
        'medium': artwork.get('medium_display', ''),
        'image': image,
        'avg_color': avg_color,
        'image_id': artwork.get('image_id', ''),
    }
    return Response(context)

def get_image_view(request):
    image_id = request.GET.get('image_id')
    size = request.GET.get('size', '1686,')  # Default size if not specified
    
    # Assuming we have an artwork dictionary for demonstration
    artwork = {'image_id': image_id}
    
    # Use the existing get_image function to retrieve the image
    img_base64, actual_size = get_image(artwork, size)
    
    # Return the image data and actual size in JSON format
    return JsonResponse({
        'img_base64': img_base64,
        'actual_size': actual_size
    })