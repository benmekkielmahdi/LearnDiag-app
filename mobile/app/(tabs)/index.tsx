import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  useColorScheme as useNativeColorScheme,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.120.52:8000';

const translations: any = {
  fr: {
    welcome: "Bienvenue sur",
    heroTitle_teacher: "Identifiez les difficultés de vos apprenants",
    heroSub_teacher: "Un système intelligent pour évaluer les besoins pédagogiques et anticiper les risques d'échec.",
    heroTitle_apprenant: "Boostez votre potentiel académique",
    heroSub_apprenant: "Découvrez vos leviers de performance et recevez des conseils personnalisés pour réussir.",
    btnConfig: "Configurer le profil",
    btnStart: "Lancer le diagnostic",
    statsTitle: "Aperçu rapide",
    diagCount: "Diagnostics",
    lastScore: "Dernier score"
  },
  en: {
    welcome: "Welcome to",
    heroTitle_teacher: "Identify your students' difficulties",
    heroSub_teacher: "An intelligent system to evaluate pedagogical needs and anticipate failure risks.",
    heroTitle_apprenant: "Boost your academic potential",
    heroSub_apprenant: "Discover your performance drivers and receive personalized advice to succeed.",
    btnConfig: "Configure profile",
    btnStart: "Launch diagnostic",
    statsTitle: "Quick overview",
    diagCount: "Diagnostics",
    lastScore: "Last score"
  }
};

export default function HomeScreen() {
  const nativeScheme = useNativeColorScheme();
  const [theme, setTheme] = useState(nativeScheme);
  const [lang, setLang] = useState('fr');
  const [stats, setStats] = useState({ count: 0, score: '--' });
  const [role, setRole] = useState('apprenant');

  const isDark = theme === 'dark';
  const t = translations[lang];

  const fetchRealStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const history = response.data;
      if (history.length > 0) {
        setStats({
          count: history.length,
          score: history[0].score.toFixed(0) + "%"
        });
      } else {
        setStats({ count: 0, score: "--" });
      }
    } catch (e) {
      const count = await AsyncStorage.getItem('diagCount') || "0";
      const score = await AsyncStorage.getItem('lastScore') || "--";
      setStats({ count: parseInt(count), score: score === "--" ? "--" : score + "%" });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadPrefs = async () => {
        const savedLang = await AsyncStorage.getItem('lang');
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedRole = await AsyncStorage.getItem('role');
        if (savedLang) setLang(savedLang);
        if (savedTheme) setTheme(savedTheme as any);
        if (savedRole) setRole(savedRole);
        fetchRealStats();
      };
      loadPrefs();
    }, [])
  );

  const themeColors = {
    bg: isDark ? ['#0f172a', '#1e1b4b'] : ['#f8fafc', '#ffffff'],
    text: isDark ? '#ffffff' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    card: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 1)',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.bg[0] }}>
      <LinearGradient colors={themeColors.bg as any} style={StyleSheet.absoluteFill} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <LinearGradient 
            colors={isDark ? ['#3b82f630', 'transparent'] : ['#3b82f608', 'transparent']} 
            style={styles.heroGradient} 
          />
          
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t.welcome} LearnDiag</Text>
            </View>
            <Text style={[styles.heroTitle, { color: themeColors.text }]}>
              {role === 'enseignant' ? t.heroTitle_teacher : t.heroTitle_apprenant}
            </Text>
            <Text style={[styles.heroSub, { color: themeColors.subText }]}>
              {role === 'enseignant' ? t.heroSub_teacher : t.heroSub_apprenant}
            </Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={() => router.push('/(tabs)/survey')}
              >
                <Text style={styles.primaryBtnText}>{t.btnStart}</Text>
                <Ionicons name="analytics" size={18} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryBtn, { borderColor: themeColors.border, backgroundColor: themeColors.card }]} 
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={[styles.secondaryBtnText, { color: themeColors.text }]}>{t.btnConfig}</Text>
                <Ionicons name="settings-outline" size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t.statsTitle}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.count}</Text>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>{t.diagCount}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.score}</Text>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>{t.lastScore}</Text>
            </View>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <View style={[styles.featureRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#3b82f6" />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Intelligence Artificielle</Text>
              <Text style={[styles.featureSub, { color: themeColors.subText }]}>Moteur de recommandation basé sur SHAP.</Text>
            </View>
          </View>
        </View>

        <View style={styles.playlistSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Ressources Essentielles</Text>
          
          <TouchableOpacity 
            style={[styles.playlistCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=9_iVv9L6p5c')}
          >
            <View style={styles.playlistIcon}>
              <Ionicons name="play-circle" size={24} color="#3b82f6" />
            </View>
            <View style={styles.playlistContent}>
              <Text style={[styles.playlistTitle, { color: themeColors.text }]}>The Learning Process</Text>
              <Text style={[styles.playlistSub, { color: themeColors.subText }]}>Comprendre comment ton cerveau apprend.</Text>
              <Text style={styles.watchNow}>Regarder maintenant</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.playlistCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=5MuNiZYcp_M')}
          >
            <View style={styles.playlistIcon}>
              <Ionicons name="play-circle" size={24} color="#3b82f6" />
            </View>
            <View style={styles.playlistContent}>
              <Text style={[styles.playlistTitle, { color: themeColors.text }]}>Sleep is Your Superpower</Text>
              <Text style={[styles.playlistSub, { color: themeColors.subText }]}>Comment le sommeil transforme tes résultats.</Text>
              <Text style={styles.watchNow}>Regarder maintenant</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.text }]}>LearnDiag</Text>
          <Text style={[styles.copyright, { color: themeColors.subText }]}>© 2026 LearnDiag. Tous droits réservés.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: { paddingTop: 70, paddingBottom: 30, paddingHorizontal: 25, position: 'relative' },
  heroGradient: { ...StyleSheet.absoluteFillObject, height: 300 },
  heroContent: { zIndex: 1 },
  badge: { 
    backgroundColor: '#3b82f615', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20, 
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3b82f625',
    marginBottom: 15
  },
  badgeText: { color: '#3b82f6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 32, fontWeight: '900', lineHeight: 38, marginBottom: 12 },
  heroSub: { fontSize: 14, lineHeight: 22, marginBottom: 30 },
  heroActions: { gap: 10 },
  primaryBtn: { 
    height: 55, 
    backgroundColor: '#3b82f6', 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    elevation: 4
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { 
    height: 55, 
    borderRadius: 16, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  secondaryBtnText: { fontSize: 15, fontWeight: 'bold' },
  statsSection: { paddingHorizontal: 25, marginTop: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 18, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  featuresSection: { paddingHorizontal: 25, marginTop: 25 },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, borderWidth: 1, gap: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  featureSub: { fontSize: 11 },
  playlistSection: { paddingHorizontal: 25, marginTop: 25, gap: 12 },
  playlistCard: { flexDirection: 'row', padding: 15, borderRadius: 22, borderWidth: 1, gap: 15, alignItems: 'center' },
  playlistIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f615', alignItems: 'center', justifyContent: 'center' },
  playlistContent: { flex: 1 },
  playlistTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  playlistSub: { fontSize: 11, marginBottom: 4 },
  watchNow: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6' },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  copyright: { fontSize: 10, marginTop: 5 }
});
