import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, PlayCircle, BookOpen, Heart, Zap, Moon, Users, Activity, AlertCircle } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'article' | 'exercise';
  category: string;
  thumbnail: string;
}

const ALL_RESOURCES: Resource[] = [
  // MOTIVATION
  {
    id: 'mot1',
    title: "The Power of Belief (Growth Mindset)",
    description: "Comment ton état d'esprit influence radicalement ta capacité à apprendre.",
    url: "https://www.youtube.com/watch?v=pN34FNbOKXc",
    type: 'video',
    category: 'Motivation_Level',
    thumbnail: "https://img.youtube.com/vi/pN34FNbOKXc/maxresdefault.jpg"
  },
  {
    id: 'mot2',
    title: "Inside the Mind of a Procrastinator",
    description: "Le talk le plus célèbre au monde sur la procrastination (TED).",
    url: "https://www.youtube.com/watch?v=arj7oStGLkU",
    type: 'video',
    category: 'Motivation_Level',
    thumbnail: "https://img.youtube.com/vi/arj7oStGLkU/maxresdefault.jpg"
  },
  // STUDY METHODS
  {
    id: 'study1',
    title: "How to Study Effectively",
    description: "Les meilleures techniques pour mémoriser durablement tes cours.",
    url: "https://www.youtube.com/watch?v=TjPFZaMe2yw",
    type: 'video',
    category: 'Hours_Studied',
    thumbnail: "https://img.youtube.com/vi/TjPFZaMe2yw/maxresdefault.jpg"
  },
  {
    id: 'study2',
    title: "The Learning Process",
    description: "Comprendre comment ton cerveau apprend pour mieux réviser.",
    url: "https://www.youtube.com/watch?v=9_iVv9L6p5c",
    type: 'video',
    category: 'Hours_Studied',
    thumbnail: "https://img.youtube.com/vi/9_iVv9L6p5c/maxresdefault.jpg"
  },
  // SLEEP
  {
    id: 'sleep1',
    title: "What Happens if You Don't Sleep?",
    description: "L'impact crucial du sommeil sur ton cerveau et ta mémoire.",
    url: "https://www.youtube.com/watch?v=3eLfn7Ewx_s",
    type: 'video',
    category: 'Sleep_Hours',
    thumbnail: "https://img.youtube.com/vi/3eLfn7Ewx_s/maxresdefault.jpg"
  },
  {
    id: 'sleep2',
    title: "Sleep is Your Superpower",
    description: "Comment le sommeil peut transformer tes résultats scolaires.",
    url: "https://www.youtube.com/watch?v=5MuNiZYcp_M",
    type: 'video',
    category: 'Sleep_Hours',
    thumbnail: "https://img.youtube.com/vi/5MuNiZYcp_M/maxresdefault.jpg"
  },
  // STRESS / LEARNING DIFFICULTIES
  {
    id: 'stress1',
    title: "How to Make Stress Your Friend",
    description: "Changer ta vision du stress pour mieux réussir tes examens.",
    url: "https://www.youtube.com/watch?v=RcGyVTAoXEU",
    type: 'video',
    category: 'Learning_Disabilities',
    thumbnail: "https://img.youtube.com/vi/RcGyVTAoXEU/maxresdefault.jpg"
  },
  // PHYSICAL ACTIVITY
  {
    id: 'phys1',
    title: "The Brain-Changing Benefits of Exercise",
    description: "Pourquoi faire du sport rend ton cerveau plus performant.",
    url: "https://www.youtube.com/watch?v=BHY0FxzoKZE",
    type: 'video',
    category: 'Physical_Activity',
    thumbnail: "https://img.youtube.com/vi/BHY0FxzoKZE/maxresdefault.jpg"
  },
  // PARENTAL INVOLVEMENT
  {
    id: 'parent1',
    title: "What Makes a Good Life?",
    description: "Les leçons de la plus longue étude scientifique sur le bonheur et le soutien.",
    url: "https://www.youtube.com/watch?v=8KkKuTCFvzI",
    type: 'video',
    category: 'Parental_Involvement',
    thumbnail: "https://img.youtube.com/vi/8KkKuTCFvzI/maxresdefault.jpg"
  }
];

interface ResourceRecommenderProps {
  formData: any;
  prediction: any;
}

export const ResourceRecommender: React.FC<ResourceRecommenderProps> = ({ formData, prediction }) => {
  // Logic to find weak areas
  const recommendations: Resource[] = [];
  
  // 1. Motivation Check
  if (formData.Motivation_Level === 'Low') {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Motivation_Level'));
  }
  
  // 2. Study Time Check
  if (formData.Hours_Studied < 10) {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Hours_Studied'));
  }
  
  // 3. Sleep Check
  if (formData.Sleep_Hours < 7) {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Sleep_Hours'));
  }
  
  // 4. Peer Influence Check
  if (formData.Peer_Influence === 'Negative') {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Peer_Influence'));
  }

  // 5. Stress / Difficulties Check
  if (formData.Learning_Disabilities === 'Yes') {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Learning_Disabilities'));
  }

  // 6. Physical Activity Check
  if (formData.Physical_Activity < 2) { // Moins de 2h par semaine
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Physical_Activity'));
  }

  // 7. Parental Involvement Check
  if (formData.Parental_Involvement === 'Low') {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Parental_Involvement'));
  }

  // Fallback if everything is fine (Show study tips anyway)
  if (recommendations.length === 0) {
    recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Hours_Studied').slice(0, 2));
  }

  // Limit to 4 unique resources
  const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 4);

  return (
    <div className="mt-20 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <PlayCircle size={28} />
            </div>
            <h2 className="text-3xl font-black dark:text-white tracking-tight">LearnDiag Playlist</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Basé sur tes résultats, voici une sélection de ressources pour booster ton potentiel académique.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            Recommandé pour toi
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {uniqueRecommendations.map((resource, idx) => (
          <motion.a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
            className="group relative flex flex-col bg-white dark:bg-white/5 rounded-3xl overflow-hidden border border-slate-100 dark:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
          >
            {/* Image Section */}
            <div className="relative h-44 overflow-hidden">
              <img 
                src={resource.thumbnail} 
                alt={resource.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out grayscale-[20%] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <PlayCircle size={32} className="text-white fill-white/20" />
                </div>
              </div>

              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                  {resource.type}
                </span>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-md w-fit">
                  {resource.category === 'Motivation_Level' && <Zap size={10} />}
                  {resource.category === 'Sleep_Hours' && <Moon size={10} />}
                  {resource.category === 'Hours_Studied' && <BookOpen size={10} />}
                  {resource.category === 'Peer_Influence' && <Users size={10} />}
                  {resource.category === 'Learning_Disabilities' && <AlertCircle size={10} />}
                  {resource.category === 'Physical_Activity' && <Activity size={10} />}
                  {resource.category === 'Parental_Involvement' && <Heart size={10} />}
                  {resource.category.replace('_', ' ')}
                </div>
                <h3 className="font-black text-base dark:text-white leading-tight group-hover:text-indigo-500 transition-colors duration-300">
                  {resource.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {resource.description}
                </p>
              </div>
              
              <div className="pt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 mt-auto">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">Regarder maintenant</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <ExternalLink size={14} />
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};
