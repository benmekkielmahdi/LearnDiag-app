import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Send, History as HistoryIcon, TrendingUp,
  BrainCircuit, AlertCircle, LogOut, ChevronRight,
  Target, Activity, Globe, Layout, ShieldCheck, Zap, X, User, Mail, CheckCircle2, Loader2, Bot,
  Users, BarChart3, AlertTriangle, MessageSquare, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { predictionService } from '../api/predictionService';
import ThemeToggle from "../components/ThemeToggle";
import Auth from "../components/Auth";
import { ChatAssistant } from "../components/ChatAssistant";
import { GamifiedSurvey } from '../components/GamifiedSurvey';
import { ResourceRecommender } from '../components/ResourceRecommender';
import { cn } from "../lib/utils";
import ProfilePage from "./Profile";
import { FormattedText } from "../components/FormattedText";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

const App = () => {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [currentView, setCurrentView] = useState<'home' | 'profile'>('home');
  const [hasProfileConfig, setHasProfileConfig] = useState(true);
  const [isGamified, setIsGamified] = useState(false);
  const [formWarning, setFormWarning] = useState<{ type: 'impossible' | 'suspicious', message: string } | null>(null);

  const handleSendEmail = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!prediction) return;
    
    setEmailStatus('sending');
    try {
      await predictionService.sendEmailReport({
        full_name: fullName || 'Eleve',
        score: prediction.score_predit,
        categorie: prediction.categorie,
        recommandation: prediction.recommandation,
        inputs: formData
      });
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (err) {
      setEmailStatus('error');
      setError("Erreur lors de l'envoi de l'email. Vérifiez vos paramètres SMTP.");
      setTimeout(() => setEmailStatus('idle'), 3000);
    }
  };

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!prediction) return;
    try {
      await predictionService.downloadReport({
        full_name: fullName || 'Eleve',
        score: prediction.score_predit,
        categorie: prediction.categorie,
        recommandation: prediction.recommandation,
        inputs: formData
      });
    } catch (err) {
      setError("Erreur lors de la génération du PDF");
    }
  };

  const handleListen = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!prediction || !audioRef.current) return;
    
    if (isSpeaking) {
      audioRef.current.pause();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const audioUrl = await predictionService.getAudioReport(
        prediction.recommandation, 
        i18n.language === 'fr' ? 'fr' : 'en'
      );
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      audioRef.current.onended = () => setIsSpeaking(false);
    } catch (err) {
      setError("Erreur lors de la génération de l'audio IA");
      setIsSpeaking(false);
    }
  };

  const [formData, setFormData] = useState({
    Hours_Studied: 15,
    Attendance: 90,
    Parental_Involvement: 'Medium',
    Access_to_Resources: 'Medium',
    Extracurricular_Activities: 'No',
    Sleep_Hours: 7,
    Previous_Scores: 75,
    Motivation_Level: 'Medium',
    Internet_Access: 'Yes',
    Tutoring_Sessions: 2,
    Family_Income: 'Medium',
    Teacher_Quality: 'Medium',
    School_Type: 'Public',
    Peer_Influence: 'Neutral',
    Physical_Activity: 3,
    Learning_Disabilities: 'No',
    Parental_Education_Level: 'High School',
    Distance_from_Home: 'Near',
    Gender: 'Male'
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchHistory();
      fetchMetrics();
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const data = await predictionService.getHistory(5);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await predictionService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch metrics");
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const profile = await predictionService.getProfile();
      if (profile.profile_data && Object.keys(profile.profile_data).length > 0) {
        setFormData(profile.profile_data);
        setHasProfileConfig(true);
      } else {
        setHasProfileConfig(false);
      }
    } catch (err) {
      console.error("Failed to fetch profile");
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const handleLogin = (data: any) => {
    setToken(data.access_token);
    setRole(data.role);
    setFullName(data.full_name);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('fullName', data.full_name);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setFullName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    setPrediction(null);
    setExplanation(null);
  };

  const validateInconsistency = (newData: any) => {
    const sleep = Number(newData.Sleep_Hours || 0);
    const study = Number(newData.Hours_Studied || 0);
    const physical = Number(newData.Physical_Activity || 0);
    const attendance = Number(newData.Attendance || 0);
    const previous = Number(newData.Previous_Scores || 0);
    const tutoring = Number(newData.Tutoring_Sessions || 0);

    // Rule 1: Limites basiques (Basic Bounds)
    if (attendance < 0 || attendance > 100) return { type: 'impossible', message: "Le taux de présence doit être compris entre 0 et 100%." };
    if (previous < 0 || previous > 100) return { type: 'impossible', message: "La moyenne générale doit être sur 100." };
    if (tutoring < 0 || tutoring > 100) return { type: 'impossible', message: "Le nombre de cours de soutien est irréaliste." };
    if (physical < 0 || study < 0 || sleep < 0) return { type: 'impossible', message: "Le temps saisi ne peut pas être négatif." };

    // Rule 2: Sleep Hours (Daily)
    if (sleep < 3) return { type: 'impossible', message: "Moins de 3h de sommeil ? Ton cerveau ne peut pas mémoriser correctement." };
    if (sleep > 15) return { type: 'suspicious', message: "Beaucoup de sommeil détecté. Vérifie que tu as le temps d'étudier !" };

    // Rule 3: Study Hours (Weekly)
    if (study > 80) return { type: 'impossible', message: "Plus de 80h d'étude ? Attention au surmenage et à l'épuisement profond." };

    // Rule 4: Physical Activity
    if (physical > 30) return { type: 'suspicious', message: "Plus de 30h de sport par semaine ? Tu t'entraînes pour les Jeux Olympiques ?" };

    // Rule 5: Tutoring Sessions
    if (tutoring > 20) return { type: 'suspicious', message: "Beaucoup de cours de soutien ! N'oublie pas de travailler en autonomie." };

    // Rule 6: Total Weekly Time Check
    const totalWeekly = (sleep * 7) + study + physical;
    if (totalWeekly > 168) {
      return { type: 'impossible', message: "Impossible ! Ton emploi du temps (Sommeil+Étude+Sport) dépasse les 168h de la semaine." };
    }

    // Rule 7: Logic Cross-Checks (IA Déductive)
    if (study === 0 && previous > 90) return { type: 'suspicious', message: "Aucune révision mais des notes excellentes ? Quel talent caché !" };
    if (attendance < 30 && previous > 80) return { type: 'suspicious', message: "Beaucoup d'absences mais de très bonnes notes. Es-tu sûr de tes chiffres ?" };

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    
    const newData = { ...formData, [name]: val };
    const inconsistency = validateInconsistency(newData);
    setFormWarning(inconsistency as any);

    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const pred = await predictionService.predict(formData);
      setPrediction(pred);
      const expl = await predictionService.explain(formData);
      setExplanation(expl);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('error.server'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setBatchFile(e.target.files[0]);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;
    setLoading(true);
    setError(null);
    try {
      const results = await predictionService.batchPredict(batchFile);
      const sortedResults = [...results].sort((a, b) => a.score_predit - b.score_predit);
      setBatchResults(sortedResults);
      
      // Fetch AI summary for the whole class
      setIsSummarizing(true);
      try {
        const summary = await predictionService.getBatchSummary(sortedResults);
        setBatchSummary(summary.summary);
      } catch (err) {
        console.error("Failed to fetch batch summary");
      } finally {
        setIsSummarizing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('error.server'));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussStudent = (student: any) => {
    setChatContext(student.recommandation);
    setChatKey(prev => prev + 1);
    setIsChatOpen(true);
  };

  const downloadBatchReport = async () => {
    if (!batchResults.length) return;
    try {
      await predictionService.downloadBatchReport(
        batchResults, 
        batchSummary, 
        fullName || "Enseignant"
      );
    } catch (err) {
      console.error("Failed to download batch report");
    }
  };

  if (!token) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Header / Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <span className="text-2xl font-black tracking-tighter gradient-text">LearnDiag</span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            <a href="#" className="nav-link">{t('nav.home')}</a>
            <a href="#form-section" className="nav-link">{t('nav.predict')}</a>
            <a href="#history-section" className="nav-link">{t('nav.history')}</a>
            {role === 'enseignant' && <a href="#batch-section" className="nav-link">{t('batch.title')}</a>}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center p-1 bg-secondary rounded-xl">
              <button
                onClick={() => { i18n.changeLanguage('fr'); localStorage.setItem('lang', 'fr'); }}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", i18n.language === 'fr' ? "bg-card shadow-sm text-primary" : "text-foreground/40 hover:text-foreground")}
              >FR</button>
              <button
                onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('lang', 'en'); }}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", i18n.language === 'en' ? "bg-card shadow-sm text-primary" : "text-foreground/40 hover:text-foreground")}
              >EN</button>
            </div>
            
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-secondary transition-all font-bold text-sm"
            >
              <User size={18} className="text-primary" />
              <span className="hidden sm:inline">{t('nav.profile')}</span>
            </button>
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-black uppercase tracking-tighter opacity-40">{role}</div>
                <div className="text-sm font-bold truncate max-w-[120px]">{fullName}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-secondary hover:bg-red-500/10 hover:text-red-500 transition-all text-foreground/60"
                title={t('nav.logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        
        {currentView === 'profile' ? (
          <ProfilePage 
            onBack={() => {
              setCurrentView('home');
              fetchUserProfile(); // Refresh form data after profile update
            }} 
            userFullName={fullName} 
            initialData={formData}
          />
        ) : (
          <>
            {/* Profile Completion Banner */}
            {!hasProfileConfig && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">{t('profile.banner_title')}</h4>
                    <p className="text-sm text-foreground/60 font-medium">{t('profile.banner_desc')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentView('profile')}
                  className="btn-primary py-3 px-8 text-sm"
                >
                  {t('profile.banner_btn')}
                </button>
              </motion.div>
            )}

            {/* Hero Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-foreground/40"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                {t('hero.model')} : <span className="text-foreground">{(metrics?.R2 ? metrics.R2 * 100 : 85.4).toFixed(1)}%</span>
              </div>
              <div className="h-1 w-1 bg-border rounded-full" />
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-primary" />
                Moteur : <span className="bg-secondary px-2 py-0.5 rounded-lg text-[10px] text-foreground/60">{metrics?.best_model || 'Gradient Boosting'}</span>
              </div>
            </motion.div>
            <h1 className="text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
              {t('hero.title_start')} <span className="gradient-text">{t('hero.success')}</span> {t('hero.title_end')}
            </h1>
            <p className="text-xl text-foreground/60 leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center gap-6 pt-4">
              <a href="#form-section" className="btn-primary">
                {t('button.start')} <ChevronRight size={22} />
              </a>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">U{i}</div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-background bg-primary text-white flex items-center justify-center text-[10px] font-bold">+500</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-indigo-500/20 rounded-[2rem] blur-2xl -z-10"></div>
            <div className="glass-card overflow-hidden aspect-square lg:aspect-video flex items-center justify-center relative group">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                alt="Students"
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="glass-card p-4 bg-white/10 border-white/20">
                  <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Accuracy</div>
                  <div className="text-white text-2xl font-black">94.2%</div>
                </div>
                <div className="glass-card p-4 bg-white/10 border-white/20">
                  <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Processed</div>
                  <div className="text-white text-2xl font-black">1.2k+</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Prediction Section */}
        <section id="form-section" className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight">{t('nav.predict')}</h2>
            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-10">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    {isGamified ? <Zap size={24} /> : <Layout size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{isGamified ? "Mode Aventure IA" : "Formulaire de Diagnostic"}</h3>
                    <p className="text-xs text-slate-500">{isGamified ? "Configure ton profil en t'amusant" : "Saisie rapide de vos variables"}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsGamified(!isGamified)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all text-xs font-bold"
                >
                  {isGamified ? <Layout size={14} /> : <Zap size={14} className="text-yellow-500" />}
                  {isGamified ? "Passer au Formulaire" : "Mode Aventure"}
                </button>
              </div>

              {isGamified ? (
                <GamifiedSurvey 
                  initialData={formData}
                  onComplete={async (data) => {
                    setFormData(data);
                    setIsGamified(false);
                    // Sauvegarde automatique en base de données si connecté
                    if (token) {
                      try {
                        await predictionService.updateProfile({ profile_data: data });
                      } catch (err) {
                        console.error("Erreur de synchronisation profil", err);
                      }
                    }
                  }}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  {Object.entries(formData).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-foreground/50 ml-1">
                        {t(`fields.${key}`)}
                      </label>
                      {typeof val === 'string' ? (
                        <select
                          name={key} value={val} onChange={handleInputChange}
                          className="input-field appearance-none"
                        >
                          {key === 'Internet_Access' || key === 'Extracurricular_Activities' || key === 'Learning_Disabilities' ? (
                            ['Yes', 'No'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'Gender' ? (
                            ['Male', 'Female'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'Motivation_Level' || key === 'Parental_Involvement' || key === 'Access_to_Resources' || key === 'Teacher_Quality' || key === 'Family_Income' ? (
                            ['Low', 'Medium', 'High'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'School_Type' ? (
                            ['Public', 'Private'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'Peer_Influence' ? (
                            ['Positive', 'Neutral', 'Negative'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'Parental_Education_Level' ? (
                            ['High School', 'College', 'Postgraduate'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : key === 'Distance_from_Home' ? (
                            ['Near', 'Moderate', 'Far'].map(o => <option key={o} value={o}>{t(`options.${o}`)}</option>)
                          ) : (
                            <option value={val}>{t(`options.${val}`)}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="number" name={key} value={val} onChange={handleInputChange}
                          className="input-field"
                        />
                      )}
                    </div>
                  ))}
                </div>



                <button 
                  type="submit" 
                  disabled={loading || formWarning?.type === 'impossible'} 
                  className={cn(
                    "btn-primary w-full mt-10 transition-all",
                    formWarning?.type === 'impossible' && "opacity-50 grayscale cursor-not-allowed hover:scale-100 active:scale-100"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={22} />}
                  <span className="text-lg">{t('button.predict')}</span>
                </button>
              </form>
            )}
          </div>

            <aside className="space-y-8">
              {/* History Card */}
              <div id="history-section" className="glass-card p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <HistoryIcon className="text-primary" size={24} /> {t('history.title')}
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {history.length > 0 ? history.map((item) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id}
                      className="p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-black">{item.score.toFixed(1)} <span className="text-[10px] text-foreground/40 font-bold">/ 100</span></div>
                          <div className="text-[10px] font-bold text-foreground/30 uppercase mt-1">{new Date(item.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="px-3 py-1 rounded-lg text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: getCategoryColor(item.categorie) }}>
                          {item.categorie}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="p-4 bg-secondary rounded-full text-foreground/20"><Layout size={40} /></div>
                      <p className="text-sm text-foreground/40 font-medium italic">{t('error.no_history')}</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {(prediction || loading) && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              <div className="glass-card p-10 space-y-8 border-l-8 border-primary overflow-hidden relative">
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground/40">Diagnostic Final</h3>
                    <div className="text-6xl font-black gradient-text">
                      {prediction?.score_predit.toFixed(1) || '--'} <span className="text-xl text-foreground/20 font-bold">/ 100</span>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl" style={{ backgroundColor: prediction?.couleur || '#ccc' }}>
                    {prediction?.categorie?.charAt(0) || '?'}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-2xl border border-border">
                    <Activity className="text-primary" />
                    <div>
                      <div className="text-[10px] font-black uppercase text-foreground/40">Status</div>
                      <div className="font-bold">{prediction?.categorie || 'En attente'}</div>
                    </div>
                  </div>
                  {prediction?.recommandation && (
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                          <BrainCircuit size={18} />
                          <h4 className="font-black text-sm uppercase tracking-widest">{t('recommendation.title')}</h4>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            type="button"
                            onClick={(e) => handleListen(e)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border",
                              isSpeaking 
                                ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                                : "bg-card hover:bg-secondary border-border/50 text-foreground"
                            )}
                            title="Écouter la stratégie"
                          >
                            {isSpeaking ? <X size={16} /> : <Zap size={16} className="fill-current text-primary" />}
                            <span className="text-[10px] font-black uppercase tracking-wider">{isSpeaking ? "Arrêter" : "Lire"}</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={(e) => handleSendEmail(e)}
                            disabled={emailStatus !== 'idle'}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border",
                              emailStatus === 'success' 
                                ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20" 
                                : emailStatus === 'error'
                                ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                                : "bg-card hover:bg-secondary border-border/50 text-foreground"
                            )}
                            title="Envoyer par Email"
                          >
                            {emailStatus === 'sending' ? <Loader2 className="animate-spin" size={16} /> : 
                             emailStatus === 'success' ? <CheckCircle2 size={16} /> :
                             <Mail size={16} className="text-primary" />}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {emailStatus === 'sending' ? "Envoi..." : 
                               emailStatus === 'success' ? "Envoyé" : 
                               emailStatus === 'error' ? "Échec" : "Email"}
                            </span>
                          </button>

                          <button 
                            type="button"
                            onClick={(e) => handleDownloadPDF(e)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                            title="Télécharger PDF"
                          >
                            <Layout size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white">PDF</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-border shadow-sm">
                        <FormattedText text={prediction.recommandation} />
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Bot size={18} className="flex-shrink-0" />
                        <span className="text-xs font-bold leading-tight">
                          💡 Vous pouvez maintenant discuter de cette stratégie et poser vos questions à l'assistant IA (en bas à droite).
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {explanation && (
                <div className="glass-card p-10 space-y-6">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <BrainCircuit className="text-primary" /> {t('shap.title')}
                  </h3>
                  
                  {role === 'enseignant' && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-sm leading-relaxed text-foreground/80">
                      <strong className="text-primary font-black block mb-1">{t('shap.teacher_analysis')}</strong> 
                      {t('shap.explanation', { baseValue: explanation.base_value.toFixed(1) })}
                    </div>
                  )}

                  <div className="space-y-5">
                    {explanation.contributions.map((c: any, i: number) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-foreground/60">
                          <span>{t(`fields.${c.feature}`)}</span>
                          <span className={c.shap_value > 0 ? "text-emerald-500" : "text-rose-500"}>
                            {c.shap_value > 0 ? '+' : ''}{c.shap_value.toFixed(3)}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(Math.abs(c.shap_value) * 100, 100)}%` }}
                            className={cn("h-full rounded-full", c.shap_value > 0 ? "bg-emerald-500" : "bg-rose-500")}
                          ></motion.div>
                        </div>
                        {role === 'enseignant' && (
                          <div className="text-[10px] text-foreground/50 italic flex items-center gap-1">
                            {t('shap.impact')} 
                            {c.shap_value > 0 
                              ? <span className="text-emerald-500/80">{t('shap.improves', { value: Math.abs(c.shap_value).toFixed(2) })}</span>
                              : <span className="text-rose-500/80">{t('shap.penalizes', { value: Math.abs(c.shap_value).toFixed(2) })}</span>
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Resource Playlist (Netflix Style) */}
        {prediction && !loading && (
          <ResourceRecommender formData={formData} prediction={prediction} />
        )}

        {/* Batch Prediction Section */}
        {role === 'enseignant' && (
          <section id="batch-section" className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tight">{t('batch.title')}</h2>
              <p className="text-foreground/50 max-w-2xl mx-auto font-medium">
                {t('batch.subtitle')}
              </p>
            </div>

            <div className="glass-card p-12 flex flex-col items-center gap-8 max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-float">
                <Globe size={40} />
              </div>
              <input
                type="file" accept=".csv" onChange={handleFileChange}
                className="w-full max-w-sm text-sm text-foreground/60 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-primary/80 transition-all"
              />
              <button
                onClick={handleBatchSubmit} disabled={loading || !batchFile}
                className="btn-primary w-full max-w-sm"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={22} />}
                {t('button.send_file')}
              </button>

              {batchResults.length > 0 && (
                <div className="w-full space-y-6 mt-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <TrendingUp className="text-primary" /> {t('batch.results')}
                    </h3>
                    <button 
                      onClick={downloadBatchReport}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-black transition-all shadow-lg shadow-primary/20"
                    >
                      <Download size={14} /> Télécharger Rapport PDF
                    </button>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="p-6 glass-card border-l-4 border-primary bg-primary/5">
                        <div className="flex items-center gap-3 mb-2 text-primary">
                          <BrainCircuit size={20} />
                          <span className="text-xs font-black uppercase tracking-widest">Effectif</span>
                        </div>
                        <div className="text-3xl font-black">{batchResults.length} élèves</div>
                      </div>
                      <div className="p-6 glass-card border-l-4 border-emerald-500 bg-emerald-500/5">
                        <div className="flex items-center gap-3 mb-2 text-emerald-500">
                          <BarChart3 size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">Moyenne Classe</span>
                        </div>
                        <div className="text-3xl font-black">
                          {(batchResults.reduce((acc, curr) => acc + curr.score_predit, 0) / batchResults.length).toFixed(1)}
                        </div>
                      </div>
                      <div className="p-6 glass-card border-l-4 border-rose-500 bg-rose-500/5">
                        <div className="flex items-center gap-3 mb-2 text-rose-500">
                          <AlertTriangle size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">Alertes</span>
                        </div>
                        <div className="text-3xl font-black">
                          {batchResults.filter(r => r.score_predit < 60).length} prioritaires
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 p-8 glass-card bg-card/30 flex flex-col items-center justify-center min-h-[300px]">
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground/40 mb-8 w-full">Répartition des Profils</h4>
                      <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={Object.entries(
                            batchResults.reduce((acc: any, curr) => {
                              acc[curr.categorie] = (acc[curr.categorie] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([name, value]) => ({ name, value }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis 
                              dataKey="name" 
                              fontSize={10} 
                              fontWeight="bold" 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ 
                                backgroundColor: 'var(--card)', 
                                borderRadius: '12px', 
                                border: '1px solid var(--border)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                              {Object.entries(
                                batchResults.reduce((acc: any, curr) => {
                                  acc[curr.categorie] = (acc[curr.categorie] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map((entry: any, index) => {
                                const COLORS: any = {
                                  "En difficulté": "#E24B4A",
                                  "Insuffisant": "#EF9F27",
                                  "Moyen": "#378ADD",
                                  "Bien": "#1D9E75",
                                  "Excellent": "#639922"
                                };
                                return <Cell key={`cell-${index}`} fill={COLORS[entry[0]] || '#2563eb'} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* AI Class Summary */}
                  <AnimatePresence>
                    {(isSummarizing || batchSummary) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BrainCircuit size={120} className="text-primary" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Bot size={24} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black tracking-tight">Synthèse Pédagogique de la Classe</h4>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">Analyse Intelligente Ollama</p>
                          </div>
                        </div>
                        
                        {isSummarizing ? (
                          <div className="flex items-center gap-3 py-4 text-foreground/40 font-bold italic">
                            <Loader2 className="animate-spin" size={18} />
                            Analyse de la classe en cours...
                          </div>
                        ) : (
                          <div className="prose dark:prose-invert max-w-none">
                            <FormattedText text={batchSummary || ""} />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Détails par élève</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Trié par urgence</span>
                    </div>
                    {batchResults.map((res, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={cn(
                          "p-6 glass-card border-l-8 transition-all hover:translate-x-2",
                          res.score_predit < 60 && "ring-1 ring-rose-500/20 bg-rose-500/[0.02]"
                        )}
                        style={{ borderLeftColor: res.couleur }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-8">
                            <div className="text-4xl font-black w-24" style={{ color: res.couleur }}>
                              {res.score_predit.toFixed(1)}
                            </div>
                            <div className="space-y-1">
                              <div className="text-[10px] font-black uppercase text-foreground/40">{t('batch.student')} #{idx + 1}</div>
                              <div className="px-3 py-1 rounded-lg text-[10px] font-black text-white text-center" style={{ backgroundColor: res.couleur }}>
                                {res.categorie}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            {res.recommandation && (
                              <div className="bg-secondary/30 p-4 rounded-2xl text-sm text-foreground/70 italic border border-border/50 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                <strong>{t('batch.advice')} :</strong> {res.recommandation}
                              </div>
                            )}
                            <div className="flex justify-end">
                              <button 
                                onClick={() => handleDiscussStudent(res)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                              >
                                <MessageSquare size={14} />
                                Discuter ce cas avec l'IA
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
          </>
        )}

        {/* Global Inconsistency Warning Toast */}
        <AnimatePresence>
          {formWarning && !isGamified && (
            <motion.div
              initial={{ opacity: 0, x: -50, y: 50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -50, y: 50 }}
              className={cn(
                "fixed bottom-8 left-8 p-4 rounded-2xl border-2 flex items-start gap-4 transition-all z-[9999] shadow-2xl max-w-sm backdrop-blur-xl",
                formWarning.type === 'impossible' 
                  ? "bg-red-500/90 border-red-500 text-white" 
                  : "bg-amber-500/90 border-amber-500 text-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl shrink-0 bg-white/20"
              )}>
                {formWarning.type === 'impossible' ? <AlertTriangle size={20} /> : <Zap size={20} />}
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-white">Alerte IA</p>
                <p className="text-sm font-bold text-white">{formWarning.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <footer className="mt-24 py-16 border-t border-border bg-card/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="bg-foreground p-2 rounded-xl text-background"><GraduationCap size={20} /></div>
            <span className="text-xl font-bold tracking-tight">LearnDiag</span>
          </div>
          <p className="text-foreground/40 text-sm text-center font-medium">
            © {new Date().getFullYear()} LearnDiag. Tous droits réservés.
          </p>
          <div className="flex justify-end gap-4">
            {[TrendingUp, BrainCircuit, ShieldCheck, Target].map((Icon, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground/30 hover:bg-primary hover:text-white transition-all cursor-pointer">
                <Icon size={18} />
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Error Toast Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-8 right-8 md:left-auto md:w-96 z-[100]"
          >
            <div className="p-4 bg-red-500 text-white rounded-2xl shadow-2xl shadow-red-500/40 flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl"><AlertCircle /></div>
              <div className="flex-1">
                <div className="text-xs font-black uppercase opacity-70">{t('error.server')}</div>
                <div className="font-bold text-sm">{error}</div>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden AI Audio Player */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Assistant Chat IA */}
      {token && (
        <ChatAssistant 
          key={chatKey}
          strategyContext={chatContext || prediction?.recommandation} 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onOpen={() => setIsChatOpen(true)}
        />
      )}
    </div>
  );
};

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'Excellent': return '#639922';
    case 'Bien': return '#1D9E75';
    case 'Moyen': return '#378ADD';
    case 'Insuffisant': return '#EF9F27';
    case 'En difficulté': return '#E24B4A';
    default: return '#94a3b8';
  }
};

export default App;
