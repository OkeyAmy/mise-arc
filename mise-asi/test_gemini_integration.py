import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from orchestration.orchestrator import get_orchestrator
from config import settings

def test_gemini():
    print("Testing Gemini Integration with google.genai SDK...")
    
    if not settings.GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY not found in settings/env")
        print("Please add GEMINI_API_KEY to your mise-asi/.env file")
        return
    
    print(f"✅ GEMINI_API_KEY found (starts with: {settings.GEMINI_API_KEY[:8]}...)")
        
    try:
        print("\nInitializing orchestrator...")
        orchestrator = get_orchestrator()
        print("✅ Orchestrator initialized")
        print(f"   Model: {orchestrator.model_name}")
        print(f"   Tools loaded: {len(orchestrator.tools[0].function_declarations)}")
        
        print("\n--- Test 1: Simple greeting ---")
        response = orchestrator.process_message(
            message="Hello, are you working?",
            user_id="test_user"
        )
        print(f"Response: {response['text'][:200]}...")
        
        if response["text"]:
            print("✅ Received response from Gemini")
        else:
            print("❌ Empty response")
        
        print("\n--- Test 2: Meal suggestion (should trigger parallel function calls) ---")
        response2 = orchestrator.process_message(
            message="What should I make for dinner tonight?",
            user_id="test_user"
        )
        
        print(f"\nFunction calls made: {len(response2['function_calls'])}")
        for fc in response2['function_calls']:
            print(f"  - {fc['name']}")
        
        print(f"\nFinal response: {response2['text'][:300]}...")
        
        if len(response2['function_calls']) >= 3:
            print("✅ Parallel function calling working! Called 3+ functions.")
        else:
            print(f"⚠️ Expected 3+ parallel calls, got {len(response2['function_calls'])}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gemini()
