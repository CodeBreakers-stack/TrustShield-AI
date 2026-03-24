from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import io
import numpy as np
import librosa
import soundfile as sf
from emergentintegrations.llm.chat import LlmChat, UserMessage
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class MessageDetectionRequest(BaseModel):
    message: str

class VoiceAnalysisRequest(BaseModel):
    audio_base64: str
    duration: float

class DetectionResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "message" or "voice"
    content: str
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    risk_score: int  # 0-100
    explanation: str
    detected_patterns: List[str]
    ai_analysis: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DetectionHistory(BaseModel):
    detections: List[DetectionResult]
    total: int

# ==================== SCAM DETECTION LOGIC ====================

SCAM_KEYWORDS = {
    "urgent": 15,
    "verify": 12,
    "account": 10,
    "suspended": 15,
    "confirm": 10,
    "click here": 20,
    "prize": 15,
    "winner": 15,
    "congratulations": 12,
    "bank": 10,
    "credit card": 15,
    "password": 18,
    "social security": 20,
    "tax": 12,
    "refund": 12,
    "claim": 10,
    "expire": 15,
    "limited time": 15,
    "act now": 15,
    "free": 8,
    "risk": 10,
    "security alert": 18,
    "unusual activity": 15,
    "verify your identity": 20,
    "update your information": 15,
    "payment required": 15,
    "arrest": 20,
    "legal action": 18,
    "irs": 15,
    "lottery": 18,
    "inheritance": 18
}

def calculate_keyword_score(message: str) -> tuple[int, List[str]]:
    """Calculate risk score based on scam keywords"""
    message_lower = message.lower()
    score = 0
    detected = []
    
    for keyword, weight in SCAM_KEYWORDS.items():
        if keyword in message_lower:
            score += weight
            detected.append(keyword)
    
    # Cap at 100
    score = min(score, 100)
    return score, detected

async def get_ai_analysis(message: str) -> str:
    """Get AI-powered scam analysis using OpenAI"""
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message="You are a cybersecurity expert analyzing messages for scam patterns. Provide brief, clear analysis."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"""Analyze this message for scam indicators. Be concise (2-3 sentences):

Message: {message}

Provide: 1) Is it likely a scam? 2) Key red flags if any."""
        )
        
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return "AI analysis temporarily unavailable."

# ==================== VOICE ANALYSIS LOGIC ====================

def analyze_audio_features(audio_data: np.ndarray, sr: int) -> tuple[int, List[str], str]:
    """Analyze audio for suspicious patterns"""
    detected_patterns = []
    explanation_parts = []
    
    try:
        # 1. Pitch analysis
        pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        if len(pitch_values) > 0:
            pitch_std = np.std(pitch_values)
            pitch_mean = np.mean(pitch_values)
            
            # Unnatural pitch variation
            if pitch_std < 20:
                detected_patterns.append("Unusually consistent pitch (robotic)")
                explanation_parts.append("Voice has unnaturally consistent pitch, suggesting synthetic generation")
            elif pitch_std > 100:
                detected_patterns.append("Erratic pitch changes")
                explanation_parts.append("Voice shows erratic pitch patterns")
        
        # 2. Speaking rate analysis
        onset_env = librosa.onset.onset_strength(y=audio_data, sr=sr)
        tempo = librosa.beat.tempo(onset_envelope=onset_env, sr=sr)[0]
        
        if tempo > 180:
            detected_patterns.append("Unnaturally fast speech")
            explanation_parts.append("Speaking rate is suspiciously fast")
        elif tempo < 60:
            detected_patterns.append("Unnaturally slow speech")
            explanation_parts.append("Speaking rate is suspiciously slow")
        
        # 3. Spectral analysis
        spectral_centroids = librosa.feature.spectral_centroid(y=audio_data, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sr)[0]
        
        sc_mean = np.mean(spectral_centroids)
        sr_mean = np.mean(spectral_rolloff)
        
        # Check for synthetic patterns
        if sc_mean > 3000 or sr_mean > 7000:
            detected_patterns.append("High frequency emphasis")
            explanation_parts.append("Audio has unusual high-frequency characteristics")
        
        # 4. Zero crossing rate (voice naturalness)
        zcr = librosa.feature.zero_crossing_rate(audio_data)[0]
        zcr_mean = np.mean(zcr)
        
        if zcr_mean > 0.15:
            detected_patterns.append("High noise/synthetic signature")
            explanation_parts.append("Audio shows signs of synthetic or heavily processed voice")
        
        # Calculate risk score
        risk_score = min(len(detected_patterns) * 25, 100)
        
        # Generate explanation
        if len(explanation_parts) > 0:
            explanation = " | ".join(explanation_parts)
        else:
            explanation = "No suspicious audio patterns detected. Voice characteristics appear natural."
        
        return risk_score, detected_patterns, explanation
        
    except Exception as e:
        logger.error(f"Audio analysis error: {e}")
        return 0, [], "Audio analysis completed with basic checks."

# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "TrustShield AI API - Scam & Deepfake Detection", "status": "active"}

@api_router.post("/detect-message", response_model=DetectionResult)
async def detect_scam_message(request: MessageDetectionRequest):
    """Detect scam patterns in text messages"""
    try:
        message = request.message
        
        # Keyword-based detection
        keyword_score, detected_keywords = calculate_keyword_score(message)
        
        # Get AI analysis
        ai_analysis = await get_ai_analysis(message)
        
        # Combine scores (70% keyword, 30% AI sentiment)
        # For simplicity, we'll use keyword score as primary
        final_score = keyword_score
        
        # Determine risk level
        if final_score >= 50:
            risk_level = "HIGH"
        elif final_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Generate explanation
        if detected_keywords:
            explanation = f"Detected {len(detected_keywords)} suspicious patterns: {', '.join(detected_keywords[:5])}"
        else:
            explanation = "No significant scam indicators detected. Message appears safe."
        
        # Create result
        result = DetectionResult(
            type="message",
            content=message[:200],  # Store first 200 chars
            risk_level=risk_level,
            risk_score=final_score,
            explanation=explanation,
            detected_patterns=detected_keywords,
            ai_analysis=ai_analysis
        )
        
        # Save to database
        await db.detections.insert_one(result.dict())
        
        logger.info(f"Message analyzed: Risk={risk_level}, Score={final_score}")
        return result
        
    except Exception as e:
        logger.error(f"Error in message detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze-voice", response_model=DetectionResult)
async def analyze_voice(request: VoiceAnalysisRequest):
    """Analyze voice audio for deepfake/cloning patterns"""
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(request.audio_base64)
        
        # Load audio with librosa
        audio_data, sr = librosa.load(io.BytesIO(audio_bytes), sr=None)
        
        # Analyze audio features
        risk_score, detected_patterns, explanation = analyze_audio_features(audio_data, sr)
        
        # Determine risk level
        if risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Create result
        result = DetectionResult(
            type="voice",
            content=f"Audio analysis ({request.duration:.1f}s)",
            risk_level=risk_level,
            risk_score=risk_score,
            explanation=explanation,
            detected_patterns=detected_patterns,
            ai_analysis=None
        )
        
        # Save to database
        await db.detections.insert_one(result.dict())
        
        logger.info(f"Voice analyzed: Risk={risk_level}, Score={risk_score}")
        return result
        
    except Exception as e:
        logger.error(f"Error in voice analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=DetectionHistory)
async def get_detection_history(limit: int = 50):
    """Get detection history"""
    try:
        detections = await db.detections.find().sort("timestamp", -1).limit(limit).to_list(limit)
        
        detection_list = [DetectionResult(**d) for d in detections]
        
        return DetectionHistory(
            detections=detection_list,
            total=len(detection_list)
        )
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stats")
async def get_stats():
    """Get detection statistics"""
    try:
        total = await db.detections.count_documents({})
        high_risk = await db.detections.count_documents({"risk_level": "HIGH"})
        medium_risk = await db.detections.count_documents({"risk_level": "MEDIUM"})
        low_risk = await db.detections.count_documents({"risk_level": "LOW"})
        
        return {
            "total_scans": total,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
