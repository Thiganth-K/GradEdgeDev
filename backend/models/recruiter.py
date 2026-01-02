from dataclasses import dataclass
from typing import Optional
from .base import UserBase


@dataclass
class Recruiter(UserBase):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
