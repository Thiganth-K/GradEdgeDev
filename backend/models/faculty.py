from dataclasses import dataclass
from typing import Optional
from .base import UserBase


@dataclass
class Faculty(UserBase):
    full_name: Optional[str] = None
    faculty_id: Optional[str] = None
    department: Optional[str] = None
