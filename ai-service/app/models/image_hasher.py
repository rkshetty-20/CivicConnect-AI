from PIL import Image
from typing import Optional
import imagehash
import requests
from io import BytesIO

def get_perceptual_hash(image_url: str) -> Optional[str]:
    """
    Downloads an image from a URL and computes its perceptual hash (pHash).
    Returns the hex string representation of the hash.
    """
    try:
        response = requests.get(image_url, timeout=5)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            phash = imagehash.phash(img)
            return str(phash)
    except Exception as e:
        print(f"[ImageHasher] Error computing pHash: {e}")
    return None

def is_hash_duplicate(hash1: str, hash2: str, threshold: int = 10) -> bool:
    """
    Compares two pHash strings. If the Hamming distance is less than the threshold,
    they are considered duplicate images.
    """
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        distance = h1 - h2
        return distance <= threshold
    except Exception as e:
        print(f"[ImageHasher] Error comparing hashes: {e}")
    return False
