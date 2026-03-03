
# # # import os
# # # import sys
# # # import joblib
# # # import pandas as pd
# # # import numpy as np
# # # import xgboost as xgb  # <--- REQUIRED for 2nd AI
# # # from fastapi import FastAPI, HTTPException
# # # from pydantic import BaseModel
# # # from typing import Optional

# # # # ==============================================================================
# # # # 1. CLASS DEFINITION FOR AI #1 (MUST REMAIN)
# # # # ==============================================================================
# # # class CognitiveProfilerPipeline:
# # #     def __init__(self, model=None):
# # #         self.model = model
# # #         self.levels = ['Remember', 'Understand', 'Apply', 'Analyze']
# # #         self.defaults = {}
# # #         for level in self.levels:
# # #             self.defaults[f'acc_{level}'] = 0.5
# # #             self.defaults[f'time_{level}'] = 1.0

# # #     def preprocess(self, input_df):
# # #         df = input_df.copy()
# # #         for col, val in self.defaults.items():
# # #             if col not in df.columns:
# # #                 df[col] = val
# # #             else:
# # #                 df[col] = df[col].fillna(val)
# # #         time_cols = [c for c in df.columns if 'time_' in c]
# # #         for col in time_cols:
# # #             df[col] = df[col].clip(lower=0.1, upper=4.0)
            
# # #         # Ensure Column Order Matches Training
# # #         if hasattr(self.model, "feature_names_in_"):
# # #             df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
# # #         return df

# # #     def predict(self, X):
# # #         X_clean = self.preprocess(X)
# # #         return self.model.predict(X_clean)

# # # # Fix Namespace for AI #1
# # # sys.modules['__main__'].CognitiveProfilerPipeline = CognitiveProfilerPipeline

# # # # ==============================================================================
# # # # 2. LOAD BOTH MODELS
# # # # ==============================================================================
# # # BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# # # PROFILER_PATH = os.path.join(BASE_DIR, "cognitive_profiler_pipeline_v1.pkl")
# # # MASTERY_PATH = os.path.join(BASE_DIR, "student_mastery_v1.pkl")

# # # profiler_pipeline = None
# # # mastery_model = None

# # # # Load AI #1 (Persona)
# # # try:
# # #     if os.path.exists(PROFILER_PATH):
# # #         profiler_pipeline = joblib.load(PROFILER_PATH)
# # #         print("✅ AI #1 (Cognitive Profiler) Loaded")
# # #     else:
# # #         print(f"⚠️ AI #1 File Missing: {PROFILER_PATH}")
# # # except Exception as e:
# # #     print(f"❌ AI #1 Load Failed: {e}")

# # # # Load AI #2 (Mastery)
# # # try:
# # #     if os.path.exists(MASTERY_PATH):
# # #         mastery_model = joblib.load(MASTERY_PATH)
# # #         print("✅ AI #2 (Student Mastery) Loaded")
# # #     else:
# # #         print(f"⚠️ AI #2 File Missing: {MASTERY_PATH}")
# # # except Exception as e:
# # #     print(f"❌ AI #2 Load Failed: {e}")

# # # # ==============================================================================
# # # # 3. FASTAPI SETUP
# # # # ==============================================================================
# # # app = FastAPI(title="AI Hub Engine (Dual-Core)")

# # # # --- Input Schema for AI #1 ---
# # # class PersonaInput(BaseModel):
# # #     acc_Remember: Optional[float] = None
# # #     time_Remember: Optional[float] = None
# # #     acc_Understand: Optional[float] = None
# # #     time_Understand: Optional[float] = None
# # #     acc_Apply: Optional[float] = None
# # #     time_Apply: Optional[float] = None
# # #     acc_Analyze: Optional[float] = None
# # #     time_Analyze: Optional[float] = None

# # # # --- Input Schema for AI #2 ---
# # # class MasteryInput(BaseModel):
# # #     accuracy_rate: float
# # #     difficulty_weighted_score: float
# # #     time_efficiency_ratio: float
# # #     cognitive_dropoff: float
# # #     consistency_index: float
# # #     days_since_last_active: float
# # #     streak: int

# # # # ==============================================================================
# # # # 4. ENDPOINTS
# # # # ==============================================================================

# # # @app.get("/")
# # # def health_check():
# # #     return {"status": "AI Engine Running", "models_loaded": {
# # #         "profiler": profiler_pipeline is not None,
# # #         "mastery": mastery_model is not None
# # #     }}

# # # @app.post("/predict-persona")
# # # def predict_persona(stats: PersonaInput):
# # #     """ AI #1: Returns a string (e.g., 'Deep_Thinker') """
# # #     if profiler_pipeline is None:
# # #         raise HTTPException(status_code=503, detail="Profiler AI not loaded")

# # #     try:
# # #         data_dict = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
# # #         df = pd.DataFrame([data_dict])
# # #         prediction = profiler_pipeline.predict(df)[0]
# # #         return {"persona": prediction}
# # #     except Exception as e:
# # #         raise HTTPException(status_code=500, detail=str(e))

# # # @app.post("/predict-mastery")
# # # def predict_mastery(stats: MasteryInput):
# # #     """ AI #2: Returns a float score (0-100) """
# # #     if mastery_model is None:
# # #         raise HTTPException(status_code=503, detail="Mastery AI not loaded")

# # #     try:
# # #         # Convert Pydantic to DataFrame
# # #         data_dict = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
# # #         df = pd.DataFrame([data_dict])

# # #         # Ensure Column Order matches Training (Crucial for XGBoost)
# # #         # XGBoost doesn't use feature names for verification as strictly as sklearn, 
# # #         # but order matters if feature_names aren't saved.
# # #         # Ideally, we pass the DataFrame directly which carries column names.
        
# # #         prediction = mastery_model.predict(df)[0]
        
# # #         # Convert numpy float to python float for JSON serialization
# # #         return {"mastery_score": float(prediction)}
# # #     except Exception as e:
# # #         raise HTTPException(status_code=500, detail=str(e))



# # import os
# # import sys
# # import joblib
# # import pandas as pd
# # import numpy as np
# # import xgboost as xgb
# # from fastapi import FastAPI, HTTPException
# # from pydantic import BaseModel
# # from typing import Optional

# # # ==============================================================================
# # # 1. CLASS DEFINITIONS (MUST MATCH TRAINING SCRIPTS)
# # # ==============================================================================

# # # --- AI #1: Cognitive Profiler Class ---
# # class CognitiveProfilerPipeline:
# #     def __init__(self, model=None):
# #         self.model = model
# #         self.levels = ['Remember', 'Understand', 'Apply', 'Analyze']
# #         self.defaults = {}
# #         for level in self.levels:
# #             self.defaults[f'acc_{level}'] = 0.5
# #             self.defaults[f'time_{level}'] = 1.0

# #     def preprocess(self, input_df):
# #         df = input_df.copy()
# #         for col, val in self.defaults.items():
# #             if col not in df.columns:
# #                 df[col] = val
# #             else:
# #                 df[col] = df[col].fillna(val)
# #         time_cols = [c for c in df.columns if 'time_' in c]
# #         for col in time_cols:
# #             df[col] = df[col].clip(lower=0.1, upper=4.0)
        
# #         # Column Order Check
# #         if hasattr(self.model, "feature_names_in_"):
# #             df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
# #         return df

# #     def predict(self, X):
# #         X_clean = self.preprocess(X)
# #         return self.model.predict(X_clean)

# # # --- AI #3: Exam Projector Class (NEW) ---
# # class ExamProjectorPipeline:
# #     def __init__(self, model=None):
# #         self.model = model
# #         self.bounds = {
# #             'weighted_mastery': (0.0, 100.0),
# #             'syllabus_completion': (0.0, 1.0),
# #             'mock_test_score': (0.0, 100.0),
# #             'consistency_score': (0.0, 1.0),
# #             'exam_anxiety_factor': (0.0, 2.0)
# #         }
# #         self.defaults = {
# #             'syllabus_completion': 0.01,
# #             'mock_test_score': 30.0,
# #             'consistency_score': 0.5,
# #             'exam_anxiety_factor': 1.0,
# #             'weighted_mastery': 0.0
# #         }

# #     def preprocess(self, input_df):
# #         df = input_df.copy()
# #         # 1. Fill Missing Values
# #         for col, val in self.defaults.items():
# #             if col not in df.columns:
# #                 df[col] = val
# #             else:
# #                 df[col] = df[col].fillna(val)
                
# #         # 2. Safety Clamping
# #         for col, (min_val, max_val) in self.bounds.items():
# #             if col in df.columns:
# #                 df[col] = df[col].clip(lower=min_val, upper=max_val)
        
# #         # 3. Column Order Check
# #         if hasattr(self.model, "feature_names_in_"):
# #              df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
# #         return df

# #     def predict(self, X):
# #         X_clean = self.preprocess(X)
# #         preds = self.model.predict(X_clean)
# #         return np.clip(preds, 0.0, 100.0)

# # # ==============================================================================
# # # 2. NAMESPACE FIXES (CRITICAL FOR PICKLE LOADING)
# # # ==============================================================================
# # sys.modules['__main__'].CognitiveProfilerPipeline = CognitiveProfilerPipeline
# # sys.modules['__main__'].ExamProjectorPipeline = ExamProjectorPipeline

# # # ==============================================================================
# # # 3. LOAD ALL 3 MODELS
# # # ==============================================================================
# # BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# # PROFILER_PATH = os.path.join(BASE_DIR, "cognitive_profiler_pipeline_v1.pkl")
# # MASTERY_PATH = os.path.join(BASE_DIR, "student_mastery_v1.pkl")
# # EXAM_PATH = os.path.join(BASE_DIR, "exam_projector_pipeline_v1.pkl")

# # models = {}

# # def load_model(path, key, name):
# #     try:
# #         if os.path.exists(path):
# #             models[key] = joblib.load(path)
# #             print(f"✅ {name} Loaded Successfully")
# #         else:
# #             print(f"⚠️ {name} File Missing: {path}")
# #             models[key] = None
# #     except Exception as e:
# #         print(f"❌ {name} Load Failed: {e}")
# #         models[key] = None

# # # Load them
# # print("--- STARTING AI ENGINE ---")
# # load_model(PROFILER_PATH, 'profiler', "AI #1 (Cognitive Profiler)")
# # load_model(MASTERY_PATH, 'mastery', "AI #2 (Student Mastery)")
# # load_model(EXAM_PATH, 'exam', "AI #3 (Exam Projector)")

# # # ==============================================================================
# # # 4. FASTAPI APP & INPUT SCHEMAS
# # # ==============================================================================
# # app = FastAPI(title="AI Hub Engine (Tri-Core)")

# # # Schema for AI #1
# # class PersonaInput(BaseModel):
# #     acc_Remember: Optional[float] = None
# #     time_Remember: Optional[float] = None
# #     acc_Understand: Optional[float] = None
# #     time_Understand: Optional[float] = None
# #     acc_Apply: Optional[float] = None
# #     time_Apply: Optional[float] = None
# #     acc_Analyze: Optional[float] = None
# #     time_Analyze: Optional[float] = None

# # # Schema for AI #2
# # class MasteryInput(BaseModel):
# #     accuracy_rate: float
# #     difficulty_weighted_score: float
# #     time_efficiency_ratio: float
# #     cognitive_dropoff: float
# #     consistency_index: float
# #     days_since_last_active: float
# #     streak: int

# # # Schema for AI #3
# # class ExamInput(BaseModel):
# #     weighted_mastery: float
# #     syllabus_completion: float
# #     mock_test_score: Optional[float] = None
# #     consistency_score: float
# #     exam_anxiety_factor: float

# # # ==============================================================================
# # # 5. API ENDPOINTS
# # # ==============================================================================

# # @app.get("/")
# # def health_check():
# #     return {
# #         "status": "Tri-Core Engine Running",
# #         "models_status": {k: (v is not None) for k, v in models.items()}
# #     }

# # # --- Endpoint 1: Predict Persona ---
# # @app.post("/predict-persona")
# # def predict_persona(stats: PersonaInput):
# #     if not models['profiler']: raise HTTPException(503, "Profiler AI not loaded")
# #     try:
# #         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
# #         df = pd.DataFrame([data])
# #         prediction = models['profiler'].predict(df)[0]
# #         return {"persona": prediction}
# #     except Exception as e:
# #         raise HTTPException(500, str(e))

# # # --- Endpoint 2: Predict Mastery Score ---
# # @app.post("/predict-mastery")
# # def predict_mastery(stats: MasteryInput):
# #     if not models['mastery']: raise HTTPException(503, "Mastery AI not loaded")
# #     try:
# #         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
# #         df = pd.DataFrame([data])
# #         # AI #2 is a raw XGBoost model, not a pipeline class
# #         prediction = models['mastery'].predict(df)[0]
# #         return {"mastery_score": float(prediction)}
# #     except Exception as e:
# #         raise HTTPException(500, str(e))

# # # --- Endpoint 3: Predict Exam Score ---
# # @app.post("/predict-exam")
# # def predict_exam(stats: ExamInput):
# #     if not models['exam']: raise HTTPException(503, "Exam AI not loaded")
# #     try:
# #         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
# #         df = pd.DataFrame([data])
# #         prediction = models['exam'].predict(df)[0]
# #         return {"predicted_board_score": float(prediction)}
# #     except Exception as e:
# #         raise HTTPException(500, str(e))

# # if __name__ == "__main__":
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8000)




# import os
# import sys
# import joblib
# import pandas as pd
# import numpy as np
# import xgboost as xgb
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import Optional

# # ==============================================================================
# # 1. CLASS DEFINITIONS (MUST MATCH TRAINING SCRIPTS EXACTLY)
# # ==============================================================================

# # --- AI #1: Cognitive Profiler Class ---
# class CognitiveProfilerPipeline:
#     def __init__(self, model=None):
#         self.model = model
#         self.levels = ['Remember', 'Understand', 'Apply', 'Analyze']
#         self.defaults = {}
#         for level in self.levels:
#             self.defaults[f'acc_{level}'] = 0.5
#             self.defaults[f'time_{level}'] = 1.0

#     def preprocess(self, input_df):
#         df = input_df.copy()
#         for col, val in self.defaults.items():
#             if col not in df.columns:
#                 df[col] = val
#             else:
#                 df[col] = df[col].fillna(val)
#         time_cols = [c for c in df.columns if 'time_' in c]
#         for col in time_cols:
#             df[col] = df[col].clip(lower=0.1, upper=4.0)
        
#         if hasattr(self.model, "feature_names_in_"):
#             df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
#         return df

#     def predict(self, X):
#         X_clean = self.preprocess(X)
#         return self.model.predict(X_clean)

# # --- AI #3: Exam Projector Class ---
# class ExamProjectorPipeline:
#     def __init__(self, model=None):
#         self.model = model
#         self.bounds = {
#             'weighted_mastery': (0.0, 100.0),
#             'syllabus_completion': (0.0, 1.0),
#             'mock_test_score': (0.0, 100.0),
#             'consistency_score': (0.0, 1.0),
#             'exam_anxiety_factor': (0.0, 2.0)
#         }
#         self.defaults = {
#             'syllabus_completion': 0.01,
#             'mock_test_score': 30.0,
#             'consistency_score': 0.5,
#             'exam_anxiety_factor': 1.0,
#             'weighted_mastery': 0.0
#         }

#     def preprocess(self, input_df):
#         df = input_df.copy()
#         for col, val in self.defaults.items():
#             if col not in df.columns:
#                 df[col] = val
#             else:
#                 df[col] = df[col].fillna(val)
#         for col, (min_val, max_val) in self.bounds.items():
#             if col in df.columns:
#                 df[col] = df[col].clip(lower=min_val, upper=max_val)
#         if hasattr(self.model, "feature_names_in_"):
#              df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
#         return df

#     def predict(self, X):
#         X_clean = self.preprocess(X)
#         preds = self.model.predict(X_clean)
#         return np.clip(preds, 0.0, 100.0)

# # --- AI #4: Burnout Watchdog Class (NEW) ---
# class BurnoutWatchdogPipeline:
#     def __init__(self, model=None, threshold=0.75):
#         self.model = model
#         self.threshold = threshold
#         self.defaults = {
#             'session_duration_mins': 0.0,
#             'recent_accuracy': 1.0,
#             'avg_time_per_question': 30.0,
#             'streak': 0,
#             'hour_of_day': 12
#         }

#     def preprocess(self, input_df):
#         df = input_df.copy()
#         for col, val in self.defaults.items():
#             if col not in df.columns:
#                 df[col] = val
#             else:
#                 df[col] = df[col].fillna(val)
#         df['session_duration_mins'] = df['session_duration_mins'].clip(upper=300)
#         # Feature Engineering: Strain Index
#         if 'strain_index' not in df.columns:
#             hours_worked = df['session_duration_mins'] / 60.0
#             failure_stress = (1.0 - df['recent_accuracy']) * 2.5
#             df['strain_index'] = hours_worked + failure_stress
#         return df

#     def fit(self, X, y):
#         X_clean = self.preprocess(X)
#         self.model.fit(X_clean, y)

#     def predict(self, X):
#         X_clean = self.preprocess(X)
#         # Use probability threshold for high-precision burnout detection
#         probs = self.model.predict_proba(X_clean)[:, 1]
#         return (probs > self.threshold).astype(int)

# # ==============================================================================
# # 2. NAMESPACE FIXES (CRITICAL FOR PICKLE LOADING)
# # ==============================================================================
# sys.modules['__main__'].CognitiveProfilerPipeline = CognitiveProfilerPipeline
# sys.modules['__main__'].ExamProjectorPipeline = ExamProjectorPipeline
# sys.modules['__main__'].BurnoutWatchdogPipeline = BurnoutWatchdogPipeline

# # ==============================================================================
# # 3. LOAD ALL 4 MODELS
# # ==============================================================================
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# PROFILER_PATH = os.path.join(BASE_DIR, "cognitive_profiler_pipeline_v1.pkl")
# MASTERY_PATH = os.path.join(BASE_DIR, "student_mastery_v1.pkl")
# EXAM_PATH = os.path.join(BASE_DIR, "exam_projector_pipeline_v1.pkl")
# BURNOUT_PATH = os.path.join(BASE_DIR, "burnout_watchdog_pipeline_v2.pkl")

# models = {}

# def load_model(path, key, name):
#     try:
#         if os.path.exists(path):
#             models[key] = joblib.load(path)
#             print(f"✅ {name} Loaded Successfully")
#         else:
#             print(f"⚠️ {name} File Missing: {path}")
#             models[key] = None
#     except Exception as e:
#         print(f"❌ {name} Load Failed: {e}")
#         models[key] = None

# print("--- STARTING QUAD-CORE AI ENGINE ---")
# load_model(PROFILER_PATH, 'profiler', "AI #1 (Cognitive Profiler)")
# load_model(MASTERY_PATH, 'mastery', "AI #2 (Student Mastery)")
# load_model(EXAM_PATH, 'exam', "AI #3 (Exam Projector)")
# load_model(BURNOUT_PATH, 'burnout', "AI #4 (Burnout Watchdog)")

# # ==============================================================================
# # 4. FASTAPI APP & INPUT SCHEMAS
# # ==============================================================================
# app = FastAPI(title="AI Hub Engine (Quad-Core)")

# class PersonaInput(BaseModel):
#     acc_Remember: Optional[float] = None
#     time_Remember: Optional[float] = None
#     acc_Understand: Optional[float] = None
#     time_Understand: Optional[float] = None
#     acc_Apply: Optional[float] = None
#     time_Apply: Optional[float] = None
#     acc_Analyze: Optional[float] = None
#     time_Analyze: Optional[float] = None

# class MasteryInput(BaseModel):
#     accuracy_rate: float
#     difficulty_weighted_score: float
#     time_efficiency_ratio: float
#     cognitive_dropoff: float
#     consistency_index: float
#     days_since_last_active: float
#     streak: int

# class ExamInput(BaseModel):
#     weighted_mastery: float
#     syllabus_completion: float
#     mock_test_score: Optional[float] = None
#     consistency_score: float
#     exam_anxiety_factor: float

# class BurnoutInput(BaseModel):
#     session_duration_mins: float
#     recent_accuracy: float
#     avg_time_per_question: float
#     hour_of_day: int
#     streak: int

# # ==============================================================================
# # 5. API ENDPOINTS
# # ==============================================================================

# @app.get("/")
# def health_check():
#     return {
#         "status": "Quad-Core Engine Running",
#         "models_status": {k: (v is not None) for k, v in models.items()}
#     }

# @app.post("/predict-persona")
# def predict_persona(stats: PersonaInput):
#     if not models['profiler']: raise HTTPException(503, "Profiler AI not loaded")
#     try:
#         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
#         df = pd.DataFrame([data])
#         prediction = models['profiler'].predict(df)[0]
#         return {"persona": prediction}
#     except Exception as e:
#         raise HTTPException(500, str(e))

# @app.post("/predict-mastery")
# def predict_mastery(stats: MasteryInput):
#     if not models['mastery']: raise HTTPException(503, "Mastery AI not loaded")
#     try:
#         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
#         df = pd.DataFrame([data])
#         prediction = models['mastery'].predict(df)[0]
#         return {"mastery_score": float(prediction)}
#     except Exception as e:
#         raise HTTPException(500, str(e))

# @app.post("/predict-exam")
# def predict_exam(stats: ExamInput):
#     if not models['exam']: raise HTTPException(503, "Exam AI not loaded")
#     try:
#         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
#         df = pd.DataFrame([data])
#         prediction = models['exam'].predict(df)[0]
#         return {"predicted_board_score": float(prediction)}
#     except Exception as e:
#         raise HTTPException(500, str(e))

# @app.post("/predict-burnout")
# def predict_burnout(stats: BurnoutInput):
#     """ AI #4: Detects student fatigue and burnout probability """
#     if not models['burnout']: raise HTTPException(503, "Burnout Watchdog not loaded")
#     try:
#         data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
#         df = pd.DataFrame([data])
#         is_burned_out = int(models['burnout'].predict(df)[0])
        
#         # Calculate raw probability for stress visualization
#         preprocessed_df = models['burnout'].preprocess(df)
#         stress_level = float(models['burnout'].model.predict_proba(preprocessed_df)[:, 1][0])
        
#         return {
#             "is_burned_out": is_burned_out,
#             "stress_level": stress_level
#         }
#     except Exception as e:
#         raise HTTPException(500, str(e))

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)






import os
import sys
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

# ==============================================================================
# 1. CLASS DEFINITIONS (MUST MATCH TRAINING SCRIPTS EXACTLY)
# ==============================================================================

# --- AI #1: Cognitive Profiler Class ---
class CognitiveProfilerPipeline:
    def __init__(self, model=None):
        self.model = model
        self.levels = ['Remember', 'Understand', 'Apply', 'Analyze']
        self.defaults = {}
        for level in self.levels:
            self.defaults[f'acc_{level}'] = 0.5
            self.defaults[f'time_{level}'] = 1.0

    def preprocess(self, input_df):
        df = input_df.copy()
        for col, val in self.defaults.items():
            if col not in df.columns:
                df[col] = val
            else:
                df[col] = df[col].fillna(val)
        time_cols = [c for c in df.columns if 'time_' in c]
        for col in time_cols:
            df[col] = df[col].clip(lower=0.1, upper=4.0)
        
        if hasattr(self.model, "feature_names_in_"):
            df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
        return df

    def predict(self, X):
        X_clean = self.preprocess(X)
        return self.model.predict(X_clean)

# --- AI #3: Exam Projector Class ---
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
        for col, val in self.defaults.items():
            if col not in df.columns:
                df[col] = val
            else:
                df[col] = df[col].fillna(val)
        for col, (min_val, max_val) in self.bounds.items():
            if col in df.columns:
                df[col] = df[col].clip(lower=min_val, upper=max_val)
        if hasattr(self.model, "feature_names_in_"):
             df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
        return df

    def predict(self, X):
        X_clean = self.preprocess(X)
        preds = self.model.predict(X_clean)
        return np.clip(preds, 0.0, 100.0)

# --- AI #4: Burnout Watchdog Class ---
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
            if col not in df.columns:
                df[col] = val
            else:
                df[col] = df[col].fillna(val)
        df['session_duration_mins'] = df['session_duration_mins'].clip(upper=300)
        # Feature Engineering: Strain Index
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

# --- AI #5: Question Recommender Class (NEW) ---
class RecommenderPipeline:
    def __init__(self, model=None):
        self.model = model
        self.bounds = {
            'user_mastery': (0.0, 100.0),
            'topic_memory_strength': (0.0, 1.0),
            'question_difficulty': (1, 3),
            'days_since_attempt': (0, 365),
            'exam_weightage': (0, 20),
            'prerequisite_strength': (0.0, 100.0)
        }
        self.defaults = {
            'user_mastery': 50.0,
            'topic_memory_strength': 0.0,
            'days_since_attempt': 999,
            'prerequisite_strength': 100.0,
            'is_part_of_streak': 0
        }

    def preprocess(self, input_df):
        df = input_df.copy()
        # 1. Fill Missing
        for col, default_val in self.defaults.items():
            if col in df.columns:
                df[col] = df[col].fillna(default_val)
            else:
                df[col] = default_val
        
        # 2. Safety Clamping
        for col, (min_val, max_val) in self.bounds.items():
            if col in df.columns:
                df[col] = df[col].clip(lower=min_val, upper=max_val)

        # 3. Feature Engineering
        if 'user_mastery' in df.columns and 'question_difficulty' in df.columns:
            normalized_skill = 1 + (df['user_mastery'] / 50.0)
            df['skill_diff_gap'] = (df['question_difficulty'] - normalized_skill).abs()
        
        # 4. Alignment
        if hasattr(self.model, "feature_names_in_"):
            df = df.reindex(columns=self.model.feature_names_in_, fill_value=0)
        return df

    def predict(self, X):
        X_clean = self.preprocess(X)
        return self.model.predict(X_clean)

# ==============================================================================
# 2. NAMESPACE FIXES (CRITICAL FOR PICKLE LOADING)
# ==============================================================================
sys.modules['__main__'].CognitiveProfilerPipeline = CognitiveProfilerPipeline
sys.modules['__main__'].ExamProjectorPipeline = ExamProjectorPipeline
sys.modules['__main__'].BurnoutWatchdogPipeline = BurnoutWatchdogPipeline
sys.modules['__main__'].RecommenderPipeline = RecommenderPipeline # <--- AI #5

# ==============================================================================
# 3. LOAD ALL 5 MODELS
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILER_PATH = os.path.join(BASE_DIR, "cognitive_profiler_pipeline_v1.pkl")
MASTERY_PATH = os.path.join(BASE_DIR, "student_mastery_v1.pkl")
EXAM_PATH = os.path.join(BASE_DIR, "exam_projector_pipeline_v1.pkl")
BURNOUT_PATH = os.path.join(BASE_DIR, "burnout_watchdog_pipeline_v2.pkl")
RECOMMENDER_PATH = os.path.join(BASE_DIR, "recommender_pipeline_v1.pkl")

models = {}

def load_model(path, key, name):
    try:
        if os.path.exists(path):
            models[key] = joblib.load(path)
            print(f"✅ {name} Loaded Successfully")
        else:
            print(f"⚠️ {name} File Missing: {path}")
            models[key] = None
    except Exception as e:
        print(f"❌ {name} Load Failed: {e}")
        models[key] = None

print("--- STARTING PENTA-CORE AI ENGINE ---")
load_model(PROFILER_PATH, 'profiler', "AI #1 (Cognitive Profiler)")
load_model(MASTERY_PATH, 'mastery', "AI #2 (Student Mastery)")
load_model(EXAM_PATH, 'exam', "AI #3 (Exam Projector)")
load_model(BURNOUT_PATH, 'burnout', "AI #4 (Burnout Watchdog)")
load_model(RECOMMENDER_PATH, 'recommender', "AI #5 (Question Recommender)")

# ==============================================================================
# 4. FASTAPI APP & INPUT SCHEMAS
# ==============================================================================
app = FastAPI(title="AI Hub Engine (Penta-Core)")

# Schema AI #1
class PersonaInput(BaseModel):
    acc_Remember: Optional[float] = None
    time_Remember: Optional[float] = None
    acc_Understand: Optional[float] = None
    time_Understand: Optional[float] = None
    acc_Apply: Optional[float] = None
    time_Apply: Optional[float] = None
    acc_Analyze: Optional[float] = None
    time_Analyze: Optional[float] = None

# Schema AI #2
class MasteryInput(BaseModel):
    accuracy_rate: float
    difficulty_weighted_score: float
    time_efficiency_ratio: float
    cognitive_dropoff: float
    consistency_index: float
    days_since_last_active: float
    streak: int

# Schema AI #3
class ExamInput(BaseModel):
    weighted_mastery: float
    syllabus_completion: float
    mock_test_score: Optional[float] = None
    consistency_score: float
    exam_anxiety_factor: float

# Schema AI #4
class BurnoutInput(BaseModel):
    session_duration_mins: float
    recent_accuracy: float
    avg_time_per_question: float
    hour_of_day: int
    streak: int

# Schema AI #5
class CandidateQuestion(BaseModel):
    question_id: str
    difficulty: int
    exam_weightage: int
    days_since_attempt: Optional[float] = 999.0
    topic_memory_strength: Optional[float] = 0.0

class RecommenderInput(BaseModel):
    user_mastery: float
    prerequisite_strength: Optional[float] = 100.0
    candidates: List[CandidateQuestion]

# ==============================================================================
# 5. API ENDPOINTS
# ==============================================================================

@app.get("/")
def health_check():
    return {
        "status": "Penta-Core Engine Running",
        "models_status": {k: (v is not None) for k, v in models.items()}
    }

# --- AI #1: Persona ---
@app.post("/predict-persona")
def predict_persona(stats: PersonaInput):
    if not models['profiler']: raise HTTPException(503, "Profiler AI not loaded")
    try:
        data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
        df = pd.DataFrame([data])
        prediction = models['profiler'].predict(df)[0]
        return {"persona": prediction}
    except Exception as e:
        raise HTTPException(500, str(e))

# --- AI #2: Mastery ---
@app.post("/predict-mastery")
def predict_mastery(stats: MasteryInput):
    if not models['mastery']: raise HTTPException(503, "Mastery AI not loaded")
    try:
        data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
        df = pd.DataFrame([data])
        prediction = models['mastery'].predict(df)[0]
        return {"mastery_score": float(prediction)}
    except Exception as e:
        raise HTTPException(500, str(e))

# --- AI #3: Exam Projector ---
@app.post("/predict-exam")
def predict_exam(stats: ExamInput):
    if not models['exam']: raise HTTPException(503, "Exam AI not loaded")
    try:
        data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
        df = pd.DataFrame([data])
        prediction = models['exam'].predict(df)[0]
        return {"predicted_board_score": float(prediction)}
    except Exception as e:
        raise HTTPException(500, str(e))

# --- AI #4: Burnout Watchdog ---
@app.post("/predict-burnout")
def predict_burnout(stats: BurnoutInput):
    if not models['burnout']: raise HTTPException(503, "Burnout Watchdog not loaded")
    try:
        data = stats.model_dump() if hasattr(stats, 'model_dump') else stats.dict()
        df = pd.DataFrame([data])
        is_burned_out = int(models['burnout'].predict(df)[0])
        
        preprocessed_df = models['burnout'].preprocess(df)
        stress_level = float(models['burnout'].model.predict_proba(preprocessed_df)[:, 1][0])
        
        return {
            "is_burned_out": is_burned_out,
            "stress_level": stress_level
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# --- AI #5: Question Recommender (NEW) ---
@app.post("/recommend-questions")
def recommend_questions(payload: RecommenderInput):
    if not models['recommender']: raise HTTPException(503, "Recommender AI not loaded")
    
    try:
        candidates_data = [c.dict() for c in payload.candidates]
        df = pd.DataFrame(candidates_data)
        
        # Broadcast Context Features
        df['user_mastery'] = payload.user_mastery
        df['prerequisite_strength'] = payload.prerequisite_strength
        df.rename(columns={'difficulty': 'question_difficulty'}, inplace=True)

        # Ranking
        scores = models['recommender'].predict(df)
        
        results = []
        for i, score in enumerate(scores):
            results.append({
                "question_id": candidates_data[i]['question_id'],
                "relevance_score": float(score)
            })
        
        # Sort by relevance (Descending)
        sorted_results = sorted(results, key=lambda x: x['relevance_score'], reverse=True)
        
        return {"ranked_questions": sorted_results}

    except Exception as e:
        raise HTTPException(500, f"Recommendation Failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)