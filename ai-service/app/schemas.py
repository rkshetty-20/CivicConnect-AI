from pydantic import BaseModel, Field
from typing import List, Optional

class ClassifyRequest(BaseModel):
    title: str = Field(..., description="The title of the reported issue")
    description: str = Field(..., description="Detailed description of the issue")
    image_url: Optional[str] = Field(None, description="Optional image URL uploaded to Cloudinary")

class ClassifyResponse(BaseModel):
    category: str
    severity: str
    confidence: float
    priority_score: int = 0
    summary: str = ""
    recommended_department: str = ""
    suggested_action: str = ""
    safety_risk: str = ""

class DuplicateRequest(BaseModel):
    image_url: str
    lat: float
    lng: float

class DuplicateResponse(BaseModel):
    isDuplicate: bool
    matchedIssueId: Optional[str] = None

class FakeCheckRequest(BaseModel):
    image_url: Optional[str] = None
    lat: float
    lng: float
    device_metadata: Optional[dict] = None

class FakeCheckResponse(BaseModel):
    isFake: bool
    reasons: List[str]
