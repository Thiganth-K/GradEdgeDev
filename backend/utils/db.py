from typing import Optional
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import os
from pathlib import Path
from typing import Union


def connect_db(uri: Optional[str] = None, *, server_selection_timeout_ms: int = 5000):
    """Connect to MongoDB and return a :class:`pymongo.mongo_client.MongoClient`.

    Args:
        uri: MongoDB connection string. If not provided, reads from env `MONGODB_URI`.
        server_selection_timeout_ms: timeout for server selection in milliseconds.

    Returns:
        MongoClient instance connected to the server.

    Raises:
        RuntimeError: if connection fails or no URI is available.
    """
    # Ensure .env is loaded (do not overwrite existing env vars)
    try:
        env_path = Path(__file__).resolve().parents[1] / '.env'
        load_env_file(env_path)
    except Exception:
        pass

    # Support both MONGODB_URI and legacy MONGO_URI keys
    uri = uri or os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI')
    if not uri:
        raise RuntimeError('MongoDB URI not provided. Set MONGODB_URI environment variable or pass uri param.')

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=server_selection_timeout_ms)
        # Trigger server selection to validate the connection
        client.admin.command('ping')
        return client
    except PyMongoError as exc:
        raise RuntimeError(f'Failed to connect to MongoDB: {exc}') from exc


def load_env_file(env_path: Union[str, Path, None] = None):
    """Load key=value pairs from a .env file into os.environ without overwriting existing vars.

    Args:
        env_path: path to the .env file. If None, looks for backend/.env next to this file.
    """
    if env_path is None:
        env_path = Path(__file__).resolve().parents[1] / '.env'
    env_path = Path(env_path)
    if not env_path.exists():
        return

    text = env_path.read_text(encoding='utf8')
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = line.split('=', 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val
