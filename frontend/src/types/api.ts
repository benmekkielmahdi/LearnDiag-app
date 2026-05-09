export interface StudentInput {
  Hours_Studied: number;
  Attendance: number;
  Parental_Involvement: string;
  Access_to_Resources: string;
  Extracurricular_Activities: string;
  Sleep_Hours: number;
  Previous_Scores: number;
  Motivation_Level: string;
  Internet_Access: string;
  Tutoring_Sessions: number;
  Family_Income: string;
  Teacher_Quality: string;
  School_Type: string;
  Peer_Influence: string;
  Physical_Activity: number;
  Learning_Disabilities: string;
  Parental_Education_Level: string;
  Distance_from_Home: string;
  Gender: string;
}

export interface PredictionResponse {
  score_predit: number;
  categorie: string;
  couleur: string;
  recommandation?: string;
}

export interface ShapContribution {
  feature: string;
  shap_value: number;
}

export interface ExplainResponse {
  base_value: number;
  score_predit: number;
  contributions: ShapContribution[];
}

export interface HistoryItem {
  id: number;
  created_at: string;
  score: number;
  categorie: string;
}
