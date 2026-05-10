# Système de Prédiction des Difficultés d'Apprentissage
## Stack : React 18 + FastAPI + XGBoost + SHAP

---

## Structure du projet

```
student-app/
├── backend/
│   ├── main.py                          ← API FastAPI (endpoints + logique ML)
│   ├── requirements.txt                 ← Dépendances Python
│   ├── model_student_performance.pkl    ← Modèle sauvegardé (généré par le notebook)
│   └── predictions.db                   ← Base SQLite (créée automatiquement)
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── predictionService.ts     ← Appels HTTP vers l'API
│       ├── components/
│       │   ├── StudentForm.tsx          ← Formulaire de saisie (react-hook-form)
│       │   └── ResultCard.tsx           ← Affichage score + graphique SHAP
│       ├── pages/
│       │   └── App.tsx                  ← Page principale (orchestration)
│       └── types/
│           └── index.ts                 ← Types TypeScript partagés
│
└── docker-compose.yml                   ← Déploiement containerisé
```

---

## Démarrage rapide (développement local)

### Étape 1 — Générer le modèle depuis le notebook

Dans le notebook Jupyter, exécutez la cellule de sauvegarde :

```python
import joblib

pipeline_final = {
    "scaler":        scaler,
    "model":         meilleur_mod,
    "feature_names": list(X.columns),
    "label_mappings": encodage_mapping,
}
joblib.dump(pipeline_final, "model_student_performance.pkl")
print("Modele sauvegarde.")
```

Copiez le fichier `model_student_performance.pkl` dans `backend/`.

### Étape 2 — Lancer le backend FastAPI

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Vérifiez que l'API fonctionne :
- Documentation Swagger : http://localhost:8000/docs
- Health check : http://localhost:8000/health

### Étape 3 — Lancer le frontend React

```bash
cd frontend
npm create vite@latest . -- --template react-ts  # Si nouveau projet
npm install
npm install react-hook-form
npm run dev
```

L'application est disponible sur : http://localhost:5173

---

## Endpoints API

| Méthode | Endpoint     | Description                              |
|---------|-------------|------------------------------------------|
| POST    | `/predict`  | Prédit le score à l'examen               |
| POST    | `/explain`  | Retourne les valeurs SHAP                |
| GET     | `/history`  | Historique des prédictions               |
| GET     | `/features` | Liste des features et leurs encodages    |
| GET     | `/health`   | Statut du serveur et du modèle           |

### Exemple d'appel `/predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Hours_Studied": 23,
    "Attendance": 84,
    "Parental_Involvement": "Low",
    "Access_to_Resources": "High",
    "Extracurricular_Activities": "No",
    "Sleep_Hours": 7,
    "Previous_Scores": 73,
    "Motivation_Level": "Low",
    "Internet_Access": "Yes",
    "Tutoring_Sessions": 0,
    "Family_Income": "Low",
    "Teacher_Quality": "Medium",
    "School_Type": "Public",
    "Peer_Influence": "Positive",
    "Physical_Activity": 3,
    "Learning_Disabilities": "No",
    "Parental_Education_Level": "High School",
    "Distance_from_Home": "Near",
    "Gender": "Male"
  }'
```

Réponse attendue :
```json
{
  "score_predit": 67.4,
  "categorie": "Moyen",
  "couleur": "#378ADD"
}
```

---

## Déploiement Docker

```bash
# Depuis le dossier student-app/
docker compose up --build

# Frontend accessible sur : http://localhost:3000
# Backend accessible sur  : http://localhost:8000
```

---

## Variables d'environnement

| Variable       | Défaut                    | Description                      |
|----------------|--------------------------|----------------------------------|
| `VITE_API_URL` | `http://localhost:8000`  | URL du backend vue par le client |

---

## Dépendances frontend à installer

```bash
npm install react-hook-form       # Validation du formulaire
npm install recharts              # Graphiques (optionnel, si tu veux des charts avancés)
```

---

## Notes importantes

- Le fichier `.pkl` contient le scaler, le modèle et les mappings d'encodage.
  Il doit être régénéré si tu réentraînes le modèle avec de nouvelles données.
- Le `TreeExplainer` SHAP est chargé une seule fois au démarrage du serveur.
  La première requête `/explain` peut prendre 2-3 secondes, les suivantes sont rapides.
- En production, remplacer `allow_origins=["*"]` dans le CORS par l'URL exacte du frontend.
