import sys
import os
from pathlib import Path

# Add the 'app' directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    # This allows running directly with 'python main.py'
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
