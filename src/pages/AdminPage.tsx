import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookText, 
  Plus, 
  Save, 
  Trash2, 
  Edit, 
  ChevronRight, 
  LogOut,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  orderBy,
  increment
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { cn } from '../lib/utils';
import { fetchWordDetails } from '../services/geminiService';

// --- Types ---
interface GrammarTopic {
  id: string;
  title: string;
  level: string;
  description: string;
  content?: string;
  isPro: boolean;
  count: number;
}

interface GrammarQuestion {
  id: string;
  topicId: string;
  type: 'multiple-choice' | 'reorder' | 'translation';
  word: string; // For multiple-choice: the prompt. For reorder: the full correct sentence. For translation: the source sentence.
  options?: string[]; // For multiple-choice: [A, B, C, D]. For reorder: [word1, word2, ...].
  correctAnswer: string; // For multiple-choice: A/B/C/D. For reorder: the full correct sentence. For translation: correct answers separated by '|'.
  explanation?: string;
}

interface VocabularyTopic {
  id: string;
  title: string;
  level: string;
  wordCount: number;
  image: string;
  description: string;
  isPro?: boolean;
  isNew30?: boolean;
}

interface VocabularyWord {
  id: string;
  topicId: string;
  word: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

// --- Components ---
const AdminPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocabulary' | 'reading'>('grammar');
  const [activeSubTab, setActiveSubTab] = useState<'topics' | 'words' | 'questions'>('topics');
  const [selectedTopic, setSelectedTopic] = useState<VocabularyTopic | null>(null);
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<GrammarTopic | null>(null);
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopic[]>([]);
  const [grammarQuestions, setGrammarQuestions] = useState<GrammarQuestion[]>([]);
  const [vocabTopics, setVocabTopics] = useState<VocabularyTopic[]>([]);
  const [readingTopics, setReadingTopics] = useState<any[]>([]);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Check if admin (phamhathang393@gmail.com is default admin)
        if (u.email === 'phamhathang393@gmail.com') {
          setIsAdmin(true);
          // Sync user to Firestore
          await setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role: 'admin'
          }, { merge: true });
        } else {
          // Check role from Firestore
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data fetching
  useEffect(() => {
    if (!isAdmin) return;

    const unsubGrammar = onSnapshot(
      query(collection(db, 'grammar_topics'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setGrammarTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrammarTopic)));
      },
      (error) => {
        console.error("Grammar topics snapshot failed", error);
        setMessage({ type: 'error', text: 'Lỗi tải dữ liệu ngữ pháp: ' + error.message });
      }
    );

    const unsubVocab = onSnapshot(
      query(collection(db, 'vocabulary_topics'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setVocabTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VocabularyTopic)));
      },
      (error) => {
        console.error("Vocab topics snapshot failed", error);
        setMessage({ type: 'error', text: 'Lỗi tải dữ liệu bộ từ vựng: ' + error.message });
      }
    );

    const unsubReading = onSnapshot(
      query(collection(db, 'reading_topics'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setReadingTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Reading topics snapshot failed", error);
        setMessage({ type: 'error', text: 'Lỗi tải dữ liệu bài đọc: ' + error.message });
      }
    );

    return () => {
      unsubGrammar();
      unsubVocab();
      unsubReading();
    };
  }, [isAdmin]);

  // Fetch words or questions when topic changes
  useEffect(() => {
    if (!isAdmin) return;
    
    let unsubscribe: () => void = () => {};

    if (activeTab === 'vocabulary' && activeSubTab === 'words' && selectedTopic) {
      unsubscribe = onSnapshot(
        query(collection(db, 'vocabulary_words'), where('topicId', '==', selectedTopic.id), orderBy('createdAt', 'asc')),
        (snapshot) => {
          setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VocabularyWord)));
        }
      );
    } else if (activeTab === 'grammar' && activeSubTab === 'questions' && selectedGrammarTopic) {
      unsubscribe = onSnapshot(
        query(collection(db, 'grammar_questions'), where('topicId', '==', selectedGrammarTopic.id), orderBy('createdAt', 'asc')),
        (snapshot) => {
          setGrammarQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrammarQuestion)));
        }
      );
    }

    return () => unsubscribe();
  }, [isAdmin, activeTab, activeSubTab, selectedTopic, selectedGrammarTopic]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      setMessage({ type: 'error', text: 'Đăng nhập thất bại' });
    }
  };

  const handleLogout = () => signOut(auth);

  const insertMarkdown = (tag: string, type: 'wrap' | 'prefix' = 'wrap') => {
    const textarea = document.getElementById('grammar-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content || '';
    const selectedText = text.substring(start, end);
    
    let newText = '';
    if (type === 'wrap') {
      newText = text.substring(0, start) + tag + selectedText + tag + text.substring(end);
    } else {
      newText = text.substring(0, start) + tag + selectedText + text.substring(end);
    }
    
    setFormData({ ...formData, content: newText });
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, end + tag.length);
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    let collectionName = '';
    if (activeTab === 'grammar') {
      collectionName = activeSubTab === 'topics' ? 'grammar_topics' : 'grammar_questions';
    } else if (activeTab === 'reading') {
      collectionName = 'reading_topics';
    } else {
      collectionName = activeSubTab === 'topics' ? 'vocabulary_topics' : 'vocabulary_words';
    }
    
    try {
      const { id, ...cleanData } = formData;
      
      if (activeTab === 'grammar' && activeSubTab === 'questions') {
        cleanData.type = cleanData.type || 'multiple-choice';
      }
      
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        setMessage({ type: 'success', text: 'Cập nhật thành công' });
      } else {
        const dataToSave = {
          ...cleanData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (activeTab === 'grammar' && activeSubTab === 'topics') {
          dataToSave.count = 0;
          dataToSave.isPro = formData.isPro || false;
        } else if (activeTab === 'grammar' && activeSubTab === 'questions') {
          if (!selectedGrammarTopic) throw new Error("Chưa chọn chủ điểm ngữ pháp");
          dataToSave.topicId = selectedGrammarTopic.id;
        } else if (activeSubTab === 'topics') {
          dataToSave.wordCount = 0;
          dataToSave.isPro = formData.isPro || false;
        } else {
          if (!selectedTopic) throw new Error("Chưa chọn bộ từ vựng");
          dataToSave.topicId = selectedTopic.id;
        }

        await addDoc(collection(db, collectionName), dataToSave);
        
        // Update counts
        if (activeTab === 'vocabulary' && activeSubTab === 'words' && selectedTopic) {
          await updateDoc(doc(db, 'vocabulary_topics', selectedTopic.id), {
            wordCount: increment(1)
          });
        } else if (activeTab === 'grammar' && activeSubTab === 'questions' && selectedGrammarTopic) {
          await updateDoc(doc(db, 'grammar_topics', selectedGrammarTopic.id), {
            count: increment(1)
          });
        }

        setMessage({ type: 'success', text: 'Thêm mới thành công' });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
    } catch (error: any) {
      console.error("Save failed", error);
      setMessage({ type: 'error', text: 'Lưu thất bại: ' + (error.message || 'Lỗi không xác định') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    let collectionName = '';
    if (activeTab === 'grammar') {
      collectionName = activeSubTab === 'topics' ? 'grammar_topics' : 'grammar_questions';
    } else if (activeTab === 'reading') {
      collectionName = 'reading_topics';
    } else {
      collectionName = activeSubTab === 'topics' ? 'vocabulary_topics' : 'vocabulary_words';
    }

    try {
      await deleteDoc(doc(db, collectionName, id));
      
      // Update counts
      if (activeTab === 'vocabulary' && activeSubTab === 'words' && selectedTopic) {
        await updateDoc(doc(db, 'vocabulary_topics', selectedTopic.id), {
          wordCount: increment(-1)
        });
      } else if (activeTab === 'grammar' && activeSubTab === 'questions' && selectedGrammarTopic) {
        await updateDoc(doc(db, 'grammar_topics', selectedGrammarTopic.id), {
          count: increment(-1)
        });
      }

      setMessage({ type: 'success', text: 'Xóa thành công' });
    } catch (error) {
      console.error("Delete failed", error);
      setMessage({ type: 'error', text: 'Xóa thất bại' });
    }
  };

  const handleFetchDetails = async () => {
    if (!formData.word) return;
    setIsFetchingDetails(true);
    try {
      const details = await fetchWordDetails(formData.word);
      setFormData({
        ...formData,
        ...details
      });
      setMessage({ type: 'success', text: 'Đã tự động điền thông tin!' });
    } catch (error) {
      console.error("Fetch details failed", error);
      setMessage({ type: 'error', text: 'Không thể lấy thông tin tự động' });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-hsk-primary/10 rounded-full flex items-center justify-center mx-auto text-hsk-primary">
            <LayoutDashboard size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500">Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
          >
            Đăng nhập với Google
          </button>
          {!isAdmin && user && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              Tài khoản của bạn không có quyền Admin.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-hsk-primary font-black text-xl">
            <LayoutDashboard size={24} />
            <span>HSK ADMIN</span>
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => {
              setActiveTab('grammar');
              setActiveSubTab('topics');
              setSelectedGrammarTopic(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'grammar' ? "bg-hsk-primary text-white" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BookText size={18} />
            Ngữ pháp
          </button>
          <button 
            onClick={() => {
              setActiveTab('vocabulary');
              setActiveSubTab('topics');
              setSelectedTopic(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'vocabulary' ? "bg-hsk-primary text-white" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BookOpen size={18} />
            Từ vựng
          </button>
          <button 
            onClick={() => {
              setActiveTab('reading');
              setActiveSubTab('topics');
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'reading' ? "bg-hsk-primary text-white" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BookText size={18} />
            Bài đọc
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full" />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{user.displayName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {((activeTab === 'vocabulary' && activeSubTab === 'words') || (activeTab === 'grammar' && activeSubTab === 'questions')) && (
                <button 
                  onClick={() => {
                    setActiveSubTab('topics');
                    setSelectedTopic(null);
                    setSelectedGrammarTopic(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {activeTab === 'grammar' ? (activeSubTab === 'topics' ? 'Quản lý Ngữ pháp' : `Bài tập: ${selectedGrammarTopic?.title}`) : 
                   activeTab === 'reading' ? 'Quản lý Bài đọc' :
                   activeSubTab === 'topics' ? 'Quản lý Bộ từ vựng' : `Từ vựng: ${selectedTopic?.title}`}
                </h1>
                <p className="text-slate-500 text-sm">
                  {activeTab === 'grammar' ? (activeSubTab === 'topics' ? 'Thêm, sửa hoặc xóa các chủ điểm học tập.' : 'Thêm bài tập cho chủ điểm này.') :
                   activeTab === 'reading' ? 'Quản lý các bài luyện đọc.' :
                   activeSubTab === 'topics' ? 'Quản lý các bộ từ vựng theo chủ đề.' : 'Thêm từ vựng vào bộ này.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditingItem(null);
                setFormData({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
            >
              <Plus size={20} />
              Thêm mới
            </button>
          </div>

          {message && (
            <div className={cn(
              "mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold uppercase">Đóng</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'grammar' && activeSubTab === 'topics' || activeTab === 'vocabulary' && activeSubTab === 'topics' || activeTab === 'reading' ? 'Tiêu đề' : 'Câu hỏi / Từ vựng'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'grammar' && activeSubTab === 'topics' || activeTab === 'vocabulary' && activeSubTab === 'topics' || activeTab === 'reading' ? 'Cấp độ' : 'Đáp án / Phiên âm'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'grammar' && activeSubTab === 'topics' || activeTab === 'vocabulary' && activeSubTab === 'topics' || activeTab === 'reading' ? 'Mô tả' : 'Giải thích / Nghĩa'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(activeTab === 'grammar' ? (activeSubTab === 'topics' ? grammarTopics : grammarQuestions) : activeTab === 'reading' ? readingTopics : activeSubTab === 'topics' ? vocabTopics : words).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.title || item.word}</div>
                      {(activeTab === 'grammar' && activeSubTab === 'topics' || activeTab === 'vocabulary' && activeSubTab === 'topics' || activeTab === 'reading') && item.isPro && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">PRO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === 'grammar' && activeSubTab === 'topics' || activeTab === 'vocabulary' && activeSubTab === 'topics' || activeTab === 'reading' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-hsk-primary bg-sky-50 px-2 py-1 rounded uppercase">
                            {item.level}
                          </span>
                          {item.isNew30 && (
                            <span className="text-[8px] font-black text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                              New 3.0
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600 font-bold">{item.correctAnswer || item.correct || item.pinyin}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{item.explanation || item.description || item.meaning}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === 'grammar' && activeSubTab === 'topics' && (
                          <button 
                            onClick={() => {
                              setSelectedGrammarTopic(item);
                              setActiveSubTab('questions');
                            }}
                            className="p-2 text-slate-400 hover:text-hsk-primary hover:bg-sky-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                          >
                            <BookOpen size={18} />
                            Bài tập
                          </button>
                        )}
                        {activeTab === 'vocabulary' && activeSubTab === 'topics' && (
                          <button 
                            onClick={() => {
                              setSelectedTopic(item);
                              setActiveSubTab('words');
                            }}
                            className="p-2 text-slate-400 hover:text-hsk-primary hover:bg-sky-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                          >
                            <BookOpen size={18} />
                            Từ vựng
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingItem(item);
                            setFormData(item);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-hsk-primary hover:bg-sky-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(activeTab === 'grammar' ? grammarTopics : activeTab === 'reading' ? readingTopics : activeSubTab === 'topics' ? vocabTopics : words).length === 0 && (
              <div className="py-20 text-center text-slate-400">
                Chưa có dữ liệu. Hãy nhấn "Thêm mới" để bắt đầu.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 'grammar' ? 'Ngữ pháp' : activeTab === 'reading' ? 'Bài đọc' : activeSubTab === 'topics' ? 'Bộ từ vựng' : 'Từ vựng'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {activeTab === 'grammar' || activeSubTab === 'topics' || activeTab === 'reading' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title || ''}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cấp độ</label>
                      <select 
                        value={formData.level || 'HSK 1'}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                      >
                        {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Chủ đề giao tiếp'].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    {(activeTab === 'grammar' || activeSubTab === 'topics' || activeTab === 'reading') && (
                      <div className="flex flex-col gap-2 pt-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="isPro"
                            checked={formData.isPro || false}
                            onChange={(e) => setFormData({...formData, isPro: e.target.checked})}
                            className="w-4 h-4 text-hsk-primary rounded focus:ring-hsk-primary"
                          />
                          <label htmlFor="isPro" className="text-sm font-bold text-slate-700">Gói PRO</label>
                        </div>
                        {activeTab === 'vocabulary' && activeSubTab === 'topics' && formData.level?.startsWith('HSK') && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="isNew30"
                              checked={formData.isNew30 || false}
                              onChange={(e) => setFormData({...formData, isNew30: e.target.checked})}
                              className="w-4 h-4 text-hsk-primary rounded focus:ring-hsk-primary"
                            />
                            <label htmlFor="isNew30" className="text-sm font-bold text-slate-700">New 3.0</label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
                    <textarea 
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                    />
                  </div>

                  {activeTab === 'grammar' && activeSubTab === 'questions' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Loại câu hỏi</label>
                        <select 
                          value={formData.type || 'multiple-choice'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                        >
                          <option value="multiple-choice">Trắc nghiệm</option>
                          <option value="reorder">Sắp xếp câu</option>
                          <option value="translation">Dịch câu</option>
                        </select>
                      </div>

                      {formData.type === 'translation' ? (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Câu gốc cần dịch</label>
                            <input 
                              required
                              type="text" 
                              value={formData.word || ''}
                              onChange={(e) => setFormData({...formData, word: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                              placeholder="Ví dụ: Tôi đi đến trường."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Các đáp án đúng (Cách nhau bằng dấu |)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.correctAnswer || ''}
                              onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                              placeholder="Ví dụ: 我去学校|我到学校去"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Học viên nhập đúng 1 trong các đáp án này sẽ được tính điểm.</p>
                          </div>
                        </>
                      ) : formData.type === 'reorder' ? (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Câu hoàn chỉnh (Ví dụ: 我去学校。)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.correctAnswer || ''}
                              onChange={(e) => setFormData({...formData, correctAnswer: e.target.value, word: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                              placeholder="Nhập câu đúng hoàn chỉnh"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Các từ/cụm từ (Cách nhau bằng dấu phẩy)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.options?.join(', ') || ''}
                              onChange={(e) => setFormData({...formData, options: e.target.value.split(',').map(s => s.trim()).filter(s => s)}) }
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                              placeholder="Ví dụ: 我, 去, 学校, 。"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Học viên sẽ thấy các từ này bị xáo trộn để sắp xếp lại.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Câu hỏi (Ví dụ: 我___去学校。)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.word || ''}
                              onChange={(e) => setFormData({...formData, word: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                              placeholder="Sử dụng ___ để biểu thị chỗ trống"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {['A', 'B', 'C', 'D'].map((opt, idx) => (
                              <div key={opt}>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Đáp án {opt}</label>
                                <input 
                                  required
                                  type="text" 
                                  value={formData.options?.[idx] || ''}
                                  onChange={(e) => {
                                    const newOptions = [...(formData.options || ['', '', '', ''])];
                                    newOptions[idx] = e.target.value;
                                    setFormData({...formData, options: newOptions});
                                  }}
                                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Đáp án đúng (A/B/C/D)</label>
                            <select 
                              required
                              value={formData.correctAnswer || 'A'}
                              onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Giải thích</label>
                        <input 
                          type="text" 
                          value={formData.explanation || ''}
                          onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'grammar' && activeSubTab === 'topics' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700">Nội dung bài học (Markdown)</label>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('**')}
                            className="p-1.5 hover:bg-white rounded text-xs font-bold text-slate-600 transition-colors"
                            title="Bold"
                          >
                            B
                          </button>
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('*')}
                            className="p-1.5 hover:bg-white rounded text-xs italic text-slate-600 transition-colors"
                            title="Italic"
                          >
                            I
                          </button>
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('### ', 'prefix')}
                            className="p-1.5 hover:bg-white rounded text-xs font-bold text-slate-600 transition-colors"
                            title="Heading"
                          >
                            H
                          </button>
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('- ', 'prefix')}
                            className="p-1.5 hover:bg-white rounded text-xs font-bold text-slate-600 transition-colors"
                            title="List"
                          >
                            •
                          </button>
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('`')}
                            className="p-1.5 hover:bg-white rounded text-xs font-mono text-slate-600 transition-colors"
                            title="Code"
                          >
                            &lt;&gt;
                          </button>
                          <button 
                            type="button"
                            onClick={() => insertMarkdown('> ', 'prefix')}
                            className="p-1.5 hover:bg-white rounded text-xs font-bold text-slate-600 transition-colors"
                            title="Quote"
                          >
                            "
                          </button>
                        </div>
                      </div>
                      <textarea 
                        id="grammar-content"
                        rows={20}
                        value={formData.content || ''}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary font-mono text-sm leading-relaxed"
                        placeholder="Nhập nội dung bài học bằng Markdown..."
                      />
                      <p className="text-[10px] text-slate-400 italic">Mẹo: Sử dụng Markdown để định dạng bài viết (Tiêu đề, danh sách, in đậm...)</p>
                    </div>
                  )}

                  {activeTab === 'vocabulary' && activeSubTab === 'topics' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Số lượng từ</label>
                      <input 
                        type="number" 
                        value={formData.wordCount || 0}
                        onChange={(e) => setFormData({...formData, wordCount: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                      />
                    </div>
                  )}

                  {(activeTab === 'vocabulary' || activeTab === 'reading') && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Link ảnh (URL)</label>
                      <input 
                        type="text" 
                        value={formData.image || ''}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                      />
                    </div>
                  )}

                  {activeTab === 'reading' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tác giả</label>
                          <input 
                            type="text" 
                            value={formData.author || ''}
                            onChange={(e) => setFormData({...formData, author: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Thời gian đọc (phút)</label>
                          <input 
                            type="text" 
                            value={formData.time || ''}
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Thể loại</label>
                        <input 
                          type="text" 
                          value={formData.category || ''}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                          placeholder="Ví dụ: Đời sống, Văn hóa..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung bài đọc (Markdown)</label>
                        <textarea 
                          rows={10}
                          value={formData.content || ''}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary font-mono text-sm"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Từ tiếng Trung</label>
                    <div className="flex gap-2">
                      <input 
                        required
                        type="text" 
                        value={formData.word || ''}
                        onChange={(e) => setFormData({...formData, word: e.target.value})}
                        onBlur={() => {
                          if (formData.word && !formData.meaning) {
                            handleFetchDetails();
                          }
                        }}
                        className="flex-grow px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary"
                        placeholder="Ví dụ: 你好"
                      />
                      <button 
                        type="button"
                        onClick={handleFetchDetails}
                        disabled={isFetchingDetails || !formData.word}
                        className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isFetchingDetails ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        Tự động
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Phiên âm (Pinyin)</label>
                      <div className="relative">
                        <input 
                          required
                          type="text" 
                          value={formData.pinyin || ''}
                          onChange={(e) => setFormData({...formData, pinyin: e.target.value})}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary",
                            isFetchingDetails && "opacity-50"
                          )}
                          placeholder={isFetchingDetails ? "Đang lấy..." : ""}
                        />
                        {isFetchingDetails && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-400" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nghĩa tiếng Việt</label>
                      <div className="relative">
                        <input 
                          required
                          type="text" 
                          value={formData.meaning || ''}
                          onChange={(e) => setFormData({...formData, meaning: e.target.value})}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary",
                            isFetchingDetails && "opacity-50"
                          )}
                          placeholder={isFetchingDetails ? "Đang lấy..." : ""}
                        />
                        {isFetchingDetails && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ví dụ (Tiếng Trung)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.example || ''}
                        onChange={(e) => setFormData({...formData, example: e.target.value})}
                        className={cn(
                          "w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary",
                          isFetchingDetails && "opacity-50"
                        )}
                        placeholder={isFetchingDetails ? "Đang lấy..." : ""}
                      />
                      {isFetchingDetails && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-400" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nghĩa của ví dụ</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.exampleMeaning || ''}
                        onChange={(e) => setFormData({...formData, exampleMeaning: e.target.value})}
                        className={cn(
                          "w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-hsk-primary",
                          isFetchingDetails && "opacity-50"
                        )}
                        placeholder={isFetchingDetails ? "Đang lấy..." : ""}
                      />
                      {isFetchingDetails && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-400" />}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-grow py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isFetchingDetails || isSaving}
                  className="flex-grow py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Đang lưu...' : isFetchingDetails ? 'Đang lấy dữ liệu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
