# base_api.py
import httpx
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List

class BaseAPI(ABC):
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = self._create_headers()
        

    def _create_headers(self) -> Dict[str, str]:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
        return headers

    async def _handle_response(self, response: httpx.Response) -> Any:
        try:
            response.raise_for_status()
            if 'json' in response.headers.get('Content-Type', ''):
                return response.json()
            return response.text
        except httpx.HTTPStatusError as http_err:
            print(f"HTTP error occurred: {http_err}")
            if response.status_code == 404:
                return {}
            raise http_err

    async def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = {}) -> Any:
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
        return await self._handle_response(response)

    
    async def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data)
        return await self._handle_response(response)
    

    @abstractmethod
    async def search_artworks(self, query: str):
        pass

    @abstractmethod
    async def get_artworks(self, objects: List[Dict[str, Any]]):
        pass

    async def close(self):
        await self.client.aclose()