from transformers import pipeline
import logging

# Initialize Zero-Shot Classifier (Lazy loading recommended in production, but global for now)
# Using a smaller model for speed if available, or default 'facebook/bart-large-mnli'
try:
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    logging.info("[AI] Zero-Shot Classifier loaded successfully.")
except Exception as e:
    logging.error(f"[AI] Failed to load Zero-Shot Classifier: {e}")
    classifier = None

# Contextual Labels
THREAT_LABELS = [
    "illicit narcotics trading", 
    "illegal weapons trafficking", 
    "stolen credit card fraud", 
    "cybercrime & hacking exploits", 
    "human trafficking & exploitation",
    "counterfeit documents & id"
]

SAFE_LABELS = [
    "legal pharmaceutical medicine",
    "medical research & journals",
    "news & journalism",
    "cybersecurity education & defense",
    "legal marketplace & e-commerce",
    "forum discussion & community"
]

ALL_LABELS = THREAT_LABELS + SAFE_LABELS

def classify_document(text):
    """
    Classifies text using Zero-Shot Classification with Contextual Disambiguation.
    Returns:
        {
            "label": str,
            "score": float,
            "is_threat": bool,
            "raw_scores": dict
        }
    """
    if not classifier or not text.strip():
        return {
            "label": "unknown",
            "score": 0.0,
            "is_threat": False,
            "raw_scores": {}
        }

    try:
        # Run classification
        # multi_label=True allows independent scoring, but we want to pick the best fit here.
        # multi_label=False (default) forces scores to sum to 1.
        result = classifier(text, ALL_LABELS, multi_label=True)
        
        scores = dict(zip(result['labels'], result['scores']))
        
        # Get highest scoring Safe and Threat labels
        max_threat_label = max(THREAT_LABELS, key=lambda l: scores.get(l, 0))
        max_threat_score = scores.get(max_threat_label, 0)
        
        max_safe_label = max(SAFE_LABELS, key=lambda l: scores.get(l, 0))
        max_safe_score = scores.get(max_safe_label, 0)

        # Disambiguation Logic
        if max_safe_score > max_threat_score:
            # It's safe
            final_label = max_safe_label
            final_score = max_safe_score
            is_threat = False
        else:
            # It might be a threat
            if max_threat_score > 0.6:
                final_label = max_threat_label
                final_score = max_threat_score
                is_threat = True
            else:
                # Low confidence threat -> potentially just noise or safe
                final_label = "uncertain"
                final_score = max_threat_score
                is_threat = False

        return {
            "label": final_label,
            "score": final_score,
            "is_threat": is_threat,
            "raw_scores": scores
        }

    except Exception as e:
        logging.error(f"[AI] Classification error: {e}")
        return {
            "label": "error",
            "score": 0.0,
            "is_threat": False,
            "raw_scores": {}
        }
