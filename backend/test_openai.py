"""
Test OpenAI API Key and Model Availability
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ No OpenAI API key found in .env")
    exit(1)

print(f"✓ API Key found: {api_key[:20]}...")

# Test with OpenAI SDK
try:
    from openai import OpenAI
    print("✓ OpenAI SDK imported")

    client = OpenAI(api_key=api_key)
    print("✓ OpenAI client created")

    # Test 1: List available models
    print("\n🔍 Fetching available models...")
    try:
        models = client.models.list()
        model_ids = [model.id for model in models.data if 'gpt' in model.id.lower()]
        print(f"✓ Found {len(model_ids)} GPT models:")
        for model_id in sorted(model_ids)[:10]:  # Show first 10
            print(f"  - {model_id}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

    # Test 2: Try different model names
    print("\n🧪 Testing different model names...")

    test_models = [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-4-turbo-preview",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-3.5-turbo"
    ]

    for model_name in test_models:
        try:
            print(f"\nTesting: {model_name}")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": "Say 'OK' if you can read this."}
                ],
                max_tokens=10
            )
            result = response.choices[0].message.content
            print(f"  ✅ SUCCESS - Response: {result}")
            print(f"  ✓ Model {model_name} is available!")
            break  # Stop after first success
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg or "model_not_found" in error_msg:
                print(f"  ❌ Model not found: {model_name}")
            elif "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
                print(f"  ❌ Authentication error - API key might be invalid")
                break
            else:
                print(f"  ❌ Error: {error_msg[:100]}")

except ImportError:
    print("❌ OpenAI SDK not installed")
    print("Install with: pip install openai")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n" + "="*60)
