import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix

# ==============================================================================
# 1. THE SAFETY & INTERFACE LAYER (Must match app.py EXACTLY)
# ==============================================================================
class CognitiveProfilerPipeline:
    """
    Wraps the Classifier.
    Ensures the AI can handle incomplete data (e.g., a student who
    has done 'Easy' questions but never an 'Analyze' question).
    """
    def __init__(self, model=None):
        self.model = model
        # The 4 Bloom's Taxonomy Levels
        self.levels = ['Remember', 'Understand', 'Apply', 'Analyze']

        # Defaults for missing data (Cold Start)
        self.defaults = {}
        for level in self.levels:
            self.defaults[f'acc_{level}'] = 0.5
            self.defaults[f'time_{level}'] = 1.0  # 1.0 means took exactly optimum time

    def preprocess(self, input_df):
        df = input_df.copy()

        # 1. Fill Missing Cognitive Buckets
        for col, val in self.defaults.items():
            if col not in df.columns:
                df[col] = val
            else:
                df[col] = df[col].fillna(val)

        # 2. Safety Clamping
        time_cols = [c for c in df.columns if 'time_' in c]
        for col in time_cols:
            df[col] = df[col].clip(lower=0.1, upper=4.0)

        return df

    def fit(self, X, y):
        X_clean = self.preprocess(X)
        self.model.fit(X_clean, y)

    def predict(self, X):
        X_clean = self.preprocess(X)
        return self.model.predict(X_clean)

# ==============================================================================
# 2. DATA GENERATION (Synthetic Behavioral Personas)
# ==============================================================================
def generate_cognitive_data(n_students=5000):
    np.random.seed(42)
    samples_per_type = n_students // 5
    
    def create_batch(label, acc_profile, time_profile):
        batch = pd.DataFrame()
        levels = ['Remember', 'Understand', 'Apply', 'Analyze']
        for i, level in enumerate(levels):
            acc = np.random.normal(acc_profile[i], 0.1, samples_per_type)
            batch[f'acc_{level}'] = np.clip(acc, 0.0, 1.0)
            time = np.random.normal(time_profile[i], 0.2, samples_per_type)
            batch[f'time_{level}'] = np.clip(time, 0.2, 3.0)
        batch['profile_label'] = label
        return batch

    # Personas
    p1 = create_batch('Rote_Learner', [0.9, 0.7, 0.4, 0.2], [0.8, 0.9, 1.5, 2.0])
    p2 = create_batch('Deep_Thinker', [0.7, 0.8, 0.85, 0.9], [1.2, 1.3, 1.1, 1.0])
    p3 = create_batch('Impulsive_Guesser', [0.3, 0.25, 0.25, 0.2], [0.4, 0.4, 0.5, 0.5])
    p4 = create_batch('Master', [0.95, 0.9, 0.9, 0.85], [0.9, 1.0, 1.0, 1.0])
    p5 = create_batch('Struggler', [0.4, 0.3, 0.2, 0.1], [1.5, 1.8, 2.0, 2.5])

    df = pd.concat([p1, p2, p3, p4, p5], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Inject Missing Data (10%)
    mask_indices = np.random.choice(df.index, size=int(n_students * 0.1), replace=False)
    df.loc[mask_indices, ['acc_Analyze', 'time_Analyze']] = np.nan
    return df

# ==============================================================================
# 3. TRAINING
# ==============================================================================
if __name__ == "__main__":
    print("Generating Training Data...")
    df = generate_cognitive_data(n_students=5000)
    X = df.drop(columns=['profile_label'])
    y = df['profile_label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42
    )

    # Create and Fit Pipeline
    pipeline = CognitiveProfilerPipeline(model=rf_model)
    pipeline.fit(X_train, y_train)

    # Evaluation
    print("\nEvaluating Model...")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Save
    filename = "cognitive_profiler_pipeline_v1.pkl"
    joblib.dump(pipeline, filename)
    print(f"✅ Model saved as: {filename}")