# artworks/views.py

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.conf import settings
import requests
import numpy as np
import random
import base64
import cv2
from .models import Artwork  # Replace with your actual model or data source
from rest_framework.decorators import api_view
from rest_framework.response import Response

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

def harvard_search_artworks(search_term, page=1, size=25):
    api_key = settings.HARVARD_API_KEY  # Accessing settings
    search_url = 'https://api.harvardartmuseums.org/object'
    params = {
        'apikey': api_key,
        'q': search_term,
        'size': size,
        'page': page,
        'hasimage': 1,  # Only fetch artworks with images
        'fields': 'id,title,primaryimageurl,people,dated,dimensions,medium,images',
    }
    response = requests.get(search_url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        response.raise_for_status()

def harvard_get_artwork_details(artwork_id):
    api_key = settings.HARVARD_API_KEY
    artwork_url = f'https://api.harvardartmuseums.org/object/{artwork_id}'
    params = {
        'apikey': api_key,
        'fields': 'id,title,primaryimageurl,people,dated,dimensions,medium,images',
    }
    response = requests.get(artwork_url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        response.raise_for_status()

def get_base64_encoded_image(url):
    response = requests.get(url)
    if response.status_code == 200:
        return base64.b64encode(response.content).decode('utf-8')
    return None

def artwork_search_view(request):
    search_term = request.GET.get('q', '')
    if not search_term:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    # Fetch artworks from Art Institute of Chicago (AIC)
    aic_artworks_data = search_artworks(search_term, limit=25)

    # Fetch artworks from Harvard Art Museums
    try:
        harvard_response = harvard_search_artworks(search_term, size=25)
        harvard_artworks_data = harvard_response.get('records', [])
    except Exception as e:
        print(f"Error fetching from Harvard API: {e}")
        harvard_artworks_data = []

    # Combine and shuffle artworks
    combined_artworks = aic_artworks_data + harvard_artworks_data
    random.shuffle(combined_artworks)

    images = []
    for artwork_data in combined_artworks:
        if len(images) >= 10:
            break
        # Handle Art Institute of Chicago artworks
        if 'image_id' in artwork_data:
            artwork = get_artwork_details(artwork_data['id'])
            img, _ = get_image(artwork)
            if img:
                title = artwork.get('title', 'Untitled')
                images.append({
                    'id': artwork_data['id'],
                    'title': title,
                    'image': img,
                    'source': 'aic'
                })
        # Handle Harvard Art Museums artworks
        elif 'primaryimageurl' in artwork_data:
            img_url = artwork_data.get('primaryimageurl')
            if img_url:
                img_base64 = get_base64_encoded_image(img_url)
                if img_base64:
                    title = artwork_data.get('title', 'Untitled')
                    images.append({
                        'id': artwork_data['id'],
                        'title': title,
                        'image': img_base64,
                        'source': 'harvard'
                    })

    return JsonResponse({'images': images})

def home_view(request):
    return render(request, 'artworks/home.html')

@api_view(['GET'])
def artwork_detail_view(request, artwork_id):
    source = request.GET.get('source', 'aic')  # Default to AIC
    if source == 'aic':
        artwork = get_artwork_details(artwork_id)
        image, avg_color = get_image(artwork)
    elif source == 'harvard':
        artwork = harvard_get_artwork_details(artwork_id)
        image_url = artwork.get('primaryimageurl')
        image = image_url  # Use URL directly for Harvard
        avg_color = "N/A"  # Placeholder or compute if desired
    else:
        return Response({'error': 'Invalid source'}, status=400)

    context = {
        'title': artwork.get('title', 'Untitled'),
        'artist': ', '.join([person['name'] for person in artwork.get('people', [])]) if 'people' in artwork else '',
        'date': artwork.get('dated', ''),
        'dimensions': artwork.get('dimensions', ''),
        'medium': artwork.get('medium', ''),
        'image': image,
        'avg_color': avg_color,
        'image_id': artwork.get('id', ''),
        'source': source,
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