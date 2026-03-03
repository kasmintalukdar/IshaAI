import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, precision_score

# ==============================================================================
# 1. THE SAFETY & INTERFACE LAYER (Must match app.py)
# ==============================================================================
class BurnoutWatchdogPipeline:
    def __init__(self, model=None, threshold=0.75):
        self.model = model
        self.threshold = threshold
        self.defaults = {
            'session_duration_mins': 0.0,
            'recent_accuracy': 1.0,
            'avg_time_per_question': 30.0,
            'streak': 0,
            'hour_of_day': 12
        }

    def preprocess(self, input_df):
        df = input_df.copy()
        for col, val in self.defaults.items():
            if col not in df.columns: df[col] = val
            else: df[col] = df[col].fillna(val)
        df['session_duration_mins'] = df['session_duration_mins'].clip(upper=300)
        if 'strain_index' not in df.columns:
            hours_worked = df['session_duration_mins'] / 60.0
            failure_stress = (1.0 - df['recent_accuracy']) * 2.5
            df['strain_index'] = hours_worked + failure_stress
        return df

    def fit(self, X, y):
        X_clean = self.preprocess(X)
        self.model.fit(X_clean, y)

    def predict(self, X):
        X_clean = self.preprocess(X)
        probs = self.model.predict_proba(X_clean)[:, 1]
        return (probs > self.threshold).astype(int)

# ==============================================================================
# 2. DATA GENERATION & TRAINING
# ==============================================================================
def generate_burnout_data(n_samples=6000):
    np.random.seed(42)
    session_duration_mins = np.clip(np.random.normal(60, 40, n_samples), 1, 300)
    recent_accuracy = np.random.beta(5, 2, n_samples)
    hour_of_day = np.random.randint(0, 24, n_samples)
    streak = np.random.poisson(10, n_samples)
    avg_time_per_question = np.clip(np.random.normal(30, 15, n_samples), 2, 180)

    # Burnout Ground Truth Logic
    type_a = (session_duration_mins > 90) & (recent_accuracy < 0.5)
    type_b = (recent_accuracy < 0.3) & (avg_time_per_question < 4)
    type_c = ((hour_of_day >= 1) & (hour_of_day <= 4)) & (recent_accuracy < 0.6)
    y = (type_a | type_b | type_c).astype(int)
    
    return pd.DataFrame({
        'session_duration_mins': session_duration_mins,
        'recent_accuracy': recent_accuracy,
        'avg_time_per_question': avg_time_per_question,
        'hour_of_day': hour_of_day,
        'streak': streak,
        'is_burned_out': y
    })

if __name__ == "__main__":
    df = generate_burnout_data()
    X = df.drop(columns=['is_burned_out'])
    y = df['is_burned_out']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid={'max_depth': [10, 12], 'n_estimators': [100, 200]}, scoring='precision', cv=3)
    grid_search.fit(X_train, y_train)

    final_pipeline = BurnoutWatchdogPipeline(model=grid_search.best_estimator_, threshold=0.75)
    final_pipeline.fit(X_train, y_train)

    # Save
    filename = "burnout_watchdog_pipeline_v2.pkl"
    joblib.dump(final_pipeline, filename)
    print(f"✅ AI #4 Saved: {filename}")