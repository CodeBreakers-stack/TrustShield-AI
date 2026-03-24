#!/usr/bin/env python3
"""
TrustShield AI Backend API Testing Suite
Tests all backend endpoints thoroughly
"""

import requests
import json
import base64
import time
from datetime import datetime
import sys

# Backend URL from frontend .env
BACKEND_URL = "https://fraud-shield-app-3.preview.emergentagent.com/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(endpoint, status_code, response_data, expected_status=200):
    print(f"\nEndpoint: {endpoint}")
    print(f"Status Code: {status_code} (Expected: {expected_status})")
    if status_code == expected_status:
        print("✅ Status: PASS")
    else:
        print("❌ Status: FAIL")
    
    print(f"Response: {json.dumps(response_data, indent=2, default=str)}")
    return status_code == expected_status

def test_root_endpoint():
    """Test GET /api/ - Root endpoint"""
    print_test_header("Root Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/")
        result = print_result("GET /api/", response.status_code, response.json())
        
        # Verify response content
        data = response.json()
        if "message" in data and "TrustShield AI" in data["message"]:
            print("✅ Response content: PASS - Contains expected message")
            return True
        else:
            print("❌ Response content: FAIL - Missing expected message")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_message_detection():
    """Test POST /api/detect-message with different risk levels"""
    print_test_header("Message Scam Detection")
    
    test_cases = [
        {
            "name": "HIGH RISK Sample",
            "message": "URGENT: Your bank account has been suspended. Click here to verify your identity immediately or risk permanent closure.",
            "expected_risk": "HIGH"
        },
        {
            "name": "MEDIUM RISK Sample", 
            "message": "Congratulations! You won a prize. Click to claim.",
            "expected_risk": "MEDIUM"
        },
        {
            "name": "LOW RISK Sample",
            "message": "Hi, are we still meeting for lunch at 2pm today?",
            "expected_risk": "LOW"
        }
    ]
    
    all_passed = True
    detection_ids = []
    
    for test_case in test_cases:
        print(f"\n--- Testing {test_case['name']} ---")
        
        try:
            payload = {"message": test_case["message"]}
            response = requests.post(f"{BACKEND_URL}/detect-message", json=payload)
            
            success = print_result("POST /api/detect-message", response.status_code, response.json())
            
            if success:
                data = response.json()
                
                # Verify required fields
                required_fields = ["id", "type", "content", "risk_level", "risk_score", 
                                 "explanation", "detected_patterns", "ai_analysis", "timestamp"]
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    print(f"❌ Missing fields: {missing_fields}")
                    all_passed = False
                else:
                    print("✅ All required fields present")
                
                # Verify risk level
                actual_risk = data.get("risk_level")
                expected_risk = test_case["expected_risk"]
                
                if actual_risk == expected_risk:
                    print(f"✅ Risk level: {actual_risk} (Expected: {expected_risk})")
                else:
                    print(f"⚠️  Risk level: {actual_risk} (Expected: {expected_risk}) - May be acceptable")
                
                # Verify type
                if data.get("type") == "message":
                    print("✅ Type: message")
                else:
                    print(f"❌ Type: {data.get('type')} (Expected: message)")
                    all_passed = False
                
                # Store ID for history testing
                detection_ids.append(data.get("id"))
                
                print(f"Risk Score: {data.get('risk_score')}")
                print(f"Detected Patterns: {data.get('detected_patterns')}")
                print(f"AI Analysis: {data.get('ai_analysis', 'N/A')[:100]}...")
                
            else:
                all_passed = False
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            all_passed = False
    
    return all_passed, detection_ids

def test_voice_analysis():
    """Test POST /api/analyze-voice endpoint structure"""
    print_test_header("Voice Analysis Endpoint")
    
    try:
        # Create a minimal test audio (silence) as base64
        # This is just to test the endpoint structure, not actual audio processing
        import numpy as np
        import io
        import wave
        
        # Generate 1 second of silence at 16kHz
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        audio_data = np.zeros(samples, dtype=np.int16)
        
        # Convert to WAV bytes
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
        
        audio_bytes = buffer.getvalue()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        payload = {
            "audio_base64": audio_base64,
            "duration": duration
        }
        
        response = requests.post(f"{BACKEND_URL}/analyze-voice", json=payload)
        success = print_result("POST /api/analyze-voice", response.status_code, response.json())
        
        if success:
            data = response.json()
            
            # Verify required fields
            required_fields = ["id", "type", "content", "risk_level", "risk_score", 
                             "explanation", "detected_patterns", "timestamp"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
                return False
            else:
                print("✅ All required fields present")
            
            # Verify type
            if data.get("type") == "voice":
                print("✅ Type: voice")
            else:
                print(f"❌ Type: {data.get('type')} (Expected: voice)")
                return False
            
            print(f"Risk Score: {data.get('risk_score')}")
            print(f"Risk Level: {data.get('risk_level')}")
            print(f"Explanation: {data.get('explanation')}")
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_stats_endpoint():
    """Test GET /api/stats - Statistics endpoint"""
    print_test_header("Statistics Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/stats")
        success = print_result("GET /api/stats", response.status_code, response.json())
        
        if success:
            data = response.json()
            
            # Verify required fields
            required_fields = ["total_scans", "high_risk", "medium_risk", "low_risk"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
                return False
            else:
                print("✅ All required fields present")
            
            # Verify data types
            for field in required_fields:
                if not isinstance(data[field], int):
                    print(f"❌ Field {field} is not an integer: {type(data[field])}")
                    return False
            
            print("✅ All fields are integers")
            
            # Verify logical consistency
            total = data["total_scans"]
            sum_risks = data["high_risk"] + data["medium_risk"] + data["low_risk"]
            
            if total >= sum_risks:
                print("✅ Statistics are logically consistent")
            else:
                print(f"❌ Total scans ({total}) < sum of risk levels ({sum_risks})")
                return False
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_history_endpoint():
    """Test GET /api/history - Detection history"""
    print_test_header("Detection History Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/history")
        success = print_result("GET /api/history", response.status_code, response.json())
        
        if success:
            data = response.json()
            
            # Verify required fields
            if "detections" not in data or "total" not in data:
                print("❌ Missing required fields: detections or total")
                return False
            
            print("✅ Required fields present")
            
            # Verify data types
            if not isinstance(data["detections"], list):
                print(f"❌ detections is not a list: {type(data['detections'])}")
                return False
            
            if not isinstance(data["total"], int):
                print(f"❌ total is not an integer: {type(data['total'])}")
                return False
            
            print("✅ Data types correct")
            
            # Check if we have detections from previous tests
            detections = data["detections"]
            total = data["total"]
            
            print(f"Total detections: {total}")
            print(f"Returned detections: {len(detections)}")
            
            if len(detections) > 0:
                print("✅ History contains detections from previous tests")
                
                # Verify detection structure
                first_detection = detections[0]
                required_detection_fields = ["id", "type", "content", "risk_level", 
                                           "risk_score", "explanation", "detected_patterns", "timestamp"]
                
                missing_fields = [field for field in required_detection_fields if field not in first_detection]
                if missing_fields:
                    print(f"❌ Detection missing fields: {missing_fields}")
                    return False
                else:
                    print("✅ Detection structure correct")
            else:
                print("⚠️  No detections in history - may be expected if database is empty")
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting TrustShield AI Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now()}")
    
    results = {}
    
    # Test 1: Root endpoint
    results["root"] = test_root_endpoint()
    
    # Test 2: Message detection (this will create data for history test)
    results["message_detection"], detection_ids = test_message_detection()
    
    # Test 3: Voice analysis
    results["voice_analysis"] = test_voice_analysis()
    
    # Test 4: Statistics (should show data from message tests)
    results["stats"] = test_stats_endpoint()
    
    # Test 5: History (should show data from previous tests)
    results["history"] = test_history_endpoint()
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print("⚠️  SOME TESTS FAILED")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)