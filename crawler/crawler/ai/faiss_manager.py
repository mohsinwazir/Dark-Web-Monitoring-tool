import faiss
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)


class FAISSIndexManager:
    """
    Manages FAISS index for semantic deduplication.
    Stores and searches document embeddings to detect duplicate content.
    """
    
    def __init__(self, dimension=384, index_path="faiss_index.bin"):
        """
        Args:
            dimension: Dimension of embeddings (384 for all-MiniLM-L6-v2)
            index_path: Path to save/load FAISS index
        """
        self.dimension = dimension
        self.index_path = index_path
        self.index = None
        self.id_map = []  # Maps FAISS index position to document URL/ID
        
        # Initialize or load index
        if os.path.exists(index_path):
            self.load_index()
        else:
            self.create_index()
    
    def create_index(self):
        """Create a new FAISS index using L2 distance"""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.id_map = []
        logger.info(f"[FAISS] Created new index with dimension {self.dimension}")
    
    def load_index(self):
        """Load existing FAISS index from disk"""
        try:
            self.index = faiss.read_index(self.index_path)
            logger.info(f"[FAISS] Loaded index from {self.index_path}")
        except Exception as e:
            logger.error(f"[FAISS] Failed to load index: {e}")
            self.create_index()
    
    def save_index(self):
        """Save FAISS index to disk"""
        try:
            faiss.write_index(self.index, self.index_path)
            logger.info(f"[FAISS] Saved index to {self.index_path}")
        except Exception as e:
            logger.error(f"[FAISS] Failed to save index: {e}")
    
    def add_embedding(self, embedding, document_id):
        """
        Add a new embedding to the index
        
        Args:
            embedding: List or numpy array of floats (dimension must match index)
            document_id: Unique identifier for this document (URL or MongoDB _id)
        """
        if not isinstance(embedding, np.ndarray):
            embedding = np.array(embedding, dtype='float32')
        
        # FAISS expects 2D array
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        self.index.add(embedding)
        self.id_map.append(document_id)
        logger.debug(f"[FAISS] Added embedding for {document_id}")
    
    def search_similar(self, embedding, k=1, threshold=0.95):
        """
        Search for similar embeddings in the index
        
        Args:
            embedding: Query embedding
            k: Number of nearest neighbors to return
            threshold: Similarity threshold (0-1), default 0.95 for 95% similarity
        
        Returns:
            List of (document_id, similarity_score) tuples for matches above threshold
            Empty list if no duplicates found
        """
        if self.index.ntotal == 0:
            # Index is empty, no duplicates possible
            return []
        
        if not isinstance(embedding, np.ndarray):
            embedding = np.array(embedding, dtype='float32')
        
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        # Search for k nearest neighbors
        distances, indices = self.index.search(embedding, k)
        
        # Convert L2 distance to similarity score (1 - normalized distance)
        # For L2 distance: similarity = 1 / (1 + distance)
        # Alternatively: cosine similarity conversion
        similarities = 1.0 / (1.0 + distances[0])
        
        # Filter results above threshold
        results = []
        for idx, similarity in zip(indices[0], similarities):
            if similarity >= threshold and idx < len(self.id_map):
                results.append((self.id_map[idx], float(similarity)))
        
        return results
    
    def is_duplicate(self, embedding, threshold=0.95):
        """
        Check if embedding is a duplicate of existing content
        
        Returns:
            (is_duplicate, matched_id, similarity_score)
        """
        similar = self.search_similar(embedding, k=1, threshold=threshold)
        
        if similar:
            matched_id, similarity = similar[0]
            logger.info(f"[FAISS] Duplicate detected! Similarity {similarity:.3f} with {matched_id}")
            return True, matched_id, similarity
        else:
            return False, None, 0.0
    
    def get_total_documents(self):
        """Return total number of documents in index"""
        return self.index.ntotal


# Global instance for use in pipeline
faiss_manager = None

def get_faiss_manager(dimension=384):
    """Get or create global FAISS manager instance"""
    global faiss_manager
    if faiss_manager is None:
        faiss_manager = FAISSIndexManager(dimension=dimension)
    return faiss_manager
