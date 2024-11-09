from abc import ABC, abstractmethod
import requests
from typing import Any, Dict, Optional
from dataclasses import dataclass

# Assuming Artwork is already defined as above

class BaseAPI(ABC):
    """
    Abstract base class for API interactions.
    """

    def __init__(self, base_url: str, api_key: Optional[str] = None):
        """
        Initializes the API with a base URL and optional API key.

        :param base_url: The base URL for the API.
        :param api_key: Optional API key for authentication.
        """
        self.base_url = base_url
        self.api_key = api_key
        self.headers = self._create_headers()

    def _create_headers(self) -> Dict[str, str]:
        """
        Creates the headers for the HTTP requests.

        :return: A dictionary of HTTP headers.
        """
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
        return headers

    def _handle_response(self, response: requests.Response) -> Any:
        """
        Handles the HTTP response.

        :param response: The HTTP response object.
        :return: Parsed JSON data or raw text.
        :raises: HTTPError if the response contains an HTTP error status.
        """
        try:
            response.raise_for_status()
            if 'json' in response.headers.get('Content-Type', ''):
                return response.json()
            return response.text
        except requests.HTTPError as http_err:
            # You can customize error handling here
            print(response.status_code)
            if response.status_code == 404:
                return {}
            raise http_err

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, headers={}) -> Any:
        """
        Sends a GET request.

        :param endpoint: API endpoint to send the request to.
        :param params: Query parameters for the request.
        :return: Parsed response.
        """
        url = f"{self.base_url}{endpoint}"
        print(url)
        response = requests.get(url, params=params,headers=headers)
        return self._handle_response(response)

    def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """
        Sends a POST request.

        :param endpoint: API endpoint to send the request to.
        :param data: JSON data to send in the body of the request.
        :return: Parsed response.
        """
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, headers=self.headers, json=data)
        return self._handle_response(response)

    @abstractmethod
    def search_artworks(self, query):
        """
        An abstract method that must be implemented by subclasses.
        This will return a list of objects/artworks
        """
        pass

    @abstractmethod
    def get_artworks(self,objects):
        """
        This will retrieve 
        Return Artwork
        """
        pass

    