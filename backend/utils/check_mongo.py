from pathlib import Path
import sys

# ensure project root is on sys.path so `utils` imports work
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

try:
    from utils.db import connect_db
except Exception as e:
    print('IMPORT_ERROR', e)
    raise

try:
    client = connect_db()
    print('MONGO_OK')
    # print server info summary
    try:
        print('Servers:', client.address)
    except Exception:
        pass
    client.close()
except Exception as e:
    print('MONGO_FAIL', e)
    raise
