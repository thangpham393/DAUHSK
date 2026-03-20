import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, BarChart2, User, Users, Eye, Play, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VocabularyProgress from '../components/VocabularyProgress';
import MyVocabulary from '../components/MyVocabulary';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Topic {
  id: string;
  title: string;
  count: number;
  level: string;
  isPro?: boolean;
  isNew30?: boolean;
}

const TOP_TABS = [
  { id: 'study', label: 'Học', icon: <BookOpen size={18} /> },
  { id: 'progress', label: 'Tiến độ', icon: <BarChart2 size={18} /> },
  { id: 'my-vocab', label: 'Từ vựng của tôi', icon: <User size={18} /> },
  { id: 'community', label: 'Cộng đồng', icon: <Users size={18} /> },
];

const VOCAB_CATEGORIES = [
  { id: 'hsk1', label: 'HSK 1', isNew30: false },
  { id: 'hsk2', label: 'HSK 2', isNew30: false },
  { id: 'hsk3', label: 'HSK 3', isNew30: false },
  { id: 'hsk4', label: 'HSK 4', isNew30: false },
  { id: 'hsk5', label: 'HSK 5', isNew30: false },
  { id: 'hsk6', label: 'HSK 6', isNew30: false },
  { id: 'hsk1-new', label: 'HSK 1', isNew30: true },
  { id: 'hsk2-new', label: 'HSK 2', isNew30: true },
  { id: 'hsk3-new', label: 'HSK 3', isNew30: true },
  { id: 'hsk4-new', label: 'HSK 4', isNew30: true },
  { id: 'hsk5-new', label: 'HSK 5', isNew30: true },
  { id: 'hsk6-new', label: 'HSK 6', isNew30: true },
  { id: 'communication', label: 'Chủ đề giao tiếp', isNew30: false },
];

export default function VocabularyPage() {
  const [activeTopTab, setActiveTopTab] = useState('study');
  const [activeLevel, setActiveLevel] = useState('hsk1');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'vocabulary_topics'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setTopics(topicsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching topics:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTopics = topics.filter(topic => {
    const category = VOCAB_CATEGORIES.find(l => l.id === activeLevel);
    return (
      topic.level === category?.label &&
      (category?.isNew30 ? topic.isNew30 === true : !topic.isNew30) &&
      topic.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTopTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
                activeTopTab === tab.id
                  ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-100"
                  : "bg-white text-slate-500 border-slate-100 hover:border-sky-200 hover:text-sky-500"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTopTab === 'study' && (
          <div className="animate-in fade-in duration-500">
            {/* Title Section */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl mb-3">
                Chinh phục <span className="text-hsk-primary">Từ vựng HSK</span>
              </h1>
              <p className="text-slate-500">
                Học từ vựng theo phương pháp lặp lại ngắt quãng (Spaced Repetition)
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-10 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm bộ từ vựng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
              />
            </div>

            {/* Level Tabs */}
            <div className="space-y-8 mb-10 border-b border-slate-100 pb-6">
              {/* Standard & Communication */}
              <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                {VOCAB_CATEGORIES.filter(c => !c.isNew30).map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setActiveLevel(level.id)}
                    className={cn(
                      "px-4 md:px-6 py-2 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeLevel === level.id
                        ? "text-sky-500"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {level.label}
                    {activeLevel === level.id && (
                      <div className="absolute bottom-[-25px] left-0 right-0 h-1 bg-sky-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* New 3.0 Group */}
              <div className="flex flex-wrap justify-center gap-1 md:gap-2 pt-4 border-t border-slate-50">
                <div className="w-full text-center mb-1">
                  <span className="text-[9px] font-black text-sky-400/60 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-sky-100"></span>
                    HSK New 3.0
                    <span className="h-px w-8 bg-sky-100"></span>
                  </span>
                </div>
                {VOCAB_CATEGORIES.filter(c => c.isNew30).map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setActiveLevel(level.id)}
                    className={cn(
                      "px-4 md:px-6 py-2 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeLevel === level.id
                        ? "text-sky-500"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {level.label}
                    <span className="text-[8px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shrink-0">
                      3.0
                    </span>
                    {activeLevel === level.id && (
                      <div className="absolute bottom-[-25px] left-0 right-0 h-1 bg-sky-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-hsk-primary animate-spin mb-4" />
                <p className="text-slate-500">Đang tải dữ liệu...</p>
              </div>
            ) : filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic, index) => (
                  <div
                    key={topic.id || index}
                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-sky-100 hover:shadow-xl hover:shadow-slate-100 transition-all relative group"
                  >
                    {topic.isPro && (
                      <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        PRO
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-500 bg-sky-50 px-2 py-1 rounded uppercase tracking-wider">
                          {topic.level}
                        </span>
                        {topic.isNew30 && (
                          <span className="text-[8px] font-black text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                            New 3.0
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mt-2 text-slate-800">{topic.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{topic.wordCount || 0} từ vựng</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button 
                        onClick={() => navigate(`/tu-vung/${topic.id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                      >
                        <Eye size={16} />
                        Xem nhanh
                      </button>
                      <button 
                        onClick={() => navigate(`/tu-vung/${topic.id}/luyen-tap`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-sky-500 text-sky-500 rounded-xl text-sm font-bold hover:bg-sky-50 transition-colors"
                      >
                        <Play size={16} className="fill-current" />
                        Luyện tập
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400">Không tìm thấy bộ từ vựng nào phù hợp.</p>
              </div>
            )}
          </div>
        )}

        {activeTopTab === 'progress' && (
          <VocabularyProgress />
        )}

        {activeTopTab === 'my-vocab' && (
          <MyVocabulary />
        )}

        {activeTopTab === 'community' && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Users size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cộng đồng</h2>
            <p className="text-slate-500">Khám phá các bộ từ vựng được chia sẻ bởi cộng đồng.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
