import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

# ==============================================================================
# 1. THE SAFETY & INTERFACE LAYER (The "Helmet")
# ==============================================================================
class ExamProjectorPipeline:
    def __init__(self, model=None):
        self.model = model
        self.bounds = {
            'weighted_mastery': (0.0, 100.0),
            'syllabus_completion': (0.0, 1.0),
            'mock_test_score': (0.0, 100.0),
            'consistency_score': (0.0, 1.0),
            'exam_anxiety_factor': (0.0, 2.0)
        }
        self.defaults = {
            'syllabus_completion': 0.01,
            'mock_test_score': 30.0,
            'consistency_score': 0.5,
            'exam_anxiety_factor': 1.0,
            'weighted_mastery': 0.0
        }

    def preprocess(self, input_df):
        df = input_df.copy()
        # 1. Fill Missing Values
        for col, val in self.defaults.items():
            if col not in df.columns:
                df[col] = val
            else:
                df[col] = df[col].fillna(val)

        # 2. Safety Clamping
        for col, (min_val, max_val) in self.bounds.items():
            if col in df.columns:
                df[col] = df[col].clip(lower=min_val, upper=max_val)
                
        # 3. Column Ordering (Critical for XGBoost in Pipeline)
        if hasattr(self.model, "feature_names_in_"):
             df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)

        return df

    def fit(self, X, y):
        X_clean = self.preprocess(X)
        self.model.fit(X_clean, y)

    def predict(self, X):
        X_clean = self.preprocess(X)
        preds = self.model.predict(X_clean)
        return np.clip(preds, 0.0, 100.0)

# ==============================================================================
# 2. DATA GENERATION
# ==============================================================================
def generate_exam_data(n_students=8000):
    np.random.seed(42)
    syllabus_completion = np.random.beta(4, 2, n_students)
    raw_mastery = np.random.normal(60, 15, n_students)
    weighted_mastery = np.clip(raw_mastery, 10, 95)
    mock_noise = np.random.normal(0, 8, n_students)
    mock_test_score = np.clip(weighted_mastery + mock_noise, 0, 100)
    consistency_score = np.random.beta(3, 2, n_students)
    anxiety = np.random.choice([1.0, 0.85, 0.7], size=n_students, p=[0.8, 0.15, 0.05])
    exam_anxiety_factor = np.where(anxiety < 1.0, 2.0 - anxiety, 1.0)

    # Target Logic
    predicted_score = weighted_mastery * 0.7 + mock_test_score * 0.3
    syllabus_penalty = np.where(syllabus_completion < 0.7, (0.7 - syllabus_completion) * 50, 0)
    consistency_bonus = consistency_score * 5
    final_score = (predicted_score - syllabus_penalty + consistency_bonus) * anxiety
    final_score += np.random.normal(0, 3, n_students)
    final_score = np.clip(final_score, 0, 100)

    df = pd.DataFrame({
        'weighted_mastery': weighted_mastery,
        'syllabus_completion': syllabus_completion,
        'mock_test_score': mock_test_score,
        'consistency_score': consistency_score,
        'exam_anxiety_factor': exam_anxiety_factor,
        'final_board_score': final_score
    })
    
    mask = np.random.choice([True, False], size=len(df), p=[0.1, 0.9])
    df.loc[mask, 'mock_test_score'] = np.nan
    return df

# ==============================================================================
# 3. TRAINING & EVALUATION
# ==============================================================================
if __name__ == "__main__":
    print("⏳ Generating & Training Exam Projector...")
    df = generate_exam_data(n_students=8000)
    X = df.drop(columns=['final_board_score'])
    y = df['final_board_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Using optimized params
    final_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        reg_alpha=0.5,
        random_state=42
    )

    final_pipeline = ExamProjectorPipeline(model=final_model)
    final_pipeline.fit(X_train, y_train)

    # Metrics
    y_pred = final_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("\n" + "="*30)
    print(f"📊 EXAM PROJECTOR REPORT")
    print("="*30)
    print(f"Mean Absolute Error: {mae:.2f} marks")
    print(f"R2 Score: {r2:.4f}")

    if mae < 6.0:
        print("✅ Status: PRODUCTION READY")
    else:
        print("⚠️ Status: NEEDS TUNING")

    # ==============================================================================
    # 4. SAVE
    # ==============================================================================
    filename = "exam_projector_pipeline_v1.pkl"
    joblib.dump(final_pipeline, filename)
    print(f"\n💾 Model saved locally as: {filename}")