from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class Announcement:
    title: str
    content: str
    faculty_id: str
    target_batches: List[str]  # List of batch_codes
    created_at: datetime = datetime.now()
    important: bool = False
    attachment_url: Optional[str] = None
