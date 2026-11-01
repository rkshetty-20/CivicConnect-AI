from fastapi import APIRouter
from app.schemas import FakeCheckRequest, FakeCheckResponse
from app.services.gps_validator import validate_coordinates

router = APIRouter(prefix="/fake-report-check", tags=["fake_detection"])

@router.post("", response_model=FakeCheckResponse)
async def check_fake(request: FakeCheckRequest):
    """
    Checks if a report submission might be fake based on metadata audits and GPS validation.
    """
    is_fake, reasons = validate_coordinates(request.lat, request.lng)
    
    # We can also simulate device metadata checks
    if request.device_metadata:
        emulator_indicators = ["sdk", "google_sdk", "emulator", "android sdk"]
        model = request.device_metadata.get("model", "").lower()
        if any(ind in model for ind in emulator_indicators):
            is_fake = True
            reasons.append("Submission originated from a non-physical mobile emulator.")

    return FakeCheckResponse(isFake=is_fake, reasons=reasons)
