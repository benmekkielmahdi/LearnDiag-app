import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  useColorScheme as useNativeColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';
import { FormattedText } from '../../components/formatted-text';
import { ResourceRecommender } from '../../components/resource-recommender';


const { width, height } = Dimensions.get('window');

const API_URL = 'http://192.168.120.52:8000';

const INITIAL_DATA = {
  Hours_Studied: 10,
  Attendance: 85,
  Parental_Involvement: 'Medium',
  Access_to_Resources: 'Medium',
  Extracurricular_Activities: 'No',
  Sleep_Hours: 7,
  Previous_Scores: 75,
  Motivation_Level: 'Medium',
  Internet_Access: 'Yes',
  Tutoring_Sessions: 0,
  Family_Income: 'Medium',
  Teacher_Quality: 'Medium',
  School_Type: 'Public',
  Peer_Influence: 'Neutral',
  Physical_Activity: 3,
  Learning_Disabilities: 'No',
  Parental_Education_Level: 'College',
  Distance_from_Home: 'Moderate',
  Gender: 'Male'
};

const steps = [
  { id: 'Hours_Studied', question: "Heures d'étude / semaine ?", icon: 'time-outline', type: 'number', min: 0, max: 100 },
  { id: 'Attendance', question: "Taux de présence (%) ?", icon: 'school-outline', type: 'number', min: 0, max: 100 },
  { id: 'Parental_Involvement', question: "Implication parentale ?", icon: 'people-outline', type: 'select', options: [{ label: 'Faible', value: 'Low' }, { label: 'Moyenne', value: 'Medium' }, { label: 'Élevée', value: 'High' }] },
  { id: 'Access_to_Resources', question: "Accès aux ressources ?", icon: 'library-outline', type: 'select', options: [{ label: 'Faible', value: 'Low' }, { label: 'Moyen', value: 'Medium' }, { label: 'Élevé', value: 'High' }] },
  { id: 'Extracurricular_Activities', question: "Activités extra ?", icon: 'musical-notes-outline', type: 'select', options: [{ label: 'Oui', value: 'Yes' }, { label: 'Non', value: 'No' }] },
  { id: 'Sleep_Hours', question: "Sommeil par nuit (h) ?", icon: 'moon-outline', type: 'number', min: 0, max: 24 },
  { id: 'Previous_Scores', question: "Moyenne actuelle ?", icon: 'trophy-outline', type: 'number', min: 0, max: 100 },
  { id: 'Motivation_Level', question: "Niveau de motivation ?", icon: 'flash-outline', type: 'select', options: [{ label: 'Faible', value: 'Low' }, { label: 'Moyen', value: 'Medium' }, { label: 'Élevé', value: 'High' }] },
  { id: 'Internet_Access', question: "Accès Internet ?", icon: 'wifi-outline', type: 'select', options: [{ label: 'Oui', value: 'Yes' }, { label: 'Non', value: 'No' }] },
  { id: 'Tutoring_Sessions', question: "Sessions de soutien ?", icon: 'book-outline', type: 'number', min: 0, max: 20 },
  { id: 'Family_Income', question: "Revenu du foyer ?", icon: 'wallet-outline', type: 'select', options: [{ label: 'Bas', value: 'Low' }, { label: 'Moyen', value: 'Medium' }, { label: 'Haut', value: 'High' }] },
  { id: 'Teacher_Quality', question: "Qualité d'enseignement ?", icon: 'star-outline', type: 'select', options: [{ label: 'Basse', value: 'Low' }, { label: 'Moyenne', value: 'Medium' }, { label: 'Haute', value: 'High' }] },
  { id: 'School_Type', question: "Type d'établissement ?", icon: 'business-outline', type: 'select', options: [{ label: 'Public', value: 'Public' }, { label: 'Privé', value: 'Private' }] },
  { id: 'Peer_Influence', question: "Influence des amis ?", icon: 'people-circle-outline', type: 'select', options: [{ label: 'Négative', value: 'Negative' }, { label: 'Neutre', value: 'Neutral' }, { label: 'Positive', value: 'Positive' }] },
  { id: 'Physical_Activity', question: "Sport / semaine (h) ?", icon: 'fitness-outline', type: 'number', min: 0, max: 40 },
  { id: 'Learning_Disabilities', question: "Difficultés d'apprentissage ?", icon: 'medical-outline', type: 'select', options: [{ label: 'Oui', value: 'Yes' }, { label: 'Non', value: 'No' }] },
  { id: 'Parental_Education_Level', question: "Études des parents ?", icon: 'medal-outline', type: 'select', options: [{ label: 'Bac', value: 'High School' }, { label: 'Licence', value: 'College' }, { label: 'Master+', value: 'Postgraduate' }] },
  { id: 'Distance_from_Home', question: "Distance domicile/école ?", icon: 'map-outline', type: 'select', options: [{ label: 'Proche', value: 'Near' }, { label: 'Moyenne', value: 'Moderate' }, { label: 'Loin', value: 'Far' }] },
  { id: 'Gender', question: "Genre ?", icon: 'person-outline', type: 'select', options: [{ label: 'Masc', value: 'Male' }, { label: 'Fém', value: 'Female' }] },
];

export default function GamifiedSurvey() {
  const nativeScheme = useNativeColorScheme();
  const [theme, setTheme] = useState(nativeScheme);
  const isDark = theme === 'dark';

  const themeColors = {
    bg: isDark ? ['#020617', '#0f172a'] : ['#f8fafc', '#f1f5f9'],
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    accent: '#3b82f6'
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionExplanation, setPredictionExplanation] = useState<any>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const fadeAnim = useState(new Animated.Value(1))[0];

  useFocusEffect(
    React.useCallback(() => {
      const loadPrefs = async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) setTheme(savedTheme as any);
        try {
          const token = await AsyncStorage.getItem('token');
          const resp = await axios.get(`${API_URL}/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
          if (resp.data.profile_data) setFormData({ ...INITIAL_DATA, ...resp.data.profile_data });
        } catch (e) {}
      };
      loadPrefs();
    }, [])
  );

  const updateValue = (val: any) => {
    setFormData({ ...formData, [steps[currentStep].id]: val });
    if (steps[currentStep].type === 'select') setTimeout(handleNext, 250);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      });
    } else {
      submitPrediction();
    }
  };

  const submitPrediction = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const [pred, expl] = await Promise.all([
        axios.post(`${API_URL}/predict`, formData, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API_URL}/explain`, formData, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPredictionResult(pred.data);
      setPredictionExplanation(expl.data);
      try { await axios.put(`${API_URL}/me/profile`, { profile_data: formData }, { headers: { Authorization: `Bearer ${token}` } }); } catch (e) {}
    } catch (err) {
      Alert.alert("Erreur", "Serveur indisponible.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg[0] }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>Analyse approfondie de votre profil...</Text>
      </View>
    );
  }

  if (predictionResult) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.bg[0] }}>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: predictionResult.couleur }]}>{predictionResult.score_predit.toFixed(0)}%</Text>
            <View style={[styles.statusBadge, { backgroundColor: predictionResult.couleur + '15', borderColor: predictionResult.couleur }]}>
              <Text style={{ color: predictionResult.couleur, fontWeight: '900' }}>{predictionResult.categorie.toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.llmCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <LinearGradient colors={[themeColors.accent + '15', 'transparent']} style={styles.llmGradient} />
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles-sharp" size={20} color={themeColors.accent} />
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Stratégie d'Accompagnement AI</Text>
            </View>
            <FormattedText text={predictionResult.recommandation} isDark={isDark} />
          </View>

          {/* SHAP ANALYSIS - ENHANCED */}
          {predictionExplanation && (
            <View style={[styles.card, { marginTop: 25, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="analytics" size={22} color={themeColors.accent} />
                <View>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>Moteurs de Performance</Text>
                  <Text style={[styles.cardSubTitle, { color: themeColors.subText }]}>Facteurs influençant votre score</Text>
                </View>
              </View>
              
              <View style={styles.shapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={[styles.legendText, { color: themeColors.subText }]}>Impact Positif</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.legendText, { color: themeColors.subText }]}>Impact Négatif</Text>
                </View>
              </View>
              
              {predictionExplanation.contributions.slice(0, 8).map((c: any, i: number) => {
                const val = Math.abs(c.shap_value);
                const isPos = c.shap_value > 0;
                const widthVal = Math.min(val * 15, 100); // Scaled for better visualization
                
                return (
                  <View key={i} style={styles.shapRow}>
                    <View style={styles.shapInfo}>
                      <Text style={[styles.shapLabel, { color: themeColors.text }]}>{c.feature.replace(/_/g, ' ')}</Text>
                      <Text style={[styles.shapValueText, { color: isPos ? '#10b981' : '#ef4444' }]}>
                        {isPos ? '+' : ''}{c.shap_value.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={[styles.barBg, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                      <View 
                        style={[
                          styles.barValue, 
                          { 
                            width: `${widthVal}%`, 
                            backgroundColor: isPos ? '#10b981' : '#ef4444',
                            shadowColor: isPos ? '#10b981' : '#ef4444',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.4,
                            shadowRadius: 10,
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* PLAYLIST RECOMMANDATIONS */}
          <ResourceRecommender formData={formData} isDark={isDark} />

          <TouchableOpacity style={styles.retryBtn} onPress={() => { setPredictionResult(null); setCurrentStep(0); }}>
            <Ionicons name="refresh" size={18} color={themeColors.subText} />
            <Text style={styles.retryText}>Nouveau Diagnostic</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg[0] }}>
      <View style={styles.surveyHeader}>
        <View style={styles.progressBg}><View style={[styles.progressVal, { width: `${progress}%` }]} /></View>
        <Text style={styles.stepCounter}>Étape {currentStep + 1} / {steps.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.surveyBody} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.surveyCard, { opacity: fadeAnim, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.iconBox}><Ionicons name={steps[currentStep].icon as any} size={36} color={themeColors.accent} /></View>
          <Text style={[styles.questionText, { color: themeColors.text }]}>{steps[currentStep].question}</Text>
          <View style={styles.optionsBox}>
            {steps[currentStep].type === 'select' ? (
              steps[currentStep].options?.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.optBtn, formData[steps[currentStep].id] === opt.value && { backgroundColor: themeColors.accent, borderColor: themeColors.accent }, { borderColor: themeColors.border }]} onPress={() => updateValue(opt.value)}><Text style={[styles.optText, { color: formData[steps[currentStep].id] === opt.value ? '#fff' : themeColors.subText }]}>{opt.label}</Text></TouchableOpacity>
              ))
            ) : (
              <View style={styles.numBox}>
                <TouchableOpacity style={styles.circleBtn} onPress={() => updateValue(formData[steps[currentStep].id]-1)}><Ionicons name="remove" size={28} color="#fff" /></TouchableOpacity>
                <Text style={[styles.numVal, { color: themeColors.text }]}>{formData[steps[currentStep].id]}</Text>
                <TouchableOpacity style={styles.circleBtn} onPress={() => updateValue(formData[steps[currentStep].id]+1)}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.navRow}>
            {currentStep > 0 && <TouchableOpacity style={[styles.backBtn, { borderColor: themeColors.border }]} onPress={() => setCurrentStep(currentStep-1)}><Ionicons name="arrow-back" size={24} color={themeColors.subText} /></TouchableOpacity>}
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: themeColors.accent }]} onPress={handleNext}><Text style={styles.nextBtnText}>{currentStep === steps.length - 1 ? "ANALYSER MON PROFIL" : "CONTINUER"}</Text></TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontWeight: '900' },
  resultScroll: { padding: 20, paddingTop: 40 },
  scoreContainer: { alignItems: 'center', marginBottom: 30 },
  scoreValue: { fontSize: 90, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, borderWidth: 2, marginTop: 10 },
  card: { borderRadius: 32, padding: 25, borderWidth: 1 },
  llmCard: { borderRadius: 32, padding: 25, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  llmGradient: { ...StyleSheet.absoluteFillObject },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardSubTitle: { fontSize: 12, fontWeight: '600' },
  llmText: { fontSize: 15, lineHeight: 26 },
  shapLegend: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: 'bold' },
  subInfo: { fontSize: 12, marginBottom: 20, fontWeight: '600' },
  shapRow: { marginBottom: 18 },
  shapInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  shapLabel: { fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' },
  shapValueText: { fontSize: 12, fontWeight: '900' },
  shapLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  shapTag: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  shapLabel: { fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  barBg: { height: 8, borderRadius: 4, width: '100%' },
  barValue: { height: '100%', borderRadius: 4 },
  retryBtn: { marginTop: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  retryText: { color: '#64748b', fontWeight: 'bold', fontSize: 15 },
  surveyHeader: { padding: 30, paddingBottom: 0 },
  progressBg: { height: 6, backgroundColor: '#3b82f615', borderRadius: 3, marginBottom: 10 },
  progressVal: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  stepCounter: { fontSize: 11, fontWeight: '900', color: '#3b82f6', textAlign: 'center' },
  surveyBody: { flexGrow: 1, justifyContent: 'center' },
  surveyCard: { marginHorizontal: 20, padding: 30, borderRadius: 35, borderWidth: 1 },
  iconBox: { alignSelf: 'center', backgroundColor: '#3b82f615', padding: 20, borderRadius: 25, marginBottom: 15 },
  questionText: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 25 },
  optionsBox: { marginBottom: 25 },
  optBtn: { padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 10, alignItems: 'center' },
  optText: { fontWeight: 'bold' },
  numBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  numVal: { fontSize: 52, fontWeight: '900' },
  navRow: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold' }
});
