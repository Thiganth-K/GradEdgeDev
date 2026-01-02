from dataclasses import dataclass, field
from typing import Optional, List
from .base import UserBase


@dataclass
class Batch:
    batch_code: str  # Unique identifier e.g., "CSE-2025"
    name: Optional[str] = None  # Human-friendly name shown in UI
    department: Optional[str] = None
    faculty_id: Optional[str] = None  # The faculty who owns this batch
    institutional_id: Optional[str] = None  # Owning institution
    students: List[str] = field(default_factory=list)  # List of student IDs
    year: Optional[str] = None
    section: Optional[str] = None
