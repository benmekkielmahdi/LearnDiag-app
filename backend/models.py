from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    parent_email = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="apprenant")
    profile_data = Column(JSON, nullable=True) # Stocke les 19 variables par défaut
    created_at = Column(DateTime, default=datetime.utcnow)

    # Link to predictions
    predictions = relationship("Prediction", back_populates="owner")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, nullable=False)
    categorie = Column(String(50), nullable=False)
    # Store the 19 variables as JSON
    input_data = Column(JSON, nullable=False)
    model_used = Column(String(50), default="global")
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="predictions")
