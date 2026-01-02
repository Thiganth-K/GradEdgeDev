from dataclasses import dataclass
from typing import Optional
from .base import UserBase


@dataclass
class Student(UserBase):
    full_name: Optional[str] = None
    enrollment_id: Optional[str] = None
    program: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    department: Optional[str] = None
    institutional_id: Optional[str] = None
    faculty_id: Optional[str] = None
    faculty_username: Optional[str] = None
