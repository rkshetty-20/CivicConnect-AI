from typing import List, Tuple

def validate_coordinates(lat: float, lng: float) -> Tuple[bool, List[str]]:
    """
    Validates coordinates. Flags submissions that fall outside the general geographical
    bounding box of India, suggesting spoofed/out-of-bounds reporting.
    """
    reasons = []
    
    # Bounding box of India: Latitude 8.4 to 37.6, Longitude 68.7 to 97.25
    MIN_LAT, MAX_LAT = 8.0, 38.0
    MIN_LNG, MAX_LNG = 68.0, 98.0

    if not (MIN_LAT <= lat <= MAX_LAT) or not (MIN_LNG <= lng <= MAX_LNG):
        reasons.append("GPS coordinates are outside the national operational boundary.")

    # Check for perfect null/default coordinates often sent by automated scripts (e.g. 0,0)
    if abs(lat) < 0.0001 and abs(lng) < 0.0001:
        reasons.append("Invalid default or zeroed coordinates detected.")

    is_fake = len(reasons) > 0
    return is_fake, reasons
