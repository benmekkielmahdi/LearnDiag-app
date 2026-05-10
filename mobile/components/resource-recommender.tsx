import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
  {
    id: 'mot1',
    title: "The Power of Belief (Growth Mindset)",
    description: "Comment ton état d'esprit influence ta capacité à apprendre.",
    url: "https://www.youtube.com/watch?v=pN34FNbOKXc",
    type: 'video',
    category: 'Motivation_Level',
    thumbnail: "https://img.youtube.com/vi/pN34FNbOKXc/maxresdefault.jpg"
  },
  {
    id: 'mot2',
    title: "Inside the Mind of a Procrastinator",
    description: "Le talk le plus célèbre au monde sur la procrastination.",
    url: "https://www.youtube.com/watch?v=arj7oStGLkU",
    type: 'video',
    category: 'Motivation_Level',
    thumbnail: "https://img.youtube.com/vi/arj7oStGLkU/maxresdefault.jpg"
  },
  {
    id: 'study1',
    title: "How to Study Effectively",
    description: "Les meilleures techniques pour mémoriser durablement.",
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
  {
    id: 'stress1',
    title: "How to Make Stress Your Friend",
    description: "Changer ta vision du stress pour mieux réussir.",
    url: "https://www.youtube.com/watch?v=RcGyVTAoXEU",
    type: 'video',
    category: 'Learning_Disabilities',
    thumbnail: "https://img.youtube.com/vi/RcGyVTAoXEU/maxresdefault.jpg"
  },
  {
    id: 'phys1',
    title: "The Brain-Changing Benefits of Exercise",
    description: "Pourquoi faire du sport rend ton cerveau plus performant.",
    url: "https://www.youtube.com/watch?v=BHY0FxzoKZE",
    type: 'video',
    category: 'Physical_Activity',
    thumbnail: "https://img.youtube.com/vi/BHY0FxzoKZE/maxresdefault.jpg"
  },
  {
    id: 'parent1',
    title: "What Makes a Good Life?",
    description: "Leçons sur le bonheur et le soutien social.",
    url: "https://www.youtube.com/watch?v=8KkKuTCFvzI",
    type: 'video',
    category: 'Parental_Involvement',
    thumbnail: "https://img.youtube.com/vi/8KkKuTCFvzI/maxresdefault.jpg"
  }
];

interface Props {
  formData: any;
  isDark: boolean;
}

export function ResourceRecommender({ formData, isDark }: Props) {
  const recommendations: Resource[] = [];
  
  if (formData.Motivation_Level === 'Low') recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Motivation_Level'));
  if (formData.Hours_Studied < 10) recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Hours_Studied'));
  if (formData.Sleep_Hours < 7) recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Sleep_Hours'));
  if (formData.Learning_Disabilities === 'Yes') recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Learning_Disabilities'));
  if (formData.Physical_Activity < 2) recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Physical_Activity'));
  if (formData.Parental_Involvement === 'Low') recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Parental_Involvement'));

  if (recommendations.length === 0) recommendations.push(...ALL_RESOURCES.filter(r => r.category === 'Hours_Studied').slice(0, 2));

  const uniqueRecs = Array.from(new Set(recommendations)).slice(0, 4);

  const themeColors = {
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    accent: '#3b82f6'
  };

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: '#3b82f615' }]}>
          <Ionicons name="play-circle" size={24} color="#3b82f6" />
        </View>
        <View>
          <Text style={[styles.title, { color: themeColors.text }]}>LearnDiag Playlist</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>Recommandé pour vous</Text>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {uniqueRecs.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => openUrl(item.url)}
          >
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category.replace('_', ' ')}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardDesc, { color: themeColors.subText }]} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.footer}>
                <Text style={styles.actionText}>Regarder maintenant</Text>
                <Ionicons name="open-outline" size={14} color="#3b82f6" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  card: {
    width: width * 0.65,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    height: 140,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  cardContent: {
    padding: 15,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  actionText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
