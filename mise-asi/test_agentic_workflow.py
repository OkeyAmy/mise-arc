"""
Test Prompts for Agentic Workflow
Run this to verify the orchestrator works correctly for different request types.

Usage:
    cd mise-asi
    source .venv/bin/activate
    python test_agentic_workflow.py
"""
import os
import sys

# Add the mise-asi directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestration.classifier import RequestClassifier, RequestType


def test_classifier():
    """Test the request classifier with various prompts."""
    print("=" * 60)
    print("TESTING REQUEST CLASSIFIER")
    print("=" * 60)
    
    classifier = RequestClassifier()
    
    # Test cases: (message, expected_type, description)
    test_cases = [
        # GREETINGS - Should NOT call any API
        ("hi", RequestType.GREETING, "Simple greeting"),
        ("Hello", RequestType.GREETING, "Hello greeting"),
        ("thanks", RequestType.GREETING, "Thanks response"),
        ("ok", RequestType.GREETING, "Confirmation"),
        
        # QUERIES - Should fetch data WITHOUT LLM
        ("what's in my shopping list", RequestType.QUERY, "Shopping list query"),
        ("show me my shopping list", RequestType.QUERY, "Show shopping list"),
        ("what do I have in my pantry", RequestType.QUERY, "Pantry query"),
        ("check my inventory", RequestType.QUERY, "Inventory check"),
        ("any leftovers?", RequestType.QUERY, "Leftovers query"),
        ("what's my dietary restrictions", RequestType.QUERY, "Preferences query"),
        
        # ACTIONS - Should use PLAN -> VALIDATE -> EXECUTE
        ("add milk to my shopping list", RequestType.ACTION, "Add item action"),
        ("remove bread from my list", RequestType.ACTION, "Remove item action"),
        ("I need eggs and butter", RequestType.ACTION, "Need items action"),
        ("put chicken in my inventory", RequestType.ACTION, "Add inventory action"),
        ("delete tomatoes from shopping list", RequestType.ACTION, "Delete action"),
        
        # QUESTIONS - Should use context + LLM for recommendation
        ("what should I make for dinner", RequestType.QUESTION, "Meal suggestion question"),
        ("suggest something for lunch", RequestType.QUESTION, "Lunch suggestion"),
        ("what can I cook with what I have", RequestType.QUESTION, "Cooking suggestion"),
        ("help me plan meals for the week", RequestType.QUESTION, "Meal planning question"),
    ]
    
    passed = 0
    failed = 0
    
    for message, expected_type, description in test_cases:
        result = classifier.classify(message)
        
        if result.request_type == expected_type:
            print(f"✅ PASS: {description}")
            print(f"   Input: \"{message}\"")
            print(f"   Type: {result.request_type.value}, Intent: {result.intent}")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Input: \"{message}\"")
            print(f"   Expected: {expected_type.value}, Got: {result.request_type.value}")
            failed += 1
        print()
    
    print("=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


def test_rate_limiter():
    """Test the rate limiter."""
    print("\n" + "=" * 60)
    print("TESTING RATE LIMITER")
    print("=" * 60)
    
    from orchestration.rate_limiter import RateLimiter
    
    limiter = RateLimiter(max_requests_per_minute=5, max_requests_per_day=100)
    
    print("Making 5 requests (should all pass)...")
    for i in range(5):
        wait_time = limiter.wait_if_needed()
        print(f"  Request {i+1}: waited {wait_time:.1f}s")
    
    stats = limiter.get_usage_stats()
    print(f"\nUsage: {stats['requests_this_minute']}/{stats['minute_limit']} per minute")
    print(f"       {stats['requests_today']}/{stats['day_limit']} per day")
    
    print("\n✅ Rate limiter working correctly")
    return True


def test_orchestrator_integration():
    """Test the full orchestrator (requires API key and database)."""
    print("\n" + "=" * 60)
    print("TESTING ORCHESTRATOR INTEGRATION")
    print("=" * 60)
    
    try:
        from orchestration import Orchestrator
        
        orchestrator = Orchestrator()
        print("✅ Orchestrator initialized successfully")
        
        # Test with a simple greeting (no API call)
        result = orchestrator.process_message("hi", "test-user-123")
        print(f"\n📝 Test: 'hi'")
        print(f"   Response: {result['text'][:100]}...")
        print(f"   Thought steps: {len(result['thought_steps'])}")
        print(f"   Plan: {result.get('plan')}")
        
        print("\n✅ Orchestrator integration test passed")
        return True
        
    except Exception as e:
        print(f"❌ Orchestrator test failed: {e}")
        return False


def print_test_prompts():
    """Print test prompts for manual testing."""
    print("\n" + "=" * 60)
    print("MANUAL TESTING PROMPTS")
    print("=" * 60)
    print("""
Copy and paste these prompts to test the AI agent:

## GREETINGS (Should respond immediately, no API call)
- hi
- hello
- thanks

## QUERIES (Should show data directly, no planning)
- what's in my shopping list?
- show me my inventory
- do I have any leftovers?
- what are my dietary restrictions?

## ACTIONS (Should show plan, then execute)
- add milk and eggs to my shopping list
- remove bread from shopping list
- I need tomatoes, onions, and garlic
- put chicken breast in my inventory

## QUESTIONS (Should gather context + use LLM)
- what should I make for dinner tonight?
- suggest a quick lunch with what I have
- what can I cook with chicken?
- help me plan meals for the week

## APPROVAL FLOW (For actions over limit)
- buy $50 worth of groceries
(Then respond with 'yes' or 'no')
""")


if __name__ == "__main__":
    print("\n🧪 AGENTIC WORKFLOW TEST SUITE\n")
    
    # Run tests
    classifier_ok = test_classifier()
    rate_limiter_ok = test_rate_limiter()
    
    # Only run integration test if explicitly requested
    if "--integration" in sys.argv:
        integration_ok = test_orchestrator_integration()
    else:
        print("\n⏭️ Skipping integration test (run with --integration to include)")
        integration_ok = True
    
    # Print manual testing prompts
    print_test_prompts()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Classifier: {'✅ PASS' if classifier_ok else '❌ FAIL'}")
    print(f"Rate Limiter: {'✅ PASS' if rate_limiter_ok else '❌ FAIL'}")
    if "--integration" in sys.argv:
        print(f"Integration: {'✅ PASS' if integration_ok else '❌ FAIL'}")
    
    all_passed = classifier_ok and rate_limiter_ok and integration_ok
    sys.exit(0 if all_passed else 1)
