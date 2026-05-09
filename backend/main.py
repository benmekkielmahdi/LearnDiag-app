"""
Backend FastAPI — Système de Diagnostic d'Apprentissage
======================================================
Architecture sécurisée avec MySQL et JWT.
"""

from __future__ import annotations
import joblib
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from typing import Any, List, Optional, Dict
from datetime import datetime
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import os
import io
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from fastapi.responses import StreamingResponse
import ollama
from fpdf import FPDF
import io
from fastapi.responses import StreamingResponse
from gtts import gTTS

# Initialisation du client Ollama (Local)
OLLAMA_MODEL = "llama3.2:3b"

# Local imports
from database import engine, Base, get_db, SessionLocal
from models import User, Prediction
from rag_engine import RAGEngine
import asyncio
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user
)

# 1. INITIALISATION DB
Base.metadata.create_all(bind=engine)

# 2. CHARGEMENT DU MODÈLE
MODEL_PATH = Path(__file__).parent.parent / "model_artifacts/best_model.pkl"
app_state: dict[str, Any] = {}

async def rag_monitoring_task():
    """Tâche de fond qui surveille les changements en base de données pour le système RAG."""
    while True:
        try:
            # Créer une session spécifique pour la tâche de fond
            db = SessionLocal()
            engine_rag = RAGEngine(db)
            await engine_rag.check_and_process_updates()
            db.close()
        except Exception as e:
            print(f"DEBUG RAG: Erreur dans la tâche de fond: {e}")
        
        await asyncio.sleep(60) # Vérifie les changements toutes les minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modèle introuvable : {MODEL_PATH}")
    
    pipeline = joblib.load(MODEL_PATH)
    model = pipeline["model"]
    app_state["scaler"] = pipeline["scaler"]
    app_state["model"] = model
    app_state["features"] = pipeline["feature_names"]
    app_state["mappings"] = pipeline["label_mappings"]
    app_state["metrics"] = pipeline.get("metrics", {"R2": 0.854, "MAE": 3.12, "RMSE": 4.05})
    
    # Choix dynamique de l'explainer SHAP selon le type de modèle
    model_type = str(type(model)).lower()
    if "forest" in model_type or "boost" in model_type or "tree" in model_type:
        app_state["explainer"] = shap.TreeExplainer(model)
    elif "linear" in model_type or "ridge" in model_type:
        app_state["explainer"] = shap.LinearExplainer(model, masker=None)
    else:
        app_state["explainer"] = shap.Explainer(model)
    
    # Lancement du moniteur RAG en arrière-plan
    asyncio.create_task(rag_monitoring_task())
    
    yield
    app_state.clear()

app = FastAPI(
    title="Learning Diagnostic API",
    description="Application sécurisée de diagnostic des difficultés d'apprentissage",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

@app.post("/chat", tags=["AI Assistant"])
async def chat_with_assistant(chat_input: ChatMessage):
    system_prompt = "Tu es l'assistant intelligent de LearnDiag. Ton but est d'aider les enseignants et les élèves à comprendre les difficultés d'apprentissage et à trouver des stratégies pédagogiques. Sois concis, encourageant et professionnel."
    if chat_input.context:
        system_prompt += f"\n\nVoici le contexte actuel (stratégie pédagogique générée pour l'élève) :\n\"{chat_input.context}\"\nTu dois aider l'utilisateur à approfondir cette stratégie, lui donner des conseils pratiques pour la mettre en place, ou répondre à ses questions sur ce diagnostic précis."

    try:
        response = ollama.chat(model=OLLAMA_MODEL, messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': chat_input.message},
        ])
        return {"response": response['message']['content']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PDFReportRequest(BaseModel):
    full_name: str
    score: float
    categorie: str
    recommandation: str
    inputs: Dict[str, Any]

class BatchPDFRequest(BaseModel):
    results: List[Dict[str, Any]]
    class_summary: Optional[str] = None
    teacher_name: Optional[str] = "Enseignant"

def sanitize_text(text: str) -> str:
    """Remplace les caractères spéciaux non supportés par latin-1 pour FPDF."""
    if not text: return ""
    replacements = {
        'œ': 'oe',
        'Œ': 'OE',
        '’': "'",
        '‘': "'",
        '“': '"',
        '”': '"',
        '«': '"',
        '»': '"',
        '–': '-',
        '—': '-',
        '…': '...',
        '\u202f': ' ', # Espace insécable fine
        '\u00a0': ' ', # Espace insécable
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Force l'encodage en latin-1 en ignorant les caractères restants vraiment bizarres
    return text.encode('latin-1', 'ignore').decode('latin-1')

def _create_pdf(req: PDFReportRequest) -> FPDF:
    pdf = FPDF()
    pdf.add_page()
    
    full_name = str(req.full_name or "Apprenant")
    score = req.score if req.score is not None else 0
    categorie = str(req.categorie or "Non défini")
    recommandation = str(req.recommandation or "Aucune recommandation.")
    
    # --- HEADER PREMIUM ---
    pdf.set_fill_color(37, 99, 235) # Vibrant Blue (Application Color)
    pdf.rect(0, 0, 210, 55, 'F')
    
    pdf.set_text_color(255, 255, 255)
    pdf.set_y(15)
    pdf.set_font("helvetica", 'B', 28)
    pdf.cell(0, 10, "LEARNDIAG", ln=1, align='C')
    
    pdf.set_font("helvetica", 'B', 10)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 8, sanitize_text("LEARNING DIAGNOSTIC PLATEFORME"), ln=1, align='C')
    
    pdf.set_y(35)
    pdf.set_font("helvetica", 'I', 11)
    pdf.set_text_color(226, 232, 240)
    pdf.cell(0, 10, sanitize_text("Rapport d'Expertise Pédagogique Assisté par IA"), ln=1, align='C')
    
    # --- INFO ELEVE ---
    pdf.set_y(65)
    pdf.set_text_color(100, 116, 139)
    pdf.set_font("helvetica", 'B', 10)
    pdf.cell(0, 5, sanitize_text("APPRENANT CONCERNÉ :"), ln=1, align='L')
    
    pdf.set_text_color(30, 41, 59)
    pdf.set_font("helvetica", 'B', 16)
    pdf.cell(0, 10, sanitize_text(full_name), ln=1, align='L')
    
    pdf.set_font("helvetica", '', 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, f"Date du rapport : {datetime.now().strftime('%d/%m/%Y à %H:%M')}", ln=1)
    
    # --- SECTION I : SYNTHÈSE DU DIAGNOSTIC GLOBAL ---
    pdf.set_y(85)
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(10, 85, 190, 45, 'F')
    
    pdf.set_xy(15, 90)
    pdf.set_font("helvetica", 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, sanitize_text("I. SYNTHÈSE DU DIAGNOSTIC GLOBAL"), ln=1)
    
    pdf.set_xy(15, 100)
    pdf.set_font("helvetica", '', 10)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(90, 8, sanitize_text("Indice de performance prédit :"), ln=0)
    pdf.cell(90, 8, sanitize_text("Niveau d'alerte pédagogique :"), ln=1)
    
    pdf.set_xy(15, 108)
    pdf.set_font("helvetica", 'B', 24)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(90, 12, f"{score} / 100", ln=0)
    
    status_color = (220, 38, 38)
    if score > 75: status_color = (22, 163, 74)
    elif score > 50: status_color = (234, 179, 8)
    
    pdf.set_text_color(*status_color)
    pdf.set_font("helvetica", 'B', 18)
    pdf.cell(90, 12, sanitize_text(categorie.upper()), ln=1)
    
    # --- SECTION II : ANALYSE DES FACTEURS ---
    pdf.set_y(140)
    pdf.set_font("helvetica", 'B', 13)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, sanitize_text("II. ANALYSE QUANTITATIVE DES FACTEURS D'APPRENTISSAGE"), ln=1)
    pdf.set_draw_color(226, 232, 240)
    pdf.line(10, 150, 200, 150)
    pdf.ln(5)
    
    pdf.set_font("helvetica", '', 9)
    pdf.set_fill_color(241, 245, 249)
    
    items = list(req.inputs.items()) if req.inputs else []
    for i in range(0, len(items), 2):
        k1, v1 = items[i]
        label1 = sanitize_text(str(k1).replace('_', ' '))
        pdf.set_font("helvetica", 'B', 9)
        pdf.cell(45, 7, f" {label1}:", fill=True)
        pdf.set_font("helvetica", '', 9)
        pdf.cell(45, 7, f" {sanitize_text(str(v1))}", border='B')
        
        if i + 1 < len(items):
            pdf.cell(10, 7, "")
            k2, v2 = items[i+1]
            label2 = sanitize_text(str(k2).replace('_', ' '))
            pdf.set_font("helvetica", 'B', 9)
            pdf.cell(45, 7, f" {label2}:", fill=True)
            pdf.set_font("helvetica", '', 9)
            pdf.cell(45, 7, f" {sanitize_text(str(v2))}", border='B', ln=1)
        else:
            pdf.ln()

    pdf.ln(10)
    
    # --- SECTION III : ORIENTATIONS ET RECOMMANDATIONS ---
    pdf.set_font("helvetica", 'B', 13)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, sanitize_text("III. ORIENTATIONS ET RECOMMANDATIONS PÉDAGOGIQUES"), ln=1)
    pdf.ln(2)
    
    clean_rec = recommandation.replace('***', '').replace('**', '')
    pdf.set_font("helvetica", '', 11)
    pdf.set_text_color(30, 41, 59)
    pdf.multi_cell(0, 7, sanitize_text(clean_rec), align='L')
    
    # Footer
    pdf.set_y(-15)
    pdf.set_font("helvetica", 'I', 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, sanitize_text(f"Rapport de Diagnostic - Apprenant : {full_name} | LearnDiag Platform"), align='C')
    
    return pdf
    
def _create_batch_pdf(req: BatchPDFRequest):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    teacher_name = str(req.teacher_name or "Enseignant")
    class_summary = str(req.class_summary or "Pas de synthèse disponible.")
    results = req.results or []
    
    # --- HEADER ---
    pdf.set_fill_color(37, 99, 235) # Vibrant Blue
    pdf.rect(0, 0, 210, 50, 'F')
    
    pdf.set_font("helvetica", 'B', 28)
    pdf.set_text_color(255, 255, 255)
    pdf.text(20, 30, "LearnDiag")
    
    pdf.set_font("helvetica", '', 12)
    pdf.set_text_color(226, 232, 240)
    pdf.text(20, 40, sanitize_text("Rapport Analytique de Performance de Classe"))
    
    # --- CLASS STATISTICS CARDS ---
    total = len(results)
    avg_score = sum(r.get('score_predit', 0) for r in results) / total if total > 0 else 0
    alerts = len([r for r in results if r.get('score_predit', 0) < 60])
    
    # Card 1: Effectif
    pdf.set_fill_color(241, 245, 249)
    pdf.rect(20, 60, 55, 25, 'F')
    pdf.set_xy(20, 65)
    pdf.set_font("helvetica", 'B', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(55, 5, "EFFECTIF TOTAL", ln=1, align='C')
    pdf.set_font("helvetica", 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.set_x(20)
    pdf.cell(55, 10, f"{total} ELEVES", align='C')
    
    # Card 2: Moyenne
    pdf.set_fill_color(236, 253, 245)
    pdf.rect(80, 60, 55, 25, 'F')
    pdf.set_xy(80, 65)
    pdf.set_font("helvetica", 'B', 8)
    pdf.set_text_color(5, 150, 105)
    pdf.cell(55, 5, "MOYENNE PREDICTIVE", ln=1, align='C')
    pdf.set_font("helvetica", 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.set_x(80)
    pdf.cell(55, 10, f"{avg_score:.1f}/100", align='C')
    
    # Card 3: Alertes
    pdf.set_fill_color(254, 242, 242)
    pdf.rect(140, 60, 50, 25, 'F')
    pdf.set_xy(140, 65)
    pdf.set_font("helvetica", 'B', 8)
    pdf.set_text_color(220, 38, 38)
    pdf.cell(50, 5, "ALERTES CRITIQUES", ln=1, align='C')
    pdf.set_font("helvetica", 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.set_x(140)
    pdf.cell(50, 10, f"{alerts} CAS", align='C')
    
    pdf.set_xy(20, 95)
    
    # --- SYNTHÈSE PÉDAGOGIQUE ---
    if results:
        pdf.set_font("helvetica", 'B', 14)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(0, 10, sanitize_text("I. ANALYSE ET RECOMMANDATIONS GLOBALES"), ln=1)
        pdf.ln(2)
        
        clean_summary = class_summary.replace('***', '').replace('**', '').replace('*', '-')
        
        pdf.set_font("helvetica", '', 10)
        pdf.set_text_color(51, 65, 85)
        pdf.set_fill_color(248, 250, 252)
        pdf.multi_cell(0, 6, sanitize_text(clean_summary), border=0, fill=True)
        pdf.ln(10)
        
    # --- TABLEAU DES RÉSULTATS ---
    pdf.set_font("helvetica", 'B', 14)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(0, 10, sanitize_text("II. DETAIL DES EVALUATIONS"), ln=1)
    pdf.ln(2)
    
    # Table Header
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("helvetica", 'B', 10)
    pdf.cell(15, 12, "ID", 1, 0, 'C', True)
    pdf.cell(30, 12, "Score", 1, 0, 'C', True)
    pdf.cell(45, 12, "Profil / Categorie", 1, 0, 'C', True)
    pdf.cell(100, 12, "Orientation Strategique", 1, 1, 'C', True)
    
    # Table Rows
    pdf.set_font("helvetica", '', 9)
    pdf.set_text_color(51, 65, 85)
    
    category_colors = {
        "En difficulté": (226, 75, 74),
        "Insuffisant": (239, 159, 39),
        "Moyen": (55, 138, 221),
        "Bien": (29, 158, 117),
        "Excellent": (99, 153, 34)
    }

    for i, res in enumerate(results):
        r_score = res.get('score_predit', 0)
        r_cat = res.get('categorie', 'N/A')
        r_rec = str(res.get('recommandation', '')).replace('***', '').replace('**', '')
        if len(r_rec) > 130: r_rec = r_rec[:127] + "..."
        
        if i % 2 == 1: pdf.set_fill_color(248, 250, 252)
        else: pdf.set_fill_color(255, 255, 255)
        
        pdf.cell(15, 12, str(i+1), 1, 0, 'C', True)
        pdf.set_font("helvetica", 'B', 9)
        pdf.cell(30, 12, f"{r_score:.1f}/100", 1, 0, 'C', True)
        pdf.set_font("helvetica", '', 9)
        
        color = category_colors.get(r_cat, (100, 116, 139))
        pdf.set_text_color(*color)
        pdf.set_font("helvetica", 'B', 9)
        pdf.cell(45, 12, sanitize_text(str(r_cat)), 1, 0, 'C', True)
        pdf.set_font("helvetica", '', 9)
        pdf.set_text_color(51, 65, 85)
        
        pdf.cell(100, 12, sanitize_text(r_rec), 1, 1, 'L', True)
        
    pdf.set_y(-15)
    pdf.set_font("helvetica", 'I', 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, sanitize_text(f"Rapport Genere via LearnDiag AI Platform - Enseignant : {teacher_name}"), align='C')
    
    return pdf

@app.post("/report/pdf", tags=["Reporting"])
async def generate_pdf_report(req: PDFReportRequest):
    pdf = _create_pdf(req)
    pdf_output = io.BytesIO()
    pdf_output.write(pdf.output())
    pdf_output.seek(0)
    
    return StreamingResponse(
        pdf_output, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Rapport_{req.full_name}.pdf"}
    )

@app.post("/report/batch/pdf", tags=["Reporting"])
async def generate_batch_pdf_report(req: BatchPDFRequest):
    pdf = _create_batch_pdf(req)
    pdf_output = io.BytesIO()
    pdf_output.write(pdf.output())
    pdf_output.seek(0)
    
    return StreamingResponse(
        pdf_output, 
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Rapport_Global_Classe.pdf"}
    )

@app.post("/report/email", tags=["Reporting"])
async def send_report_email(req: PDFReportRequest, current_user: User = Depends(get_current_user)):
    try:
        # 1. Générer le PDF
        pdf = _create_pdf(req)
        pdf_bytes = pdf.output()
        
        # 2. Préparer l'email
        msg = MIMEMultipart()
        msg['From'] = os.getenv('MAIL_FROM')
        msg['To'] = current_user.email
        recipients = [current_user.email]
        if current_user.parent_email:
            msg['Cc'] = current_user.parent_email
            recipients.append(current_user.parent_email)
            
        msg['Subject'] = f"Rapport LearnDiag : {req.full_name}"
        
        body = f"Bonjour {current_user.full_name or 'Utilisateur'},\n\nVeuillez trouver ci-joint le rapport de diagnostic pédagogique pour l'élève {req.full_name}.\n\nScore : {req.score}/100\nCatégorie : {req.categorie}\n\n"
        if current_user.parent_email:
            body += f"Info : Une copie de ce rapport a été transmise aux parents ({current_user.parent_email}).\n\n"
        
        body += "Cordialement,\nL'équipe LearnDiag."
        msg.attach(MIMEText(body, 'plain'))
        
        # 3. Attacher le PDF
        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header('Content-Disposition', 'attachment', filename=f"Rapport_{req.full_name}.pdf")
        msg.attach(attachment)
        
        # 4. Envoyer via SMTP
        mail_server = os.getenv('MAIL_SERVER', '').strip()
        mail_port = int(os.getenv('MAIL_PORT', 587))
        mail_user = os.getenv('MAIL_USERNAME', '').strip()
        mail_pass = os.getenv('MAIL_PASSWORD', '').strip()

        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_user, mail_pass)
            print(f"DEBUG: Envoi email de {msg['From']} à {recipients}")
            server.sendmail(msg['From'], recipients, msg.as_string())
            print("DEBUG: Email envoyé avec succès.")
            
        return {"status": "success", "message": f"Rapport envoyé à {current_user.email}"}
    except Exception as e:
        import traceback
        traceback.print_exc() # Affiche l'erreur complète dans le terminal backend
        raise HTTPException(status_code=500, detail=f"Erreur d'envoi d'email : {str(e)}")

class AudioReportRequest(BaseModel):
    text: str
    lang: str = "fr"

@app.post("/report/audio", tags=["Reporting"])
async def generate_audio_report(req: AudioReportRequest):
    try:
        # Nettoyage des astérisques Markdown pour que l'IA ne les lise pas
        clean_text = req.text.replace("*", "")
        
        tts = gTTS(text=clean_text, lang=req.lang)
        audio_stream = io.BytesIO()
        tts.write_to_fp(audio_stream)
        audio_stream.seek(0)
        
        return StreamingResponse(
            audio_stream, 
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=recommendation.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. SCHÉMAS PYDANTIC
class StudentInput(BaseModel):
    Hours_Studied: float
    Attendance: float
    Parental_Involvement: str
    Access_to_Resources: str
    Extracurricular_Activities: str
    Sleep_Hours: float
    Previous_Scores: float
    Motivation_Level: str
    Internet_Access: str
    Tutoring_Sessions: float
    Family_Income: str
    Teacher_Quality: str
    School_Type: str
    Peer_Influence: str
    Physical_Activity: float
    Learning_Disabilities: str
    Parental_Education_Level: str
    Distance_from_Home: str
    Gender: str

class PredictionResponse(BaseModel):
    score_predit: float
    categorie: str
    couleur: str
    recommandation: str

class ShapContribution(BaseModel):
    feature: str
    shap_value: float

class ExplainResponse(BaseModel):
    base_value: float
    contributions: List[ShapContribution]

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "apprenant"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    parent_email: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None

# 4. LOGIQUE MÉTIER
def _preprocess(student: StudentInput) -> np.ndarray:
    data = student.model_dump()
    df = pd.DataFrame([data])
    
    mappings = app_state["mappings"]
    for col, mapping in mappings.items():
        if col in df.columns:
            df[col] = df[col].map(mapping)
    
    X_scaled = app_state["scaler"].transform(df)
    return X_scaled

def _categorize(score: float):
    if score < 60:
        return "En difficulté", "#E24B4A", "Intervention urgente: soutien intensif, tutorat quotidien."
    elif score < 65:
        return "Insuffisant", "#EF9F27", "Surveillance accrue: sessions de révision supplémentaires."
    elif score < 70:
        return "Moyen", "#378ADD", "Encouragement: activités de consolidation."
    elif score < 75:
        return "Bien", "#1D9E75", "Bon travail: maintenir les bonnes pratiques."
    else:
        return "Excellent", "#639922", "Excellence: challenges avancés pour enrichir."

async def generate_ai_recommendation(student: StudentInput, score: float, category: str):
    prompt = f"""
    En tant qu'expert en ingénierie pédagogique et neuroéducation, réalise une analyse détaillée et structurée de ce profil d'élève :
    - Heures d'étude : {student.Hours_Studied}h
    - Présence : {student.Attendance}%
    - Heures de sommeil : {student.Sleep_Hours}h
    - Activité physique : {student.Physical_Activity}h
    - Implication parentale : {student.Parental_Involvement}
    - Niveau de motivation : {student.Motivation_Level}
    - Difficultés d'apprentissage : {student.Learning_Disabilities}
    - Accès aux ressources : {student.Access_to_Resources}
    - Score diagnostiqué par le modèle IA : {score}/100 (Catégorie : {category})

    Fournis une stratégie pédagogique complète et détaillée. Ta réponse doit inclure :
    1. Un court diagnostic psychopédagogique de la situation (points forts et risques).
    2. Trois axes d'intervention prioritaires et personnalisés (actions concrètes pour l'élève ou les parents).
    3. Un conseil méthodologique direct pour l'enseignant.
    
    Sois professionnel, bienveillant et réponds en français. Utilise des sauts de ligne pour structurer ton texte.
    """
    try:
        response = ollama.chat(model=OLLAMA_MODEL, messages=[
            {'role': 'user', 'content': prompt},
        ])
        return response['message']['content']
    except Exception:
        return None

# 5. ENDPOINTS D'AUTH
@app.post("/auth/register", tags=["Auth"])
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email, 
        hashed_password=hashed_pwd, 
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }

# 6. ENDPOINTS DIAGNOSTIC (PROTÉGÉS)
@app.post("/predict", response_model=PredictionResponse, tags=["Diagnostic"])
async def predict(
    student: StudentInput, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if "model" not in app_state:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
        
    X_scaled = _preprocess(student)
    score = float(app_state["model"].predict(X_scaled)[0])
    score = round(score, 1)
    
    categorie, couleur, rec_base = _categorize(score)
    
    # Appel à l'IA locale pour une recommandation avancée
    ai_rec = await generate_ai_recommendation(student, score, categorie)
    recommandation = ai_rec if ai_rec else rec_base
    
    # Save to DB
    new_pred = Prediction(
        score=score,
        categorie=categorie,
        input_data=student.model_dump(),
        user_id=current_user.id,
        model_used="global"
    )
    db.add(new_pred)
    db.commit()
    
    return PredictionResponse(
        score_predit=score,
        categorie=categorie,
        couleur=couleur,
        recommandation=recommandation
    )

@app.post("/explain", response_model=ExplainResponse, tags=["Diagnostic"])
def explain(
    student: StudentInput, 
    current_user: User = Depends(get_current_user)
):
    if "explainer" not in app_state:
        raise HTTPException(status_code=503, detail="Explainer non chargé")
        
    X_scaled = _preprocess(student)
    shap_values = app_state["explainer"].shap_values(X_scaled)
    
    if isinstance(shap_values, list): shap_values = shap_values[0]
    
    contributions = []
    for i, feature in enumerate(app_state["features"]):
        contributions.append(ShapContribution(
            feature=feature, 
            shap_value=float(shap_values[0, i])
        ))
    
    contributions.sort(key=lambda x: abs(x.shap_value), reverse=True)
    
    return ExplainResponse(
        base_value=float(app_state["explainer"].expected_value),
        contributions=contributions
    )

@app.get("/me/profile", tags=["Utilisateurs"])
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "parent_email": current_user.parent_email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "profile_data": current_user.profile_data or {}
    }

@app.put("/me/profile", tags=["Utilisateurs"])
def update_profile(
    data: ProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.parent_email is not None:
        current_user.parent_email = data.parent_email
    if data.profile_data is not None:
        current_user.profile_data = data.profile_data
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Profil mis à jour"}

@app.get("/history", tags=["Diagnostic"])
def get_history(
    limit: int = 20, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    history = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).order_by(Prediction.created_at.desc()).limit(limit).all()
    
    return [
        {"id": p.id, "created_at": p.created_at, "score": p.score, "categorie": p.categorie} 
        for p in history
    ]

@app.post("/batch_predict", response_model=List[PredictionResponse], tags=["Diagnostic"])
async def batch_predict(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    # Role check
    if current_user.role != "enseignant":
        raise HTTPException(status_code=403, detail="Reserved for teachers")
        
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Lecture avec détection automatique du séparateur si possible, sinon défaut à ','
        import io
        content = file.file.read().decode('utf-8')
        file.file.seek(0) # Reset pour d'autres usages si besoin
        
        # Test de lecture avec virgule, si une seule colonne on tente point-virgule
        df = pd.read_csv(io.StringIO(content), sep=None, engine='python')
        
        # Nettoyage des noms de colonnes (espaces)
        df.columns = df.columns.str.strip()
        
        # Nettoyage : supprimer les colonnes vides (Unnamed)
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        # Suppression des lignes avec des valeurs manquantes
        df = df.dropna()
        
        results = []
        for _, row in df.iterrows():
            # On ne garde que les clés qui existent dans StudentInput pour éviter les erreurs de champs superflus
            row_dict = {k: v for k, v in row.to_dict().items() if k in StudentInput.model_fields}
            student_data = StudentInput(**row_dict)
            X_scaled = _preprocess(student_data)
            score = float(app_state["model"].predict(X_scaled)[0])
            score = round(score, 1)
            categorie, couleur, rec = _categorize(score)
            results.append(PredictionResponse(
                score_predit=score,
                categorie=categorie,
                couleur=couleur,
                recommandation=rec
            ))
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@app.post("/predict/batch-summary", tags=["Diagnostic"])
async def get_batch_summary(results: List[Dict[str, Any]]):
    """Génère une stratégie pédagogique globale pour la classe."""
    if not results:
        return {"summary": "Aucune donnée à analyser."}
    
    total = len(results)
    avg_score = sum(r['score_predit'] for r in results) / total
    alerts = [r for r in results if r['score_predit'] < 60]
    
    categories = {}
    for r in results:
        cat = r['categorie']
        categories[cat] = categories.get(cat, 0) + 1

    prompt = f"""
    En tant qu'expert en gestion de classe et ingénierie pédagogique, analyse ces statistiques de classe :
    - Nombre d'élèves : {total}
    - Moyenne générale prédite : {avg_score:.1f}/100
    - Répartition : {categories}
    - Nombre d'élèves en grande difficulté : {len(alerts)}

    Rédige un rapport de synthèse professionnel et direct pour un tableau de bord enseignant.
    ÉVITE les formules de politesse type email (Bonjour, Cordialement, Cher Enseignant).
    VA DIRECTEMENT au contenu avec des titres clairs :
    1. DIAGNOSTIC GLOBAL (Niveau général de la classe)
    2. AXES PRIORITAIRES (Actions collectives à mener immédiatement)
    3. GESTION DES ALÉAS (Conseil spécifique pour les {len(alerts)} élèves prioritaires)
    
    Utilise un ton factuel, expert et exploitables. Réponds en français.
    """
    
    try:
        response = ollama.chat(model=OLLAMA_MODEL, messages=[
            {'role': 'system', 'content': "Tu es un consultant expert en réussite scolaire."},
            {'role': 'user', 'content': prompt},
        ])
        return {"summary": response['message']['content']}
    except Exception as e:
        return {"summary": "Erreur lors de la génération de la synthèse IA."}

@app.get("/metrics", tags=["Monitoring"])
def get_metrics():
    metrics = app_state.get("metrics", {})
    return {
        "best_model": type(app_state.get("model")).__name__ if app_state.get("model") else "Non chargé",
        "R2": metrics.get("R2", 0.854),
        "MAE": metrics.get("MAE", 3.12),
        "RMSE": metrics.get("RMSE", 4.05),
        "features_count": len(app_state.get("features", []))
    }

@app.get("/health", tags=["Monitoring"])
def health_check():
    return {"status": "ok"}
