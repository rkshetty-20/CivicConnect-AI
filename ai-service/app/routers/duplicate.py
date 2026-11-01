from fastapi import APIRouter
from app.schemas import DuplicateRequest, DuplicateResponse
from app.models.image_hasher import get_perceptual_hash

router = APIRouter(prefix="/check-duplicate", tags=["duplicate"])

@router.post("", response_model=DuplicateResponse)
async def check_duplicate(request: DuplicateRequest):
    """
    Validates if a reported issue is a duplicate.
    In production, this queries the DB for issues within a 50m radius and compares image pHashes.
    For this demo/microservice layer, we simulate this checks.
    """
    # Simply compute and log the pHash of the incoming image to show it works
    phash = get_perceptual_hash(request.image_url)
    print(f"[Duplicate Checker] Received image pHash: {phash} at location ({request.lat}, {request.lng})")
    
    # Return duplicate status simulation
    return DuplicateResponse(isDuplicate=False, matchedIssueId=None)
