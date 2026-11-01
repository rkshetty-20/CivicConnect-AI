from fastapi import APIRouter
from app.schemas import ClassifyRequest, ClassifyResponse
import os
import json
import requests

router = APIRouter(prefix="/classify", tags=["classification"])

KEYWORDS = {
    "Garbage": ["trash", "garbage", "waste", "rubbish", "litter", "dump", "bin", "cleanliness"],
    "Roads": ["pothole", "road", "tar", "asphalt", "flyover", "street", "crack", "highway"],
    "Water": ["water", "leak", "pipe", "drinking", "supply", "contamination", "drain", "pressure"],
    "Electricity": ["power", "electricity", "transformer", "wire", "shock", "blackout", "load", "voltage"],
    "Sewage": ["sewage", "gutter", "drainage", "overflow", "stinking", "clog", "manhole"],
    "Streetlights": ["streetlight", "dark", "bulb", "lamp", "post", "light"],
    "Parks": ["park", "garden", "bench", "tree", "grass", "playground", "swing"],
    "Public Transport": ["bus", "metro", "station", "stop", "train", "transport"],
    "Building Safety": ["collapse", "building", "crack", "wall", "construction", "dilapidated", "hazard"],
    "Noise Pollution": ["speaker", "loudspeaker", "noise", "horn", "music", "night", "decibel"],
}

SEVERITY_KEYWORDS = {
    "emergency": ["live wire", "flooding", "building collapse", "fire hazard", "gas leak", "shock", "danger", "collapse", "accident"],
    "high": ["overflowing sewage", "blocked road", "water logging", "blackout", "contamination", "burst", "caving"],
    "medium": ["pothole", "streetlight down", "garbage piled", "broken pipe", "broken", "not working", "overflowing"],
}

# Which civic department should own each category.
DEPARTMENT_MAP = {
    "Roads": "Road & Infrastructure",
    "Public Transport": "Transport Authority",
    "Garbage": "Sanitation & Waste Management",
    "Noise Pollution": "Pollution Control Board",
    "Water": "Water Supply & Sewerage Board",
    "Sewage": "Water Supply & Sewerage Board",
    "Electricity": "Electricity & Power Distribution",
    "Streetlights": "Electricity & Power Distribution",
    "Parks": "Parks & Recreation Authority",
    "Building Safety": "Building Safety / Municipal Engineering",
    "Other": "General Administration",
}

# Baseline priority (0-100) per severity, and templated advisory text.
SEVERITY_BASE = {"low": 20, "medium": 45, "high": 70, "emergency": 90}
SAFETY_RISK = {
    "low": "Minimal public safety risk.",
    "medium": "Moderate risk; may worsen if unattended.",
    "high": "Significant risk to public safety or health.",
    "emergency": "Critical / immediate danger to life or property.",
}
SUGGESTED_ACTION = {
    "low": "Schedule routine maintenance within the normal service window.",
    "medium": "Inspect within 48 hours and plan corrective work.",
    "high": "Prioritize inspection within 24 hours and arrange repair.",
    "emergency": "Dispatch an emergency crew immediately and cordon off the area.",
}


def _clamp(n, lo=0, hi=100):
    return max(lo, min(hi, int(round(n))))


def _summary(title: str, description: str) -> str:
    text = (description or title).strip()
    sentences = text.replace("\n", " ").split(". ")
    brief = ". ".join(sentences[:2]).strip()
    if not brief.endswith("."):
        brief += "."
    return brief[:280]


def enrich(category: str, severity: str, confidence: float, title: str, description: str) -> dict:
    """Adds priority score, summary, department, action and safety risk to a base classification."""
    text = (title + " " + description).lower()
    base = SEVERITY_BASE.get(severity, 20)
    # Small bumps for high-impact community signals.
    if any(w in text for w in ["school", "hospital", "accident", "children", "elderly"]):
        base += 8
    if any(w in text for w in ["many", "daily", "days", "week", "no one"]):
        base += 4
    # Confidence nudges the score slightly.
    base += (confidence or 0.5) * 5
    return {
        "priority_score": _clamp(base),
        "summary": _summary(title, description),
        "recommended_department": DEPARTMENT_MAP.get(category, "General Administration"),
        "suggested_action": SUGGESTED_ACTION.get(severity, SUGGESTED_ACTION["low"]),
        "safety_risk": SAFETY_RISK.get(severity, SAFETY_RISK["low"]),
    }


def offline_classify(title: str, description: str):
    text = (title + " " + description).lower()

    detected_cat = "Other"
    max_matches = 0
    for cat, words in KEYWORDS.items():
        matches = sum(1 for word in words if word in text)
        if matches > max_matches:
            max_matches = matches
            detected_cat = cat

    detected_sev = "low"
    for sev, words in SEVERITY_KEYWORDS.items():
        if any(word in text for word in words):
            detected_sev = sev
            break

    confidence = 0.85 if max_matches > 0 else 0.50
    return detected_cat, detected_sev, confidence


VALID_CATEGORIES = list(KEYWORDS.keys()) + ["Other"]
VALID_SEVERITIES = ["low", "medium", "high", "emergency"]


@router.post("", response_model=ClassifyResponse)
async def classify_issue_endpoint(request: ClassifyRequest):
    """
    Classifies a civic complaint by title and description.
    Uses OpenRouter (an OpenAI-compatible LLM) when OPENROUTER_API_KEY is set;
    otherwise falls back to a fast offline keyword engine. Both paths return the
    full intelligence payload (priority, summary, department, action, safety risk).
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        category, severity, confidence = offline_classify(request.title, request.description)
        payload = {
            "category": category,
            "severity": severity,
            "confidence": confidence,
            **enrich(category, severity, confidence, request.title, request.description),
        }
        return ClassifyResponse(**payload)

    prompt = f"""You are an AI classifier for a civic issue reporting portal. Analyze this complaint and respond ONLY with a JSON object, no prose.

Title: {request.title}
Description: {request.description}

Allowed categories: {", ".join(VALID_CATEGORIES)}
Allowed severities: low, medium, high, emergency

JSON keys:
{{
  "category": one of the allowed categories,
  "severity": one of the allowed severities,
  "confidence": 0.0 to 1.0,
  "priority_score": integer 0-100 weighing public safety, severity, citizen impact and urgency,
  "summary": one or two sentence neutral summary,
  "recommended_department": name of the civic department best suited to resolve it,
  "suggested_action": a short recommended next action for staff,
  "safety_risk": a short description of the public safety risk
}}"""

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            },
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=8,
        )
        data = res.json()
        content = data["choices"][0]["message"]["content"].strip()
        # Strip markdown code fences if the model added them.
        if content.startswith("```"):
            content = content.split("```")[1]
            content = content.replace("json", "", 1).strip()
        parsed = json.loads(content)

        # Backend validation: never trust raw AI output.
        category = parsed.get("category", "Other")
        if category not in VALID_CATEGORIES:
            category = "Other"
        severity = parsed.get("severity", "low")
        if severity not in VALID_SEVERITIES:
            severity = "low"
        confidence = float(parsed.get("confidence", 0.9))
        confidence = min(1.0, max(0.0, confidence))

        base_priority = parsed.get("priority_score")
        fallback = enrich(category, severity, confidence, request.title, request.description)
        return ClassifyResponse(
            category=category,
            severity=severity,
            confidence=confidence,
            priority_score=_clamp(base_priority) if base_priority is not None else fallback["priority_score"],
            summary=parsed.get("summary") or fallback["summary"],
            recommended_department=parsed.get("recommended_department") or fallback["recommended_department"],
            suggested_action=parsed.get("suggested_action") or fallback["suggested_action"],
            safety_risk=parsed.get("safety_risk") or fallback["safety_risk"],
        )
    except Exception as e:
        print(f"[FastAPI AI] OpenRouter failed, falling back to offline: {e}")
        category, severity, confidence = offline_classify(request.title, request.description)
        payload = {
            "category": category,
            "severity": severity,
            "confidence": confidence,
            **enrich(category, severity, confidence, request.title, request.description),
        }
        return ClassifyResponse(**payload)
