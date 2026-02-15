"""
Test Anthropic API Key and Model Availability
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("❌ No Anthropic API key found in .env")
    exit(1)

print(f"✓ API Key found: {api_key[:20]}...")

# Test with Anthropic SDK
try:
    from anthropic import Anthropic
    print("✓ Anthropic SDK imported")

    client = Anthropic(api_key=api_key)
    print("✓ Anthropic client created")

    # Test different model names
    print("\n🧪 Testing different Claude model names...")

    test_models = [
        "claude-3-5-sonnet-20240620",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-latest",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
        "claude-2.1"
    ]

    for model_name in test_models:
        try:
            print(f"\nTesting: {model_name}")
            message = client.messages.create(
                model=model_name,
                max_tokens=20,
                messages=[
                    {"role": "user", "content": "Say 'OK' if you can read this."}
                ]
            )
            result = message.content[0].text
            print(f"  ✅ SUCCESS - Response: {result}")
            print(f"  ✓ Model {model_name} is available!")
            break  # Stop after first success
        except Exception as e:
            error_msg = str(e)
            if "not_found" in error_msg.lower() or "model" in error_msg.lower():
                print(f"  ❌ Model not found: {model_name}")
            elif "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
                print(f"  ❌ Authentication error - API key might be invalid")
                break
            elif "permission" in error_msg.lower():
                print(f"  ❌ Permission denied - API key lacks access to this model")
            else:
                print(f"  ❌ Error: {error_msg[:100]}")

except ImportError:
    print("❌ Anthropic SDK not installed")
    print("Install with: pip install anthropic")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n" + "="*60)
