"""
Test inventory handler parameter variations
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from handlers.inventory_handlers import handle_delete_inventory_item, handle_update_inventory
from handlers.types import HandlerContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_parameter_variations():
    """Test that handlers accept both camelCase and snake_case parameters"""
    
    user_id = os.getenv("USER_ID")
    if not user_id:
        print("❌ Error: USER_ID not found in .env file")
        return

    print(f"Testing inventory handler parameter variations for user {user_id}...\n")
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.user_id = user_id
        
        def log_step(self, msg, *args, **kwargs):
            print(f"  Log: {msg}")
    
    ctx = MockContext()
    
    # Test 1: deleteInventoryItem with camelCase
    print("Test 1: deleteInventoryItem with camelCase 'itemName'")
    args_camel = {"itemName": "eggs"}
    try:
        result = handle_delete_inventory_item(args_camel, ctx)
        print(f"  ✅ Accepted camelCase: {result[:50]}...")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    
    # Test 2: deleteInventoryItem with snake_case
    print("\nTest 2: deleteInventoryItem with snake_case 'item_name'")
    args_snake = {"item_name": "eggs"}
    try:
        result = handle_delete_inventory_item(args_snake, ctx)
        print(f"  ✅ Accepted snake_case: {result[:50]}...")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    
    # Test 3: updateInventory with camelCase in items
    print("\nTest 3: updateInventory with camelCase 'itemName' in items")
    args_update_camel = {
        "items": [
            {"itemName": "onions", "quantity": 4, "unit": "piece", "category": "produce"}
        ]
    }
    try:
        result = handle_update_inventory(args_update_camel, ctx)
        print(f"  ✅ Accepted camelCase in items: {result[:50]}...")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    
    # Test 4: updateInventory with snake_case in items
    print("\nTest 4: updateInventory with snake_case 'item_name' in items")
    args_update_snake = {
        "items": [
            {"item_name": "onions", "quantity": 4, "unit": "piece", "category": "produce"}
        ]
    }
    try:
        result = handle_update_inventory(args_update_snake, ctx)
        print(f"  ✅ Accepted snake_case in items: {result[:50]}...")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    
    print("\n✅ All parameter variation tests completed!")


if __name__ == "__main__":
    test_parameter_variations()
