from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class Session:
    title: str
    faculty_id: str
    batch_code: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None # e.g., "Room 304" or Zoom link
    description: Optional[str] = None
