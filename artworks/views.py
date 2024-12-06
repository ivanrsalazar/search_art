# artworks/views.py
import logging
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .api.serializers import ArtworkSerializer, LikeSerializer
import asyncio
import random
import urllib.parse
import base64
import cv2
from .api.artic_api import ArticAPI
from .api.artsy_api import ArtsyAPI
from .models import Artwork, Like
from requests_oauthlib import OAuth1Session



# Initialize logger
logger = logging.getLogger('artworks')


async def artwork_search_view(request):
    """
    Asynchronous view to search for artworks using both ArticAPI and ArtsyAPI.
    """
    search_term = request.GET.get('q', '')
    page = request.GET.get('page','1')
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
            artic_api.search_artworks(search_term, int(page)),
            artsy_api.search_artworks(search_term, int(page))
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
        print(f"Error retrieving artworks: {str(e)}")
        return JsonResponse({'error': f'Error retrieving artworks: {str(e)}'}, status=500)

    # Combine and shuffle artworks from both sources
    combined_artworks = artworks_artic + artworks_artsy
    random.shuffle(combined_artworks)
    logger.debug(f"Combined artworks count: {len(combined_artworks)}")

    # Limit to 10 artworks
    limited_artworks = combined_artworks # Limit to 10 artworks
    logger.debug(f"Limited to {len(limited_artworks)} artworks.")
    
    # Prepare the data for JSON response
    images = []
    urls_seen = set()
    incomplete_artworks = 0
    print(f"length of combined artworks: {len(combined_artworks)}")
    # Serialize the artworks that are not duplicates
    for artwork in limited_artworks:
        if artwork.image_url in urls_seen:
            print(f"url seen: {artwork.image_url}")
            continue
        urls_seen.add(artwork.image_url)

        # Serialize the artwork using the ArtworkSerializer
        serialized_artwork = ArtworkSerializer(artwork).data
        images.append(serialized_artwork)
    
    print(f"number of artworks returned: {len(images)}")
    logger.debug(f"Returning {len(images)} images. Skipped {incomplete_artworks} incomplete artworks.")

    return JsonResponse({'images': images})
'''
def home_view(request):
    return render(request, 'artworks/home.html')
'''

@api_view(['GET'])
async def artwork_detail_view(request, artwork_id):
    source = request.GET.get('source', 'aic')  # Default to AIC
    if source == 'aic':
        # Use your ArticAPI to fetch details
        artic_api = ArticAPI()
        try:
            artwork = await artic_api.get('/')
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
@api_view(['POST'])
def register(request):
    """
    Endpoint to register a new user.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.save()
    return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint to log in a user and return JWT tokens.
    """
    print(request)
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    print(f"access token: {access_token}")
    return Response({
        "access": str(access_token),
        "refresh": str(refresh)
    })


# API endpoint to like an artwork
class LikeArtworkView(generics.CreateAPIView):
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        logger.debug(f"Authorization Header: {request.headers.get('Authorization')}")
        image_url = request.data.get('image_url')  # Get the image_url from the request body
        if not image_url:
            return Response({'error': 'Artwork image_url is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            artwork = Artwork.objects.get(image_url=image_url)
        except Artwork.DoesNotExist:
            return Response({'error': 'Artwork not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Add like
        like, created = Like.objects.get_or_create(user=request.user, artwork=artwork)
        if not created:
            return Response({'error': 'Artwork already liked.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LikeSerializer(like)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UnlikeArtworkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, image_url, format=None):
        """
        Handles the deletion of a Like object based on image_url.
        """
        # Decode the image_url if it's URL-encoded
        decoded_image_url = urllib.parse.unquote(image_url)

        try:
            artwork = Artwork.objects.get(image_url=decoded_image_url)
        except Artwork.DoesNotExist:
            return Response({'error': 'Artwork not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            like = Like.objects.get(user=request.user, artwork=artwork)
            like.delete()
            return Response({'message': 'Artwork unliked successfully.'}, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            return Response({'error': 'Like not found.'}, status=status.HTTP_404_NOT_FOUND)

# API endpoint to get liked artworks of the current user
class UserLikedArtworksView(generics.ListAPIView):
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        print("UserLikedArtworksView: Received GET request")
        return Like.objects.filter(user=self.request.user)


# Step 1: Redirect to Twitter for Authentication
def twitter_login(request):
    oauth = OAuth1Session(
        settings.TWITTER_API_KEY,
        client_secret=settings.TWITTER_API_SECRET_KEY,
        callback_uri=settings.TWITTER_CALLBACK_URL
    )
    try:
        # Obtain request token
        request_token = oauth.fetch_request_token("https://api.twitter.com/oauth/request_token")
        request.session['oauth_token'] = request_token.get('oauth_token')
        request.session['oauth_token_secret'] = request_token.get('oauth_token_secret')

        # Redirect user to Twitter for authentication
        authorization_url = oauth.authorization_url("https://api.twitter.com/oauth/authorize")
        return HttpResponseRedirect(authorization_url)
    except Exception as e:
        return JsonResponse({"error": f"Error during Twitter login: {str(e)}"}, status=500)


# Step 2: Handle Twitter Callback
def twitter_callback(request):
    oauth_token = request.GET.get('oauth_token')
    oauth_verifier = request.GET.get('oauth_verifier')
    stored_oauth_token = request.session.get('oauth_token')
    stored_oauth_token_secret = request.session.get('oauth_token_secret')

    if oauth_token != stored_oauth_token:
        return JsonResponse({"error": "Invalid OAuth token"}, status=400)

    oauth = OAuth1Session(
        settings.TWITTER_API_KEY,
        client_secret=settings.TWITTER_API_SECRET_KEY,
        resource_owner_key=stored_oauth_token,
        resource_owner_secret=stored_oauth_token_secret,
        verifier=oauth_verifier
    )
    try:
        # Obtain access token
        access_token = oauth.fetch_access_token("https://api.twitter.com/oauth/access_token")
        request.session['twitter_access_token'] = access_token
        return JsonResponse({"message": "Authentication successful!"}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"Error during Twitter callback: {str(e)}"}, status=500)


# Step 3: Post a Tweet
def post_tweet(request):
    if request.method == "POST":
        access_token = request.session.get('twitter_access_token')
        if not access_token:
            return JsonResponse({"error": "User not authenticated with Twitter"}, status=403)

        title = request.POST.get('title')
        artist = request.POST.get('artist')
        medium = request.POST.get('medium')
        image_url = request.POST.get('image_url')

        tweet_text = f"Check out this artwork:\n\nTitle: {title}\nArtist: {artist}\nMedium: {medium}"

        oauth = OAuth1Session(
            settings.TWITTER_API_KEY,
            client_secret=settings.TWITTER_API_SECRET_KEY,
            resource_owner_key=access_token['oauth_token'],
            resource_owner_secret=access_token['oauth_token_secret']
        )

        try:
            # Post the tweet
            media_response = oauth.post(
                "https://upload.twitter.com/1.1/media/upload.json",
                files={"media": requests.get(image_url).content}
            )
            media_response.raise_for_status()

            media_id = media_response.json()["media_id"]
            tweet_response = oauth.post(
                "https://api.twitter.com/1.1/statuses/update.json",
                data={"status": tweet_text, "media_ids": media_id}
            )
            tweet_response.raise_for_status()

            return JsonResponse({"message": "Tweet posted successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": f"Error posting tweet: {str(e)}"}, status=500)