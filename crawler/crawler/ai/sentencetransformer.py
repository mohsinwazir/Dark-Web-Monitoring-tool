from sentence_transformers import SentenceTransformer
import re

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def get_embedding(text):
    if not text:
        return []
    text = re.sub(r"\s+", " ", text).strip()
    embedding = model.encode(text).tolist()
    return embedding
