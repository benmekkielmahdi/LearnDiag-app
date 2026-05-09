import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

# Load artifact
artifact = joblib.load("model_artifacts/best_model.pkl")
model = artifact["model"]
scaler = artifact["scaler"]

# Load data to evaluate
df = pd.read_csv("StudentPerformanceFactors.csv")
# Basic cleaning as in Projet.py
for col in df.select_dtypes(include=["object"]).columns:
    df[col] = df[col].fillna(df[col].mode()[0])
for col in df.select_dtypes(include=[np.number]).columns:
    df[col] = df[col].fillna(df[col].median())

# Map labels
mappings = artifact["label_mappings"]
for col, mapping in mappings.items():
    if col in df.columns:
        df[col] = df[col].map(mapping)

X = df.drop(columns=["Exam_Score"])
y = df["Exam_Score"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_test_sc = scaler.transform(X_test)

y_pred = model.predict(X_test_sc)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"MODEL_TYPE: {type(model).__name__}")
print(f"R2: {r2:.4f}")
print(f"MAE: {mae:.3f}")
print(f"RMSE: {rmse:.3f}")
