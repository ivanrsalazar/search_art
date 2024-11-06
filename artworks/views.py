# artworks/views.py
from django.shortcuts import render
from django.http import JsonResponse
import requests
import numpy as np
import random
import base64
import cv2
from django.shortcuts import get_object_or_404

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
def get_image(artwork, high_res=True):
    image_id = artwork.get('image_id')
    if image_id:
        # Try fetching the high-resolution image
        size = "1686," if high_res else "843,"
        image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
        
        response = requests.get(image_url)
        
        # If the high-res fetch fails, fall back to default size
        if response.status_code != 200 and high_res:
            size = "843,"  # Default resolution
            image_url = f'https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg'
            response = requests.get(image_url)
        
        if response.status_code == 200:
            nparr = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            _, buffer = cv2.imencode('.jpg', img)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            return img_base64
    return None



def artwork_search_view(request):
    search_term = request.GET.get('q', '')
    if not search_term:
        return JsonResponse({'error': 'No search term provided'}, status=400)

    # Fetch up to 100 results and limit to the first 25
    artworks_data = search_artworks(search_term, limit=100)[:25]
    ids = [item['id'] for item in artworks_data]

    # Select a random 10 from the first 25
    random_ids = random.sample(ids, min(10, len(ids)))

    images = []
    for id in random_ids:
        artwork = get_artwork_details(id)
        img = get_image(artwork)
        if img is not None:
            title = artwork.get('title', 'Untitled')
            images.append({'id': id, 'title': title, 'image': img})
            if len(images) == 10:
                break

    return JsonResponse({'images': images})

def home_view(request):
    return render(request, 'artworks/home.html')


# artworks/views.py
def artwork_detail_view(request, artwork_id):
    artwork = get_artwork_details(artwork_id)
    if not artwork:
        return render(request, '404.html', status=404)  # Return a 404 page if the artwork is not found

    # Get high-resolution image
    img_base64 = get_image(artwork, high_res=True)
    
    context = {
        'title': artwork.get('title', 'Untitled'),
        'artist': artwork.get('artist_display', 'Unknown'),
        'date': artwork.get('date_display', 'Date Unknown'),
        'dimensions': artwork.get('dimensions', 'N/A'),
        'medium': artwork.get('medium_display', 'N/A'),
        'image': img_base64,
        'image_id': artwork.get('image_id')
    }
    return render(request, 'artworks/detail.html', context)