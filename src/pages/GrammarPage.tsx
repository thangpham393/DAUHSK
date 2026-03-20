import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, BarChart2, User, Users, Eye, Play, BookText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface GrammarTopic {
  id: string;
  title: string;
  count: number;
  level: string;
  description: string;
  isPro?: boolean;
}

const TOP_TABS = [
  { id: 'study', label: 'Học', icon: <BookOpen size={18} /> },
  { id: 'progress', label: 'Tiến độ', icon: <BarChart2 size={18} /> },
  { id: 'my-grammar', label: 'Ngữ pháp của tôi', icon: <User size={18} /> },
  { id: 'community', label: 'Cộng đồng', icon: <Users size={18} /> },
];

const HSK_LEVELS = [
  { id: 'hsk1', label: 'HSK 1' },
  { id: 'hsk2', label: 'HSK 2' },
  { id: 'hsk3', label: 'HSK 3' },
  { id: 'hsk4', label: 'HSK 4' },
  { id: 'hsk5', label: 'HSK 5' },
  { id: 'hsk6', label: 'HSK 6' },
];

export default function GrammarPage() {
  const [activeTopTab, setActiveTopTab] = useState('study');
  const [activeLevel, setActiveLevel] = useState('hsk1');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'grammar_topics'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GrammarTopic[];
      setTopics(topicsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching grammar topics:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTopics = topics.filter(topic => 
    topic.level === HSK_LEVELS.find(l => l.id === activeLevel)?.label &&
    (topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                  ? "bg-hsk-primary text-white border-hsk-primary shadow-lg shadow-sky-100"
                  : "bg-white text-slate-500 border-slate-100 hover:border-sky-200 hover:text-hsk-primary"
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
              <h1 className="text-3xl md:text-4xl mb-3 font-display font-bold">
                Chinh phục <span className="text-hsk-primary">Ngữ pháp HSK</span>
              </h1>
              <p className="text-slate-500">
                Hệ thống kiến thức ngữ pháp từ cơ bản đến nâng cao
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-10 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm chủ điểm ngữ pháp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary transition-all shadow-sm"
              />
            </div>

            {/* Level Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-10 border-b border-slate-100 pb-4">
              {HSK_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setActiveLevel(level.id)}
                  className={cn(
                    "px-6 py-2 text-sm font-bold transition-all relative",
                    activeLevel === level.id
                      ? "text-hsk-primary"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {level.label}
                  {activeLevel === level.id && (
                    <div className="absolute bottom-[-17px] left-0 right-0 h-1 bg-hsk-primary rounded-full"></div>
                  )}
                </button>
              ))}
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
                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-sky-100 hover:shadow-xl hover:shadow-slate-100 transition-all relative group flex flex-col"
                  >
                    {topic.isPro && (
                      <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        PRO
                      </div>
                    )}
                    
                    <div className="mb-4 flex-grow">
                      <span className="text-[10px] font-bold text-hsk-primary bg-sky-50 px-2 py-1 rounded uppercase tracking-wider">
                        {topic.level}
                      </span>
                      <h3 className="text-xl font-bold mt-2 text-slate-800">{topic.title}</h3>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-slate-400 text-xs">
                        <BookText size={14} />
                        <span>{topic.count || 0} cấu trúc/ví dụ</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button 
                        onClick={() => navigate(`/ngu-phap/${topic.id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                      >
                        <Eye size={16} />
                        Học lý thuyết
                      </button>
                      <button 
                        onClick={() => navigate(`/ngu-phap/${topic.id}/luyen-tap`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-hsk-primary text-hsk-primary rounded-xl text-sm font-bold hover:bg-sky-50 transition-colors"
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
                <p className="text-slate-400">Không tìm thấy chủ điểm ngữ pháp nào phù hợp.</p>
              </div>
            )}
          </div>
        )}

        {activeTopTab === 'progress' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-hsk-primary">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">Đã học</h3>
                </div>
                <div className="text-3xl font-bold text-slate-900">12/150</div>
                <p className="text-slate-400 text-sm mt-1">Chủ điểm ngữ pháp</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <Play size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">Luyện tập</h3>
                </div>
                <div className="text-3xl font-bold text-slate-900">45</div>
                <p className="text-slate-400 text-sm mt-1">Bài tập đã hoàn thành</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <BarChart2 size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">Độ chính xác</h3>
                </div>
                <div className="text-3xl font-bold text-slate-900">85%</div>
                <p className="text-slate-400 text-sm mt-1">Tỉ lệ trả lời đúng</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <BarChart2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Biểu đồ tiến độ</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Hãy tiếp tục học và luyện tập để xem biểu đồ phân tích chi tiết về kiến thức ngữ pháp của bạn.
              </p>
            </div>
          </div>
        )}

        {activeTopTab === 'my-grammar' && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <User size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ngữ pháp của tôi</h2>
            <p className="text-slate-500">Bạn chưa lưu chủ điểm ngữ pháp nào.</p>
          </div>
        )}

        {activeTopTab === 'community' && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Users size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cộng đồng</h2>
            <p className="text-slate-500">Khám phá các bài tổng hợp ngữ pháp từ cộng đồng.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
