import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, School, Users, BookOpen, Music, Moon, Award, Zap, Wifi, 
  Presentation, Wallet, GraduationCap, Building2, HandMetal, 
  Activity, BrainCircuit, Scroll, MapPin, User, ArrowRight, ArrowLeft, Sparkles, Check,
  AlertTriangle, Lightbulb
} from 'lucide-react';

interface GamifiedSurveyProps {
  onComplete: (data: any) => void;
  initialData: any;
}

const steps = [
  { id: 'Hours_Studied', question: "Combien d'heures étudies-tu par semaine ?", icon: <Clock size={40} />, type: 'number', min: 0, max: 100 },
  { id: 'Attendance', question: "Quel est ton taux de présence en classe (%) ?", icon: <School size={40} />, type: 'number', min: 0, max: 100 },
  { id: 'Parental_Involvement', question: "Comment décrirais-tu l'implication de tes parents ?", icon: <Users size={40} />, type: 'select', options: [
    { label: 'Un peu (Faible)', value: 'Low' },
    { label: 'Normalement (Moyen)', value: 'Medium' },
    { label: 'Beaucoup (Élevé)', value: 'High' }
  ]},
  { id: 'Access_to_Resources', question: "As-tu facilement accès à des ressources (livres, PC...) ?", icon: <BookOpen size={40} />, type: 'select', options: [
    { label: 'Pas trop', value: 'Low' },
    { label: 'Normalement', value: 'Medium' },
    { label: 'Très facilement', value: 'High' }
  ]},
  { id: 'Extracurricular_Activities', question: "Fais-tu des activités extrascolaires ?", icon: <Music size={40} />, type: 'select', options: [
    { label: 'Oui, j\'en fais', value: 'Yes' },
    { label: 'Non, pas encore', value: 'No' }
  ]},
  { id: 'Sleep_Hours', question: "Combien d'heures dors-tu par nuit ?", icon: <Moon size={40} />, type: 'number', min: 0, max: 24 },
  { id: 'Previous_Scores', question: "Ta moyenne générale approximative (sur 100) ?", icon: <Award size={40} />, type: 'number', min: 0, max: 100 },
  { id: 'Motivation_Level', question: "Quel est ton niveau de motivation ?", icon: <Zap size={40} />, type: 'select', options: [
    { label: 'Un peu fatigué(e)', value: 'Low' },
    { label: 'Motivé(e)', value: 'Medium' },
    { label: 'Super motivé(e) !', value: 'High' }
  ]},
  { id: 'Internet_Access', question: "As-tu Internet chez toi ?", icon: <Wifi size={40} />, type: 'select', options: [
    { label: 'Oui', value: 'Yes' },
    { label: 'Non', value: 'No' }
  ]},
  { id: 'Tutoring_Sessions', question: "Combien de cours de soutien par mois ?", icon: <Presentation size={40} />, type: 'number', min: 0, max: 30 },
  { id: 'Family_Income', question: "Comment situerais-tu les revenus du foyer ?", icon: <Wallet size={40} />, type: 'select', options: [
    { label: 'Plutôt bas', value: 'Low' },
    { label: 'Moyen', value: 'Medium' },
    { label: 'Plutôt élevés', value: 'High' }
  ]},
  { id: 'Teacher_Quality', question: "Es-tu satisfait(e) de tes professeurs ?", icon: <GraduationCap size={40} />, type: 'select', options: [
    { label: 'Pas vraiment', value: 'Low' },
    { label: 'Ça va', value: 'Medium' },
    { label: 'Oui, très !', value: 'High' }
  ]},
  { id: 'School_Type', question: "Ton école est-elle...", icon: <Building2 size={40} />, type: 'select', options: [
    { label: 'Publique', value: 'Public' },
    { label: 'Privée', value: 'Private' }
  ]},
  { id: 'Peer_Influence', question: "Tes amis t'aident-ils à progresser ?", icon: <HandMetal size={40} />, type: 'select', options: [
    { label: 'Ils me distraient', value: 'Negative' },
    { label: 'Pas vraiment d\'influence', value: 'Neutral' },
    { label: 'Ils m\'encouragent beaucoup', value: 'Positive' }
  ]},
  { id: 'Physical_Activity', question: "Heures de sport par semaine ?", icon: <Activity size={40} />, type: 'number', min: 0, max: 50 },
  { id: 'Learning_Disabilities', question: "As-tu des difficultés d'apprentissage ?", icon: <BrainCircuit size={40} />, type: 'select', options: [
    { label: 'Oui', value: 'Yes' },
    { label: 'Non', value: 'No' }
  ]},
  { id: 'Parental_Education_Level', question: "Niveau d'études de tes parents ?", icon: <Scroll size={40} />, type: 'select', options: [
    { label: 'Lycée', value: 'High School' },
    { label: 'Université', value: 'College' },
    { label: 'Master / Doctorat', value: 'Postgraduate' }
  ]},
  { id: 'Distance_from_Home', question: "Habites-tu loin de l'école ?", icon: <MapPin size={40} />, type: 'select', options: [
    { label: 'C\'est tout près (Near)', value: 'Near' },
    { label: 'Distance moyenne (Moderate)', value: 'Moderate' },
    { label: 'Oui, c\'est loin (Far)', value: 'Far' }
  ]},
  { id: 'Gender', question: "Tu es...", icon: <User size={40} />, type: 'select', options: [
    { label: 'Un garçon', value: 'Male' },
    { label: 'Une fille', value: 'Female' }
  ]},
];

export const GamifiedSurvey: React.FC<GamifiedSurveyProps> = ({ onComplete, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const [warning, setWarning] = useState<{ type: 'impossible' | 'suspicious', message: string } | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
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
    if (sleep < 3) return { type: 'impossible', message: "Attention ! Moins de 3h de sommeil ? Ton cerveau a besoin de plus de repos." };
    if (sleep > 15) return { type: 'suspicious', message: "Beaucoup de sommeil ! Es-tu sûr d'avoir encore du temps pour étudier ?" };

    // Rule 3: Study Hours (Weekly)
    if (study > 80) return { type: 'impossible', message: "Plus de 80h d'étude ? Attention au surmenage et à l'épuisement profond." };

    // Rule 4: Physical Activity
    if (physical > 30) return { type: 'suspicious', message: "Plus de 30h de sport par semaine ? Tu t'entraînes pour les Jeux Olympiques ?" };

    // Rule 5: Tutoring Sessions
    if (tutoring > 20) return { type: 'suspicious', message: "Beaucoup de cours de soutien ! N'oublie pas de travailler en autonomie." };

    // Rule 6: Total Weekly Time Check
    const totalWeekly = (sleep * 7) + study + physical;
    if (totalWeekly > 168) {
      return { type: 'impossible', message: "Oups ! La somme de tes heures dépasse les 168h d'une semaine." };
    }

    // Rule 7: Logic Cross-Checks (IA Déductive)
    if (study === 0 && previous > 90) return { type: 'suspicious', message: "Aucune révision mais des notes excellentes ? Quel talent caché !" };
    if (attendance < 30 && previous > 80) return { type: 'suspicious', message: "Beaucoup d'absences mais de très bonnes notes. Es-tu sûr de tes chiffres ?" };

    return null;
  };

  const updateValue = (val: any) => {
    const newData = { ...formData, [step.id]: val };
    const inconsistency = validateInconsistency(newData);
    
    setWarning(inconsistency as any);
    setFormData(newData);
    
    if (step.type === 'select' && !inconsistency) {
      setTimeout(handleNext, 300); // Auto next for selection
    }
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-4">
      {/* Progress Bar */}
      <div className="w-full max-w-xl bg-slate-100 dark:bg-white/5 h-3 rounded-full mb-12 overflow-hidden border border-slate-200 dark:border-white/10">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          Étape {currentStep + 1} sur {steps.length}
        </span>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl text-center"
        >
          <div className="mb-6 flex justify-center text-primary animate-float">
            <div className="p-6 bg-primary/10 rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/10">
              {step.icon}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-10 dark:text-white leading-tight">
            {step.question}
          </h2>

          <div className="grid gap-4 max-w-md mx-auto">
            {step.type === 'select' ? (
              step.options?.map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => updateValue(opt.value)}
                  className={`group p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    formData[step.id] === opt.value 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-100 dark:border-white/5 hover:border-primary/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold text-lg">{opt.label}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData[step.id] === opt.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-white/10'
                  }`}>
                    {formData[step.id] === opt.value && <Check size={14} className="text-white" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="number"
                    value={formData[step.id]}
                    onChange={(e) => updateValue(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl p-6 text-3xl font-black text-center focus:border-primary outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {step.id === 'Attendance' ? '%' : 'valeur'}
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => updateValue(Math.max((step.min || 0), formData[step.id] - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold hover:bg-primary hover:text-white transition-all"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => updateValue(Math.min((step.max || 100), formData[step.id] + 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold hover:bg-primary hover:text-white transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Inconsistency Detector Warning */}
          <AnimatePresence>
            {warning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`mt-10 p-5 rounded-3xl border-2 flex items-start gap-4 transition-all shadow-lg text-left max-w-md mx-auto ${
                  warning.type === 'impossible' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                <div className={`p-2.5 rounded-2xl shrink-0 ${
                  warning.type === 'impossible' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                  {warning.type === 'impossible' ? <AlertTriangle size={24} /> : <Lightbulb size={24} />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                    Alerte Incohérence
                  </p>
                  <p className="text-sm font-bold leading-relaxed">
                    {warning.message}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="mt-16 flex items-center gap-6">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center gap-2 text-slate-400 hover:text-primary disabled:opacity-0 transition-all font-bold"
        >
          <ArrowLeft size={20} /> Retour
        </button>
        
        {step.type === 'number' && (
          <button
            onClick={handleNext}
            disabled={warning?.type === 'impossible'}
            className={`px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl transition-all flex items-center gap-3 ${
              warning?.type === 'impossible' 
                ? "opacity-50 grayscale cursor-not-allowed hover:scale-100 active:scale-100" 
                : "shadow-primary/30 hover:scale-105 active:scale-95"
            }`}
          >
            Continuer <ArrowRight size={20} />
          </button>
        )}
      </div>

      {/* Hero Image Background (Subtle) */}
      <div className="fixed bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none grayscale">
        <BrainCircuit size={256} />
      </div>
    </div>
  );
};
