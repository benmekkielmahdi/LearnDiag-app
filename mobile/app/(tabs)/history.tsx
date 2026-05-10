import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  useColorScheme as useNativeColorScheme
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';

const API_URL = 'http://192.168.120.52:8000';

const translations: any = {
  fr: {
    title: "Mon Historique",
    empty: "Aucun diagnostic trouvé.",
    date: "Le",
    score: "Score",
    loading: "Chargement..."
  },
  en: {
    title: "My History",
    empty: "No diagnostics found.",
    date: "On",
    score: "Score",
    loading: "Loading..."
  }
};

export default function HistoryScreen() {
  const nativeScheme = useNativeColorScheme();
  const [theme, setTheme] = useState(nativeScheme);
  const [lang, setLang] = useState('fr');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = translations[lang];
  const isDark = theme === 'dark';
  
  const themeColors = {
    bg: isDark ? ['#0f172a', '#1e1b4b'] : ['#f8fafc', '#f1f5f9'],
    card: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.05)',
  };

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.log("History error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadPrefs = async () => {
        const savedLang = await AsyncStorage.getItem('lang');
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedLang) setLang(savedLang);
        if (savedTheme) setTheme(savedTheme as any);
        fetchHistory();
      };
      loadPrefs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg[0] }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.bg[0] }}>
      <LinearGradient colors={themeColors.bg as any} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#3b82f615' }]}>
          <Ionicons name="time-outline" size={24} color="#3b82f6" />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>{t.title}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="documents-outline" size={60} color={themeColors.border} />
            <Text style={[styles.emptyText, { color: themeColors.subText }]}>{t.empty}</Text>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.id} style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color={themeColors.subText} />
                  <Text style={[styles.dateText, { color: themeColors.subText }]}>
                    {t.date} {new Date(item.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: '#3b82f610' }]}>
                  <Text style={styles.scoreValue}>{item.score.toFixed(0)}%</Text>
                </View>
              </View>
              <Text style={[styles.categoryText, { color: themeColors.text }]}>{item.categorie}</Text>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    paddingTop: 65, 
    paddingHorizontal: 25, 
    marginBottom: 25 
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  listContainer: { paddingHorizontal: 20 },
  historyCard: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, fontWeight: 'bold' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scoreValue: { color: '#3b82f6', fontWeight: '900', fontSize: 13 },
  categoryText: { fontSize: 16, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, marginTop: 15, fontWeight: 'bold' }
});
