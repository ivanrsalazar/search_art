from pydantic import BaseModel, ValidationError
from typing import Any, Dict, Optional
import numpy as np
class Artwork(BaseModel):
    id: Optional[int] = None
    api_source: Optional[str] = None

    # Required
    title: Optional[str] = None
    artist: Optional[str] = None
    date: Optional[str] = None
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    image: Optional[str] = None
    image_url: Optional[str] = None
    all_required: Optional[bool] = False
    description: Optional[str] = None
    def is_complete(self):
        if not self.title:
            return False
        if not self.artist:
            return False
        if not self.date:
            return False
        if not self.medium:
            return False
        if not self.dimensions:
            return False
        if not self.image_url:
            return False
        if not isinstance(self.image, np.ndarray):
            return False
        self.all_required = True
        return True
    
    