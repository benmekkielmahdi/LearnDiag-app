import React, { useState, useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useColorScheme, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Text, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { height, width } = Dimensions.get('window');

const API_URL = 'http://192.168.120.52:8000';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Redirection automatique si non connecté
  useEffect(() => {
    const validateAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth');
      }
    };
    validateAuth();
  }, []);

  // Charger la préférence de thème sauvegardée
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else {
        setIsDark(colorScheme === 'dark');
      }
    };
    loadTheme();
  }, [colorScheme]);

  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    await AsyncStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userFullName, setUserFullName] = useState('');

  // Charger le nom de l'utilisateur
  useEffect(() => {
    const getName = async () => {
      const name = await AsyncStorage.getItem('fullName');
      if (name) setUserFullName(name);
    };
    getName();
  }, [chatOpen]);

  const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    bg: isDark ? '#020617' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#374151' : '#e2e8f0',
    input: isDark ? '#030712' : '#f1f5f9',
    botBubble: isDark ? '#1f2937' : '#f1f5f9',
    userBubble: '#3b82f6',
    overlay: 'rgba(0,0,0,0.8)'
  };

  const sendChatMessage = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    setChatMsg('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMsg
      }, { headers: { Authorization: `Bearer ${token}` } });
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Erreur de connexion au serveur IA." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: colors.card, 
            borderTopWidth: 1, 
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 88 : 65,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subText,
          tabBarLabelStyle: { fontWeight: 'bold', fontSize: 10 }
        }}>
        <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
        <Tabs.Screen name="survey" options={{ title: 'Diagnostic', tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: 'Historique', tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
      </Tabs>

      {/* FAB - Bouton Chatbot */}
      {!chatOpen && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setChatOpen(true)}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          <View style={[styles.onlineBadge, { borderColor: colors.card }]} />
        </TouchableOpacity>
      )}

      {/* Modal Chatbot avec Contrôle de Thème Manuel */}
      <Modal visible={chatOpen} animationType="slide" transparent statusBarTranslucent>
        <View style={[styles.modalBg, { backgroundColor: colors.overlay }]}>
          <SafeAreaView style={[styles.chatContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <View>
                  <Text style={[styles.chatTitle, { color: colors.text }]}>Assistant LearnDiag</Text>
                  <Text style={[styles.statusText, { color: colors.success }]}>En ligne • IA</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.input }]}>
                  <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setChatOpen(false)} style={[styles.iconBtn, { backgroundColor: colors.input }]}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.chatList} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.botMsgBox, { backgroundColor: colors.botBubble }]}>
                <Text style={[styles.botMsg, { color: colors.text }]}>
                  Bonjour {userFullName || 'cher apprenant'} ! 👋 Je suis ravie de vous aider dans votre parcours d'apprentissage. Comment puis-je vous accompagner aujourd'hui ?
                </Text>
              </View>
              {chatHistory.map((h, i) => (
                <View key={i} style={h.role === 'user' ? styles.userMsgBox : [styles.botMsgBox, { backgroundColor: colors.botBubble }]}>
                  <Text style={h.role === 'user' ? styles.userMsg : [styles.botMsg, { color: colors.text }]}>{h.content}</Text>
                </View>
              ))}
              {isTyping && (
                <View style={[styles.botMsgBox, { backgroundColor: colors.botBubble, width: 60 }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </ScrollView>

            <View style={[styles.chatInputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput 
                style={[styles.chatInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]} 
                placeholder="Message..." 
                placeholderTextColor={colors.subText}
                value={chatMsg}
                onChangeText={setChatMsg}
                multiline
              />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={sendChatMessage}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 85, right: 20, 
    width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', elevation: 8
  },
  onlineBadge: {
    position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#10b981', borderWidth: 2
  },
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  chatContainer: { height: height * 0.9, borderTopLeftRadius: 35, borderTopRightRadius: 35, overflow: 'hidden' },
  chatHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chatTitle: { fontSize: 17, fontWeight: '900' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  iconBtn: { padding: 8, borderRadius: 12 },
  chatList: { flex: 1 },
  botMsgBox: { alignSelf: 'flex-start', padding: 15, borderRadius: 22, borderBottomLeftRadius: 4, marginBottom: 15, maxWidth: '82%' },
  botMsg: { fontSize: 14, lineHeight: 22 },
  userMsgBox: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', padding: 15, borderRadius: 22, borderBottomRightRadius: 4, marginBottom: 15, maxWidth: '82%' },
  userMsg: { color: '#fff', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  chatInputRow: { padding: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 20, flexDirection: 'row', gap: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, minHeight: 48, maxHeight: 120, fontSize: 15, borderWidth: 1 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }
});
