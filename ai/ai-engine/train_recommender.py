import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

# ==============================================================================
# 1. CLASS DEFINITION (MUST MATCH APP.PY EXACTLY)
# ==============================================================================
class RecommenderPipeline:
    """
    Wraps the Ranking Model (XGBoost Ranker).
    Ensures that cold-start users or bad data don't break the recommendation loop.
    """
    def __init__(self, model=None):
        self.model = model
        # Strict bounds to prevent mathematical anomalies
        self.bounds = {
            'user_mastery': (0.0, 100.0),       # From AI #1
            'topic_memory_strength': (0.0, 1.0), # SRS decay (1=fresh, 0=forgotten)
            'question_difficulty': (1, 3),      # 1=Easy, 2=Med, 3=Hard
            'days_since_attempt': (0, 365),
            'exam_weightage': (0, 20),         # Marks in board exam
            'prerequisite_strength': (0.0, 100.0)
        }
        # "Cold Start" Defaults (Crucial for new users)
        self.defaults = {
            'user_mastery': 50.0,              # Assume average initially
            'topic_memory_strength': 0.0,      # Assume they don't know it yet
            'days_since_attempt': 999,         # Never attempted
            'prerequisite_strength': 100.0,    # Assume prereqs are met to avoid blocking
            'is_part_of_streak': 0             # No current streak context
        }

    def preprocess(self, input_df):
        """
        Sanitizes input candidates before ranking.
        """
        df = input_df.copy()

        # 1. Fill Missing Values
        for col, default_val in self.defaults.items():
            if col in df.columns:
                df[col] = df[col].fillna(default_val)
            else:
                df[col] = default_val

        # 2. Safety Clamping
        for col, (min_val, max_val) in self.bounds.items():
            if col in df.columns:
                df[col] = df[col].clip(lower=min_val, upper=max_val)

        # 3. Feature Engineering (On the fly)
        # Calculate 'Gap': How far is question difficulty from user skill?
        # Normalize skill to 1-3 scale to match difficulty
        if 'user_mastery' in df.columns and 'question_difficulty' in df.columns:
            normalized_skill = 1 + (df['user_mastery'] / 50.0) # Map 0-100 to 1.0-3.0
            df['skill_diff_gap'] = (df['question_difficulty'] - normalized_skill).abs()

        # 4. Alignment (Ensure columns match training)
        if hasattr(self.model, "feature_names_in_"):
            df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)

        return df

    def fit(self, X, y, group=None):
        X_clean = self.preprocess(X)
        if group is not None:
            self.model.fit(X_clean, y, group=group)
        else:
            self.model.fit(X_clean, y)

    def predict(self, X):
        X_clean = self.preprocess(X)
        return self.model.predict(X_clean)

# ==============================================================================
# 2. SYNTHETIC DATA GENERATION (SIMULATES STUDENTS)
# ==============================================================================
def generate_recommender_data(n_users=2000, items_per_user=20):
    """
    Simulates a 'Session' where the AI has to rank 20 possible questions
    for a user to do next.
    """
    np.random.seed(42)
    total_samples = n_users * items_per_user

    # --- USER STATE (Context) ---
    # Mastery Level (0-100) from AI #1
    user_mastery = np.repeat(np.random.normal(60, 15, n_users), items_per_user)
    user_mastery = np.clip(user_mastery, 10, 95)

    # --- QUESTION ATTRIBUTES (Candidates) ---
    # Difficulty: 1 (Easy), 2 (Medium), 3 (Hard)
    question_difficulty = np.random.choice([1, 2, 3], size=total_samples, p=[0.3, 0.4, 0.3])
    # Exam Weightage (High value = Board Exam Favorite)
    exam_weightage = np.random.randint(1, 10, size=total_samples)

    # --- INTERACTION HISTORY (Memory) ---
    # SRS Strength: 1.0 = Just learned, 0.1 = Almost forgotten
    topic_memory_strength = np.random.beta(2, 2, size=total_samples)
    # Days since last attempt (To trigger review)
    days_since_attempt = np.random.exponential(10, size=total_samples)
    # Prerequisite: How well does user know the foundation topic?
    prereq_noise = np.random.normal(0, 10, total_samples)
    prerequisite_strength = np.clip(user_mastery + prereq_noise, 0, 100)

    # --------------------------------------------------------------------------
    # THE LOGIC: What makes a "Perfect" Recommendation? (Ground Truth)
    # --------------------------------------------------------------------------
    
    # 1. FLOW STATE: Match Difficulty to Skill
    user_skill_level = 1 + (user_mastery / 50.0)
    difficulty_gap = np.abs(question_difficulty - user_skill_level)
    flow_score = 10 - (difficulty_gap * 5)

    # 2. SPACED REPETITION: Boost items about to be forgotten (<0.4)
    review_urgency = np.where(topic_memory_strength < 0.4, 8.0, 0.0)
    # Penalize items known too well (>0.9) to avoid boredom
    boredom_penalty = np.where(topic_memory_strength > 0.9, -5.0, 0.0)

    # 3. EXAM IMPORTANCE
    importance_boost = exam_weightage * 0.5

    # 4. BLOCKERS: Don't show if prereq not met
    prereq_penalty = np.where(prerequisite_strength < 35, -20.0, 0.0)

    # Final "Relevance Score" (Target Variable)
    relevance_score = flow_score + review_urgency + boredom_penalty + importance_boost + prereq_penalty
    
    # Add noise (Human irrationality)
    relevance_score += np.random.normal(0, 2.0, total_samples)
    final_score = np.clip(relevance_score, 0, 10)

    df = pd.DataFrame({
        'user_mastery': user_mastery,
        'question_difficulty': question_difficulty,
        'exam_weightage': exam_weightage,
        'topic_memory_strength': topic_memory_strength,
        'days_since_attempt': days_since_attempt,
        'prerequisite_strength': prerequisite_strength,
        'relevance_score': final_score # TARGET
    })

    # Group ID is needed for "Learning to Rank" (ranking items per user)
    q_ids = np.repeat(np.arange(n_users), items_per_user)

    return df, q_ids

# ==============================================================================
# 3. MAIN TRAINING BLOCK
# ==============================================================================
if __name__ == "__main__":
    print("--- 🧠 AI #5: Training Question Recommender ---")

    # 1. Generate Data
    print("⏳ Generating synthetic training data...")
    df, q_ids = generate_recommender_data(n_users=3000, items_per_user=20)
    
    X = df.drop(columns=['relevance_score'])
    y = df['relevance_score']
    
    # Calculate group sizes for XGBoost Ranker
    # (Tells XGBoost: "The first 20 rows belong to User 1, the next 20 to User 2...")
    groups = np.unique(q_ids, return_counts=True)[1]

    # 2. Define Model
    print("⚙️  Initializing XGBoost Ranker...")
    ranker = xgb.XGBRanker(
        objective='rank:pairwise', # Optimization objective
        learning_rate=0.1,
        max_depth=5,
        n_estimators=150,
        subsample=0.8,
        random_state=42
    )

    # 3. Train
    print("🚀 Training Pipeline...")
    pipeline = RecommenderPipeline(model=ranker)
    pipeline.fit(X, y, group=groups)

    # 4. Save
    output_path = "recommender_pipeline_v1.pkl"
    joblib.dump(pipeline, output_path)
    print(f"✅ Model Saved Successfully: {output_path}")
    print("NOTE: Move this file to 'ai-engine/' if running locally.")