import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Layout, 
  Volume2, 
  ChevronDown,
  Book,
  Play,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

interface Topic {
  id: string;
  title: string;
  wordCount: number;
}

import { useAuth } from '../hooks/useAuth';

export default function VocabularyQuickViewPage() {
  const { user } = useAuth();
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;

    // Fetch topic details
    const fetchTopic = async () => {
      const topicDoc = await getDoc(doc(db, 'vocabulary_topics', topicId));
      if (topicDoc.exists()) {
        setTopic({ id: topicDoc.id, ...topicDoc.data() } as Topic);
      }
    };

    fetchTopic();

    // Fetch words
    const q = query(
      collection(db, 'vocabulary_words'),
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching words:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [topicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/30">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-hsk-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Header />
      
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Layout size={18} />
              {isSidebarOpen ? 'Ẩn sidebar' : 'Hiện sidebar'}
            </button>
          </div>
          <h2 className="font-bold text-slate-800">Xem nhanh</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/tu-vung/${topicId}/luyen-tap`)}
              className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-100"
            >
              <Play size={16} className="fill-current" />
              Luyện tập
            </button>
            <div className="w-4"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="flex-grow flex max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-80 border-r border-slate-100 bg-white p-6 hidden lg:block sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">{topic?.title}</h1>
              <p className="text-slate-400 text-sm">1 phần • {words.length} từ</p>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100">
                <Book size={18} />
                Words
                <span className="ml-auto text-xs opacity-80">{words.length} từ</span>
              </button>
              <button 
                onClick={() => navigate(`/tu-vung/${topicId}/luyen-tap`)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-sky-500 text-sky-500 rounded-xl font-bold text-sm hover:bg-sky-50 transition-colors"
              >
                <Play size={18} className="fill-current" />
                Luyện tập
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-grow p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            {!user && (
              <div className="mb-8 bg-sky-50 border border-sky-100 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-sm">
                    <Book size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">Đăng nhập để học hiệu quả hơn</h4>
                    <p className="text-sm text-slate-500">Lưu tiến trình học, đánh dấu từ vựng quan trọng và xem thống kê của bạn.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/login', { state: { from: { pathname: window.location.pathname } } })}
                  className="px-6 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800">
                Thuật ngữ trong học phần này ({words.length})
              </h3>
              <button className="flex items-center gap-1 text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors">
                Thứ tự gốc
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {words.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-10">
                    {/* Left side: Word & Pinyin */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-2xl font-bold text-slate-900">{item.word}</h4>
                        <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-all">
                          <Volume2 size={18} />
                        </button>
                      </div>
                      <p className="text-slate-400 font-medium">{item.pinyin}</p>
                    </div>

                    {/* Right side: Meaning */}
                    <div className="flex-[1.5]">
                      <p className="text-xl font-bold text-slate-800 mb-4">{item.meaning}</p>
                      
                      {item.example && (
                        <div className="space-y-2 pt-4 border-t border-slate-50">
                          <div className="flex gap-2">
                            <span className="text-sky-500 font-bold text-sm shrink-0">VD:</span>
                            <p className="text-slate-700 font-medium">{item.example}</p>
                          </div>
                          {item.exampleMeaning && (
                            <p className="text-slate-400 text-sm ml-8 italic">({item.exampleMeaning})</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {words.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400">Chưa có từ vựng nào trong bộ này.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
