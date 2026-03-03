import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# ==============================================================================
# 1. "SOLID GOLD" DATA GENERATION (Simulating Real Student Psychology)
# ==============================================================================
def generate_synthetic_data(n_samples=10000):
    """
    Generates realistic student data including noise, irrational behavior,
    and forgetting curves to prevent the AI from learning 'too perfect' logic.
    """
    np.random.seed(42) # For reproducibility

    # --- Feature 1: Accuracy Rate (0.0 to 1.0) ---
    accuracy_rate = np.random.beta(a=5, b=2, size=n_samples)

    # --- Feature 2: Difficulty Weighted Score ---
    difficulty_bias = np.random.normal(0, 0.1, n_samples)
    difficulty_weighted_score = np.clip(accuracy_rate + difficulty_bias, 0, 1)

    # --- Feature 3: Time Efficiency Ratio (Optimum / Actual) ---
    time_efficiency = np.random.normal(1.0, 0.3, n_samples)
    # Adjustment for high performers
    time_efficiency = np.where(accuracy_rate > 0.8,
                               np.random.normal(1.1, 0.2, n_samples),
                               time_efficiency)
    time_efficiency = np.clip(time_efficiency, 0.2, 3.0)

    # --- Feature 4: Cognitive Dropoff ---
    cognitive_dropoff = np.random.beta(2, 5, n_samples)

    # --- Feature 5: Consistency Index ---
    consistency_index = np.random.beta(5, 2, n_samples)

    # --- Feature 6: Recency (Days since last active) ---
    days_since_last_active = np.random.exponential(scale=7, size=n_samples)

    # --- Feature 7: Streak ---
    streak = np.random.poisson(lam=3, size=n_samples)

    # --------------------------------------------------------------------------
    # TARGET VARIABLE LOGIC: The "True Mastery" Formula (Ground Truth)
    # --------------------------------------------------------------------------
    base_score = (difficulty_weighted_score * 0.55) + (accuracy_rate * 0.25)
    
    # 1. The "Guesser" Penalty
    guessing_penalty = np.where((time_efficiency > 1.6) & (accuracy_rate < 0.45), -0.25, 0)
    
    # 2. The "Flow State" Bonus
    speed_bonus = np.where((time_efficiency > 0.9) & (time_efficiency < 1.3) & (accuracy_rate > 0.7), 0.08, 0)
    
    # 3. The "Rote Learner" Penalty
    cognitive_penalty = -0.15 * cognitive_dropoff
    
    # 4. The "Forgetting Curve"
    recency_decay = -0.005 * days_since_last_active

    # Summing it up
    final_score = base_score + guessing_penalty + speed_bonus + cognitive_penalty + recency_decay

    # --- ADDING NOISE ---
    noise = np.random.normal(0, 0.06, n_samples)
    final_score += noise

    # Scale to 0-100
    mastery_score = np.clip(final_score * 100, 0, 100)

    # Create DataFrame
    df = pd.DataFrame({
        'accuracy_rate': accuracy_rate,
        'difficulty_weighted_score': difficulty_weighted_score,
        'time_efficiency_ratio': time_efficiency,
        'cognitive_dropoff': cognitive_dropoff,
        'consistency_index': consistency_index,
        'days_since_last_active': days_since_last_active,
        'streak': streak,
        'mastery_score': mastery_score
    })

    return df

# ==============================================================================
# 2. MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    print("⏳ Generating Synthetic Data...")
    df = generate_synthetic_data(n_samples=10000)

    # Split Data
    X = df.drop(columns=['mastery_score'])
    y = df['mastery_score']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🧠 Training XGBoost AI...")
    # Using the best parameters found during your GridSearch
    final_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )

    final_model.fit(X_train, y_train)

    # Evaluation
    print("📊 Evaluating Model...")
    y_pred = final_model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"   RMSE (Error Margin): {rmse:.4f}")
    print(f"   R2 Score (Accuracy): {r2:.4f}")

    # Save Model
    filename = "student_mastery_v1.pkl"
    joblib.dump(final_model, filename)
    print(f"✅ Model saved as: {filename}")