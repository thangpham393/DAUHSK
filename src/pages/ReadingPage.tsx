import { useState, useEffect } from 'react';
import { Book, Search, Filter, ArrowRight, Star, Clock, User, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface ReadingTopic {
  id: string;
  title: string;
  level: string;
  category: string;
  author: string;
  time: string;
  rating?: number;
  image: string;
  description: string;
  content: string;
  isPro?: boolean;
}

export default function ReadingPage() {
  const [topics, setTopics] = useState<ReadingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState('Tất cả');
  const [selectedTopic, setSelectedTopic] = useState<ReadingTopic | null>(null);

  const [limitCount, setLimitCount] = useState(8);

  useEffect(() => {
    const q = query(
      collection(db, 'reading_topics'), 
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReadingTopic[];
      setTopics(topicsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reading topics:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  const filteredTopics = topics.filter(topic => 
    (activeLevel === 'Tất cả' || topic.level === activeLevel) &&
    (topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Luyện đọc tiếng Trung</h1>
                <p className="text-slate-500">Cải thiện kỹ năng đọc hiểu qua các bài báo, câu chuyện và tin tức.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm bài đọc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hsk-primary/20 focus:border-hsk-primary transition-all w-64"
                  />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Level Filter */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {['Tất cả', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((level) => (
                <button 
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeLevel === level 
                      ? 'bg-hsk-primary text-white shadow-lg shadow-sky-100' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-hsk-primary hover:text-hsk-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Reading Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-hsk-primary animate-spin mb-4" />
                <p className="text-slate-500">Đang tải dữ liệu...</p>
              </div>
            ) : filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredTopics.map((topic) => (
                  <div 
                    key={topic.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={topic.image || `https://picsum.photos/seed/${topic.id}/400/250`} 
                        alt={topic.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-hsk-primary uppercase">
                        {topic.level}
                      </div>
                      {topic.isPro && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-400 rounded-lg text-[10px] font-bold text-white uppercase shadow-sm">
                          PRO
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Book size={12} />
                        {topic.category || 'Chung'}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-1">{topic.title}</h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User size={14} />
                          {topic.author || 'Admin'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star size={14} fill="currentColor" />
                          {topic.rating || 5.0}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={14} />
                          {topic.time || '5'} phút
                        </div>
                        <button 
                          onClick={() => setSelectedTopic(topic)}
                          className="flex items-center gap-1 text-sm font-bold text-hsk-primary hover:gap-2 transition-all"
                        >
                          Đọc ngay
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400">Không tìm thấy bài đọc nào phù hợp.</p>
              </div>
            )}

            {/* Load More */}
            {!loading && filteredTopics.length >= limitCount && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setLimitCount(prev => prev + 8)}
                  className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Xem thêm bài đọc
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Reading Detail Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="relative h-64 shrink-0">
              <img 
                src={selectedTopic.image || `https://picsum.photos/seed/${selectedTopic.id}/800/400`} 
                alt={selectedTopic.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button 
                onClick={() => setSelectedTopic(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-hsk-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    {selectedTopic.level}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    {selectedTopic.category || 'Chung'}
                  </span>
                </div>
                <h2 className="text-3xl font-display font-bold text-white">{selectedTopic.title}</h2>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 md:p-12">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tác giả</div>
                    <div className="text-sm font-bold text-slate-800">{selectedTopic.author || 'Admin'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thời gian</div>
                    <div className="text-sm font-bold text-slate-800">{selectedTopic.time || '5'} phút</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <Star size={20} className="text-amber-500 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đánh giá</div>
                    <div className="text-sm font-bold text-slate-800">{selectedTopic.rating || 5.0}</div>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <div className="markdown-body">
                  <ReactMarkdown>{selectedTopic.content}</ReactMarkdown>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="px-8 py-3 bg-hsk-primary text-white rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
              >
                Hoàn thành bài đọc
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
