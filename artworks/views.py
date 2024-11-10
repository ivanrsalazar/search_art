# artworks/views.py
import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
import asyncio
import random
import base64
import cv2
from .api.artic_api import ArticAPI
from .api.artsy_api import ArtsyAPI

# Initialize logger
logger = logging.getLogger('artworks')

async def artwork_search_view(request):
    """
    Asynchronous view to search for artworks using both ArticAPI and ArtsyAPI.
    """
    search_term = request.GET.get('q', '')
    if not search_term:
        logger.debug("No search term provided.")
        return JsonResponse({'error': 'No search term provided'}, status=400)

    # Initialize your API clients with API keys from settings
    artic_api = ArticAPI()
    artsy_api = ArtsyAPI()

    try:
        # Perform concurrent searches
        logger.debug(f"Searching for artworks with term: '{search_term}'")
        artic_results, artsy_results = await asyncio.gather(
            artic_api.search_artworks(search_term),
            artsy_api.search_artworks(search_term)
        )
        logger.debug(f"ArticAPI returned {len(artic_results)} results.")
        logger.debug(f"ArtsyAPI returned {len(artsy_results)} results.")
    except Exception as e:
        logger.error(f"Error during search: {str(e)}")
        return JsonResponse({'error': f'Error during search: {str(e)}'}, status=500)

    try:
        # Concurrently retrieve artworks from both APIs
        artworks_artic, artworks_artsy = await asyncio.gather(
            artic_api.get_artworks(artic_results),
            artsy_api.get_artworks(artsy_results)
        )
        logger.debug(f"ArticAPI processed {len(artworks_artic)} artworks.")
        logger.debug(f"ArtsyAPI processed {len(artworks_artsy)} artworks.")
    except Exception as e:
        logger.error(f"Error retrieving artworks: {str(e)}")
        return JsonResponse({'error': f'Error retrieving artworks: {str(e)}'}, status=500)

    # Combine and shuffle artworks from both sources
    combined_artworks = artworks_artic + artworks_artsy
    random.shuffle(combined_artworks)
    logger.debug(f"Combined artworks count: {len(combined_artworks)}")

    # Limit to 10 artworks
    limited_artworks = combined_artworks[:10]
    logger.debug(f"Limited to {len(limited_artworks)} artworks.")
    
    # Prepare the data for JSON response
    images = []
    incomplete_artworks = 0
    for artwork in limited_artworks:
        print(artwork.image_url)
        images.append({
            'id': artwork.id,
            'title': artwork.title,
            'artist': artwork.artist,
            'date': artwork.date,
            'medium': artwork.medium,
            'dimensions': artwork.dimensions,
            'image_url': artwork.image_url,
            'source': artwork.api_source,
        })
       
    print(len(images))
    logger.debug(f"Returning {len(images)} images. Skipped {incomplete_artworks} incomplete artworks.")


    return JsonResponse({'images': images})

def home_view(request):
    return render(request, 'artworks/home.html')

@api_view(['GET'])
async def artwork_detail_view(request, artwork_id):
    source = request.GET.get('source', 'aic')  # Default to AIC
    if source == 'aic':
        # Use your ArticAPI to fetch details
        artic_api = ArticAPI(api_key=settings.ARTIC_API_KEY)
        try:
            artwork = await artic_api.get_single_artwork(int(artwork_id))
        except Exception as e:
            return Response({'error': f'Error fetching artwork: {str(e)}'}, status=500)
    elif source == 'harvard':
        # Implement similar logic for Harvard API
        # Assuming you have a HarvardAPI class similar to ArticAPI
        harvard_api = HarvardAPI(api_key=settings.HARVARD_API_KEY)
        try:
            artwork = await harvard_api.get_single_artwork(int(artwork_id))
        except Exception as e:
            return Response({'error': f'Error fetching artwork: {str(e)}'}, status=500)
    else:
        return Response({'error': 'Invalid source'}, status=400)

    if not artwork:
        return Response({'error': 'Artwork not found'}, status=404)

    context = {
        'id': artwork.id,
        'title': artwork.title,
        'artist': artwork.artist,
        'date': artwork.date,
        'dimensions': artwork.dimensions,
        'medium': artwork.medium,
        'image_url': artwork.image_url,
        'source': artwork.api_source,
    }
    return Response(context)

async def get_image_view(request):
    image_id = request.GET.get('image_id')
    size = request.GET.get('size', '1686,')  # Default size if not specified

    # Initialize your API client (ArticAPI or ArtsyAPI) based on your logic
    artic_api = ArticAPI(api_key=settings.ARTIC_API_KEY)

    # Use your existing async get_image method
    artwork = {'image_id': image_id}
    img_base64, actual_size = await artic_api.get_image(artwork, size)

    # Return the image data and actual size in JSON format
    return JsonResponse({
        'img_base64': img_base64,
        'actual_size': actual_size
    })