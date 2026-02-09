from crawler.ai.classifier import classify_document
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

test_cases = [
    {
        "text": "We sell insulin and antibiotics.",
        "expected_safe": True,
        "desc": "Medical Pharmacy (Safe)"
    },
    {
        "text": "We sell pure crystal meth.",
        "expected_safe": False,
        "desc": "Drug Dealer (Threat)"
    },
    {
        "text": "Get your fresh cc fullz here, high balance.",
        "expected_safe": False,
        "desc": "Carding (Threat)"
    },
    {
        "text": "Discussion about cybersecurity defense strategies.",
        "expected_safe": True,
        "desc": "Cybersecurity Forum (Safe)"
    }
]

print("--- Starting Classifier Test ---")
for case in test_cases:
    result = classify_document(case["text"])
    print(f"\nText: {case['text']}")
    print(f"Desc: {case['desc']}")
    print(f"Label: {result['label']}")
    print(f"Score: {result['score']:.4f}")
    print(f"Is Threat: {result['is_threat']}")
    
    is_safe_result = not result['is_threat']
    if is_safe_result == case['expected_safe']:
        print("✅ PASS")
    else:
        print("❌ FAIL")

print("\n--- Test Complete ---")
