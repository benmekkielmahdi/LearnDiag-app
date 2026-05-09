import React, { useState } from 'react';
import { predictionService } from '../api/predictionService';
import { Mail, Lock, User, ArrowRight, Loader2, BrainCircuit, Eye, EyeOff, GraduationCap, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (data: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'eleve' | 'enseignant'>('eleve');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const data = await predictionService.login({
          email: formData.email,
          password: formData.password
        });
        onLogin(data);
      } else {
        await predictionService.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: role
        });
        const data = await predictionService.login({
          email: formData.email,
          password: formData.password
        });
        onLogin(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('error.server'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_70%)]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="glass-card p-8 md:p-12 shadow-2xl border-white/10">
          <div className="text-center space-y-2 mb-10">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="inline-flex p-5 bg-gradient-to-br from-primary to-indigo-600 rounded-[2rem] text-white shadow-xl shadow-primary/20 mb-4"
            >
              <BrainCircuit size={48} />
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black tracking-tighter gradient-text">
                Learn Diag
              </h1>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-20 mb-4"></div>
              <h2 className="text-2xl font-bold dark:text-white">
                {isLogin ? t('button.login') : t('button.register')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('auth.full_name')}</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                        className="input-field pl-12 h-14" placeholder={t('auth.full_name')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('auth.email')}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="input-field pl-12 h-14" placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t('auth.password')}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" required value={formData.password} onChange={handleChange}
                  className="input-field pl-12 pr-12 h-14" placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-14 shadow-xl shadow-primary/20 group"
            >
              <span className="text-lg font-black">{loading ? <Loader2 className="animate-spin" /> : isLogin ? t('button.login') : t('button.register')}</span>
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center pt-8">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-primary font-bold text-sm transition-all"
            >
              {isLogin ? (
                <>{t('auth.no_account')} <span className="text-primary underline-offset-4 hover:underline">{t('button.register')}</span></>
              ) : (
                <>{t('auth.has_account')} <span className="text-primary underline-offset-4 hover:underline">{t('button.login')}</span></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;
