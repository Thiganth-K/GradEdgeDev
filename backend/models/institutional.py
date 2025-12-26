from dataclasses import dataclass
from typing import Optional

from .base import UserBase


@dataclass
class Institutional(UserBase):
    """Institutional user model.

    Represents an institutional account that authenticates via username and password.
    Additional metadata fields can be added as needed.
    """
    institutional_id: Optional[str] = None
    institution_name: Optional[str] = None
