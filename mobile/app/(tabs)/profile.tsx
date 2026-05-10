import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  useColorScheme as useNativeColorScheme,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.120.52:8000';

const translations: any = {
  fr: {
    title: "Mon Profil",
    enseignant: "Enseignant",
    apprenant: "Apprenant",
    logout: "Se déconnecter",
    editBtn: "Configurer mon compte",
    saveBtn: "Enregistrer les modifications",
    settingsTitle: "Paramètres de l'application",
    lang: "Langue",
    theme: "Thème",
    dark: "Sombre",
    light: "Clair",
    fullName: "Nom complet",
    parentEmail: "Email des parents",
    defaultsTitle: "Variables de diagnostic par défaut",
    syncSuccess: "Profil mis à jour et synchronisé !",
    syncError: "Erreur de connexion au serveur."
  },
  en: {
    title: "My Profile",
    enseignant: "Teacher",
    apprenant: "Student",
    logout: "Sign Out",
    editBtn: "Configure Account",
    saveBtn: "Save Changes",
    settingsTitle: "App Settings",
    lang: "Language",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    fullName: "Full Name",
    parentEmail: "Parent Email",
    defaultsTitle: "Default Diagnostic Variables",
    syncSuccess: "Profile updated and synced!",
    syncError: "Server connection error."
  }
};

const profileVariables = [
  { id: 'Hours_Studied', label: "Heures étude", type: 'number' },
  { id: 'Attendance', label: "Présence %", type: 'number' },
  { id: 'Parental_Involvement', label: "Implication Parents", type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'Access_to_Resources', label: "Accès Ressources", type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'Extracurricular_Activities', label: "Activités Extra", type: 'select', options: ['Yes', 'No'] },
  { id: 'Sleep_Hours', label: "Sommeil", type: 'number' },
  { id: 'Previous_Scores', label: "Moyenne", type: 'number' },
  { id: 'Motivation_Level', label: "Motivation", type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'Internet_Access', label: "Accès Internet", type: 'select', options: ['Yes', 'No'] },
  { id: 'Tutoring_Sessions', label: "Soutien", type: 'number' },
  { id: 'Family_Income', label: "Revenu", type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'Teacher_Quality', label: "Qualité Profs", type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'School_Type', label: "Établissement", type: 'select', options: ['Public', 'Private'] },
  { id: 'Peer_Influence', label: "Influence Amis", type: 'select', options: ['Negative', 'Neutral', 'Positive'] },
  { id: 'Physical_Activity', label: "Sport", type: 'number' },
  { id: 'Learning_Disabilities', label: "Difficultés", type: 'select', options: ['Yes', 'No'] },
  { id: 'Parental_Education_Level', label: "Études Parents", type: 'select', options: ['High School', 'College', 'Postgraduate'] },
  { id: 'Distance_from_Home', label: "Distance École", type: 'select', options: ['Near', 'Moderate', 'Far'] },
  { id: 'Gender', label: "Genre", type: 'select', options: ['Male', 'Female'] },
];

export default function ProfileScreen() {
  const nativeScheme = useNativeColorScheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState(nativeScheme);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editProfileData, setEditProfileData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[lang] || translations['fr'];
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? ['#020617', '#0f172a'] : ['#f8fafc', '#f1f5f9'],
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    accent: '#3b82f6'
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/me/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setEditName(response.data.full_name);
      setEditParentEmail(response.data.parent_email || '');
      setEditProfileData(response.data.profile_data || {});
    } catch (err) {
      console.log("Profile load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPrefs = async () => {
      const savedLang = await AsyncStorage.getItem('lang');
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedLang) setLang(savedLang);
      if (savedTheme) setTheme(savedTheme as any);
      fetchProfile();
    };
    loadPrefs();
  }, []);

  const toggleLang = async () => {
    const newLang = lang === 'fr' ? 'en' : 'fr';
    setLang(newLang);
    await AsyncStorage.setItem('lang', newLang);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'role', 'fullName']);
    router.replace('/auth');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/me/profile`, {
        full_name: editName,
        parent_email: editParentEmail,
        profile_data: editProfileData
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await fetchProfile();
      setIsEditModalOpen(false);
      Alert.alert("Succès", t.syncSuccess);
    } catch (err) {
      Alert.alert("Erreur", t.syncError);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.bg[0] }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg[0] }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <View style={styles.avatar}><Ionicons name="person" size={40} color={colors.accent} /></View>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name}</Text>
          <Text style={[styles.email, { color: colors.subText }]}>{profile?.email}</Text>
          <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={{ color: colors.accent, fontWeight: 'bold' }}>{profile?.role === 'enseignant' ? t.enseignant : t.apprenant}</Text>
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settingsTitle}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}><Ionicons name="language" size={20} color={colors.accent} /><Text style={[styles.settingLabel, { color: colors.text }]}>{t.lang}</Text></View>
            <TouchableOpacity style={styles.toggleBtn} onPress={toggleLang}><Text style={styles.toggleBtnText}>{lang.toUpperCase()}</Text></TouchableOpacity>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}><Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.accent} /><Text style={[styles.settingLabel, { color: colors.text }]}>{t.theme}</Text></View>
            <TouchableOpacity style={styles.toggleBtn} onPress={toggleTheme}><Text style={styles.toggleBtnText}>{isDark ? t.dark : t.light}</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.configBtn, { backgroundColor: colors.accent }]} onPress={() => setIsEditModalOpen(true)}>
          <Ionicons name="options-outline" size={20} color="#fff" />
          <Text style={styles.configBtnText}>{t.editBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isEditModalOpen} animationType="slide">
        <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.bg[0] }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.editBtn}</Text>
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={[styles.inputLabel, { color: colors.subText }]}>{t.fullName}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={editName} onChangeText={setEditName} />

            <Text style={[styles.inputLabel, { color: colors.subText, marginTop: 15 }]}>{t.parentEmail}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={editParentEmail} onChangeText={setEditParentEmail} keyboardType="email-address" />

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30, marginBottom: 15 }]}>{t.defaultsTitle}</Text>
            {profileVariables.map(v => (
              <View key={v.id} style={styles.editVarRow}>
                <Text style={[styles.varLabel, { color: colors.text, flex: 1 }]}>{v.label}</Text>
                {v.type === 'number' ? (
                  <View style={styles.counterRow}>
                    <TouchableOpacity onPress={() => setEditProfileData({...editProfileData, [v.id]: Math.max(0, (editProfileData[v.id]||0)-1)})}><Ionicons name="remove-circle" size={26} color={colors.accent} /></TouchableOpacity>
                    <Text style={{ color: colors.text, width: 35, textAlign: 'center', fontWeight: 'bold' }}>{editProfileData[v.id] || 0}</Text>
                    <TouchableOpacity onPress={() => setEditProfileData({...editProfileData, [v.id]: (editProfileData[v.id]||0)+1})}><Ionicons name="add-circle" size={26} color={colors.accent} /></TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
                    {v.options?.map(opt => (
                      <TouchableOpacity key={opt} style={[styles.miniBtn, editProfileData[v.id] === opt && { backgroundColor: colors.accent }]} onPress={() => setEditProfileData({...editProfileData, [v.id]: opt})}>
                        <Text style={[styles.miniBtnText, editProfileData[v.id] === opt && { color: '#fff' }]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.saveBtn}</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#3b82f615', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 13, marginBottom: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  settingsCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  toggleBtn: { backgroundColor: '#3b82f615', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  toggleBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  configBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, marginHorizontal: 20 },
  configBtnText: { color: '#fff', fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  input: { height: 50, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, marginBottom: 10 },
  editVarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  varLabel: { fontSize: 13, fontWeight: '500' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  selectScroll: { flexGrow: 0 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f630', marginRight: 8 },
  miniBtnText: { fontSize: 10, color: '#3b82f6', fontWeight: 'bold' },
  modalFooter: { padding: 20, position: 'absolute', bottom: 0, width: '100%' },
  saveBtn: { height: 55, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
