from dataclasses import dataclass, asdict
from typing import Dict


@dataclass
class UserBase:
    """Base model with required authentication fields.

    All user-like models should include `username` and `password`.
    """
    username: str
    password: str

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)
