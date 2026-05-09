import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User, Save, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { predictionService } from '../api/predictionService';

interface ProfileProps {
  onBack: () => void;
  userFullName: string | null;
  initialData?: any;
}

const Profile: React.FC<ProfileProps> = ({ onBack, userFullName, initialData }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [parentEmail, setParentEmail] = useState<string>('');
  
  const [formData, setFormData] = useState<any>(initialData || {
    Hours_Studied: 10,
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await predictionService.getProfile();
      setProfile(data);
      if (data.parent_email) {
        setParentEmail(data.parent_email);
      }
      if (data.profile_data && Object.keys(data.profile_data).length > 0) {
        setFormData(data.profile_data);
      }
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await predictionService.updateProfile({ 
        profile_data: formData,
        parent_email: parentEmail ? parentEmail : null
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const renderField = (key: string, label: string, type: 'number' | 'select', options?: string[]) => (
    <div key={key} className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-foreground/40">{label}</label>
      {type === 'select' ? (
        <select
          name={key}
          value={formData[key]}
          onChange={handleInputChange}
          className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none appearance-none"
        >
          {options?.map(opt => (
            <option key={opt} value={opt}>{t(`options.${opt}`)}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          name={key}
          value={formData[key]}
          onChange={handleInputChange}
          className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none"
        />
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-24"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest">
          <ArrowLeft size={16} /> {t('nav.home')}
        </button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-black">{userFullName}</div>
            <div className="text-[10px] font-bold text-foreground/40 uppercase">{profile?.email}</div>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <User size={24} />
          </div>
        </div>
      </div>

      <div className="glass-card p-12 space-y-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">{t('profile.title')}</h2>
          <p className="text-foreground/60 font-medium leading-relaxed">
            {t('profile.description')}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-12">
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{t('profile.parent_contact')}</h3>
            <p className="text-sm text-foreground/60">{t('profile.parent_desc')}</p>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">{t('profile.parent_email')}</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="Ex: parent@email.com"
                className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none"
              />
            </div>
          </div>
          <hr className="border-border" />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Groupes de variables */}
            {renderField('Hours_Studied', t('fields.Hours_Studied'), 'number')}
            {renderField('Attendance', t('fields.Attendance'), 'number')}
            {renderField('Sleep_Hours', t('fields.Sleep_Hours'), 'number')}
            {renderField('Previous_Scores', t('fields.Previous_Scores'), 'number')}
            {renderField('Tutoring_Sessions', t('fields.Tutoring_Sessions'), 'number')}
            {renderField('Physical_Activity', t('fields.Physical_Activity'), 'number')}
            
            {renderField('Parental_Involvement', t('fields.Parental_Involvement'), 'select', ['Low', 'Medium', 'High'])}
            {renderField('Access_to_Resources', t('fields.Access_to_Resources'), 'select', ['Low', 'Medium', 'High'])}
            {renderField('Extracurricular_Activities', t('fields.Extracurricular_Activities'), 'select', ['Yes', 'No'])}
            {renderField('Motivation_Level', t('fields.Motivation_Level'), 'select', ['Low', 'Medium', 'High'])}
            {renderField('Internet_Access', t('fields.Internet_Access'), 'select', ['Yes', 'No'])}
            {renderField('Family_Income', t('fields.Family_Income'), 'select', ['Low', 'Medium', 'High'])}
            {renderField('Teacher_Quality', t('fields.Teacher_Quality'), 'select', ['Low', 'Medium', 'High'])}
            {renderField('School_Type', t('fields.School_Type'), 'select', ['Public', 'Private'])}
            {renderField('Peer_Influence', t('fields.Peer_Influence'), 'select', ['Positive', 'Neutral', 'Negative'])}
            {renderField('Learning_Disabilities', t('fields.Learning_Disabilities'), 'select', ['Yes', 'No'])}
            {renderField('Parental_Education_Level', t('fields.Parental_Education_Level'), 'select', ['High School', 'College', 'Postgraduate'])}
            {renderField('Distance_from_Home', t('fields.Distance_from_Home'), 'select', ['Near', 'Moderate', 'Far'])}
            {renderField('Gender', t('fields.Gender'), 'select', ['Male', 'Female'])}
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary w-full py-6 text-lg"
          >
            {saving ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 /> : <Save />}
            {saving ? t('profile.saving') : success ? t('profile.saved') : t('profile.update_btn')}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Profile;
