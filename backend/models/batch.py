from dataclasses import dataclass, field
from typing import Optional, List
from .base import UserBase

@dataclass
class Batch:
    batch_code: str  # Unique identifier e.g., "CSE-2025"
    department: str
    faculty_id: str  # The faculty who created/owns this batch
    students: List[str] = field(default_factory=list)  # List of student IDs
    year: Optional[str] = None
    section: Optional[str] = None
