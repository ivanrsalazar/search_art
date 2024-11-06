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


@api_view(['GET'])
def artwork_search_view(request):
    print(request)
    search_term = request.GET.get('q', '')
    if not search_term:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    # Fetch artworks from external API
    search_url = f'https://api.artic.edu/api/v1/artworks/search?q={search_term}&limit=100'
    response = requests.get(search_url)
    if response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch data from external API'}, status=500)

    artworks_data = response.json().get('data', [])[:25]
    ids = [artwork['id'] for artwork in artworks_data]

    # Select 10 random artworks
    random_ids = random.sample(ids, min(10, len(ids)))

    images = []
    for artwork_id in random_ids:
        artwork_details_url = f'https://api.artic.edu/api/v1/artworks/{artwork_id}?fields=id,title,image_id'
        details_response = requests.get(artwork_details_url)
        if details_response.status_code != 200:
            continue  # Skip if details can't be fetched

        artwork = details_response.json().get('data', {})
        image_id = artwork.get('image_id')
        if not image_id:
            continue  # Skip if no image_id

        image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg'
        image_response = requests.get(image_url)
        if image_response.status_code != 200:
            continue  # Skip if image can't be fetched

        # Convert image to base64
        image_base64 = base64.b64encode(image_response.content).decode('utf-8')

        images.append({
            'id': artwork_id,
            'title': artwork.get('title', 'Untitled'),
            'image': image_base64
        })

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