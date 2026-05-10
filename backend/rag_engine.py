import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import User, Prediction
from fpdf import FPDF
from datetime import datetime
import main  # Accessing existing logic
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.application import MIMEApplication
from email import encoders
import os
import io
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("RAG_Engine")
logger.setLevel(logging.INFO)

def sanitize_text(text: str) -> str:
    if not text: return ""
    replacements = {
        'œ': 'oe', 'Œ': 'OE', '’': "'", '‘': "'", '“': '"', '”': '"',
        '«': '"', '»': '"', '–': '-', '—': '-', '…': '...',
        '\u202f': ' ', '\u00a0': ' '
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.encode('latin-1', 'ignore').decode('latin-1')

class RAGEngine:
    def __init__(self, db: Session):
        self.db = db

    async def check_and_process_updates(self):
        """
        Scans all users and checks if their profile_data has changed 
        since their last prediction.
        """
        users = self.db.query(User).all()
        for user in users:
            if not user.profile_data:
                continue

            # Get last prediction
            last_pred = self.db.query(Prediction)\
                .filter(Prediction.user_id == user.id)\
                .order_by(Prediction.created_at.desc())\
                .first()

            needs_update = False
            if not last_pred:
                needs_update = True
            else:
                # Compare current profile_data with input_data of last prediction
                # input_data is stored as JSON in Prediction
                if json.dumps(user.profile_data, sort_keys=True) != json.dumps(last_pred.input_data, sort_keys=True):
                    needs_update = True
                    logger.info(f"Change detected for user {user.email}")

            if needs_update:
                await self.process_user_update(user)

    async def process_user_update(self, user: User):
        """
        Performs the full RAG-enhanced diagnostic.
        """
        logger.info(f"Starting RAG Diagnostic for {user.email}...")
        
        # 1. RETRIEVAL: Get context from history
        history = self.db.query(Prediction)\
            .filter(Prediction.user_id == user.id)\
            .order_by(Prediction.created_at.desc())\
            .limit(3)\
            .all()
        
        history_context = ""
        for p in history:
            history_context += f"- Date: {p.created_at.strftime('%Y-%m-%d')}, Score: {p.score}, Catégorie: {p.categorie}\n"

        # 2. PROCESSING: Run prediction
        try:
            from main import StudentInput, _preprocess, _categorize, app_state, generate_ai_recommendation
            
            # Validation préventive pour éviter de polluer les logs si le profil est incomplet
            required_fields = StudentInput.__annotations__.keys()
            missing = [f for f in required_fields if f not in user.profile_data]
            if missing:
                # logger.debug(f"Profile incomplete for {user.email}, skipping RAG update.")
                return

            student_input = StudentInput(**user.profile_data)
            X_scaled = _preprocess(student_input)
            
            # Use model from main app_state
            score = float(main.app_state["model"].predict(X_scaled)[0])
            score = round(score, 1)
            categorie, couleur, rec_base = _categorize(score)

            # 3. AUGMENTATION & GENERATION (RAG)
            rag_prompt = f"""
            Tu es un expert en pédagogie utilisant un système RAG (Retrieval-Augmented Generation).
            Un changement a été détecté dans les données de l'élève {user.full_name}.
            
            HISTORIQUE DES PRÉDICTIONS PRÉCÉDENTES :
            {history_context if history_context else "Aucun historique disponible."}
            
            NOUVELLES DONNÉES ACTUELLES :
            {json.dumps(user.profile_data, indent=2)}
            
            NOUVEAU SCORE CALCULÉ : {score}/100 ({categorie})
            
            MISSION :
            Analyse l'évolution de l'élève par rapport à son historique.
            Fournis une nouvelle stratégie pédagogique mise à jour en tenant compte de ce changement.
            Réponds en français, de manière structurée et bienveillante.
            """
            
            import ollama
            response = ollama.chat(model=main.OLLAMA_MODEL, messages=[
                {'role': 'user', 'content': rag_prompt},
            ])
            recommandation = response['message']['content']

            # 4. SAVE NEW PREDICTION
            new_pred = Prediction(
                user_id=user.id,
                score=score,
                categorie=categorie,
                input_data=user.profile_data,
                model_used="global_rag"
            )
            self.db.add(new_pred)
            self.db.commit()

            # 5. NOTIFY USER (EMAIL)
            await self.send_automated_report(user, score, categorie, recommandation)
            logger.info(f"RAG Report sent to {user.email}")

        except Exception as e:
            logger.error(f"Error in RAG process for {user.email}: {str(e)}")

    def _create_rag_pdf(self, user: User, score: float, category: str, recommendation: str) -> FPDF:
        pdf = FPDF()
        pdf.add_page()
        
        full_name = str(user.full_name or "Apprenant")
        
        # --- HEADER ---
        pdf.set_fill_color(37, 99, 235) 
        pdf.rect(0, 0, 210, 60, 'F')
        
        pdf.set_font("helvetica", 'B', 32)
        pdf.set_text_color(255, 255, 255)
        pdf.text(20, 30, "LearnDiag AI")
        
        pdf.set_font("helvetica", '', 14)
        pdf.set_text_color(191, 219, 254)
        pdf.text(20, 42, "Diagnostic Automatique RAG (Mise à jour)")
        
        # --- INFOS ---
        pdf.set_y(65)
        pdf.set_text_color(100, 116, 139)
        pdf.set_font("helvetica", 'B', 10)
        pdf.cell(0, 5, sanitize_text("APPRENANT :"), ln=1)
        
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("helvetica", 'B', 16)
        pdf.cell(0, 10, sanitize_text(full_name), ln=1)
        
        # --- SYNTHÈSE ---
        pdf.set_y(90)
        pdf.set_fill_color(248, 250, 252)
        pdf.rect(10, 90, 190, 40, 'F')
        
        pdf.set_xy(15, 95)
        pdf.set_font("helvetica", 'B', 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, sanitize_text("RÉSUMÉ DU DIAGNOSTIC AUTOMATIQUE"), ln=1)
        
        pdf.set_xy(15, 105)
        pdf.set_font("helvetica", 'B', 24)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(90, 12, f"{score} / 100", ln=0)
        
        status_color = (220, 38, 38)
        if score > 75: status_color = (22, 163, 74)
        elif score > 50: status_color = (234, 179, 8)
        
        pdf.set_text_color(*status_color)
        pdf.set_font("helvetica", 'B', 18)
        pdf.cell(90, 12, sanitize_text(category.upper()), ln=1)
        
        # --- RECOMMANDATIONS ---
        pdf.set_y(140)
        pdf.set_font("helvetica", 'B', 13)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 10, sanitize_text("STRATÉGIE PÉDAGOGIQUE MISE À JOUR"), ln=1)
        
        clean_rec = recommendation.replace('***', '').replace('**', '').replace('*', '-')
        pdf.set_font("helvetica", '', 11)
        pdf.set_text_color(30, 41, 59)
        pdf.multi_cell(0, 7, sanitize_text(clean_rec))
        
        # Footer
        pdf.set_y(-15)
        pdf.set_font("helvetica", 'I', 8)
        pdf.set_text_color(148, 163, 184)
        pdf.cell(0, 10, sanitize_text(f"Rapport Automatique LearnDiag RAG - {datetime.now().strftime('%d/%m/%Y')}"), align='C')
        
        return pdf

    async def send_automated_report(self, user: User, score: float, category: str, recommendation: str):
        try:
            # 1. Générer le PDF
            pdf = self._create_rag_pdf(user, score, category, recommendation)
            pdf_bytes = pdf.output()

            # 2. Préparer l'email
            msg = MIMEMultipart()
            msg['From'] = os.getenv("MAIL_FROM")
            msg['To'] = user.email
            recipients = [user.email]
            
            # Ajout du parent en CC si l'email existe
            if user.parent_email:
                msg['Cc'] = user.parent_email
                recipients.append(user.parent_email)
                
            msg['Subject'] = f"Diagnostic LearnDiag a jour : {user.full_name}"

            parent_info = f"\n(Une copie a été transmise aux parents : {user.parent_email})" if user.parent_email else ""
            
            body = f"""Bonjour {user.full_name},

Une modification a été détectée dans vos données de performance. 
Notre système d'IA (RAG) a automatiquement recalculé votre diagnostic en tenant compte de votre historique.

Veuillez trouver ci-joint votre nouveau rapport de diagnostic pédagogique mis à jour.
{parent_info}

Score actuel : {score}/100
Catégorie : {category}

L'équipe LearnDiag
"""
            msg.attach(MIMEText(body, 'plain'))

            # Joindre le PDF
            part = MIMEApplication(pdf_bytes, Name=f"Rapport_RAG_{user.full_name}.pdf")
            part['Content-Disposition'] = f'attachment; filename="Rapport_RAG_{user.full_name}.pdf"'
            msg.attach(part)

            # 3. Envoi via SMTP
            server = smtplib.SMTP(os.getenv("MAIL_SERVER"), int(os.getenv("MAIL_PORT")))
            server.starttls()
            server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
            server.sendmail(os.getenv("MAIL_FROM"), recipients, msg.as_string())
            server.quit()
            logger.info(f"RAG PDF Email sent successfully to {user.email}")

        except Exception as e:
            logger.error(f"Failed to send RAG email: {str(e)}")
