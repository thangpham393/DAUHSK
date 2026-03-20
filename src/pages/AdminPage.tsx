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
  isPro: boolean;
  count: number;
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
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocabulary'>('grammar');
  const [activeSubTab, setActiveSubTab] = useState<'topics' | 'words'>('topics');
  const [selectedTopic, setSelectedTopic] = useState<VocabularyTopic | null>(null);
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopic[]>([]);
  const [vocabTopics, setVocabTopics] = useState<VocabularyTopic[]>([]);
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

    return () => {
      unsubGrammar();
      unsubVocab();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedTopic) {
      setWords([]);
      return;
    }

    const q = query(
      collection(db, 'vocabulary_words'),
      where('topicId', '==', selectedTopic.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VocabularyWord)));
      },
      (error) => {
        console.error("Vocabulary words snapshot failed", error);
        setMessage({ type: 'error', text: 'Lỗi tải danh sách từ vựng: ' + error.message });
      }
    );

    return () => unsubscribe();
  }, [selectedTopic]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    let collectionName = '';
    if (activeTab === 'grammar') {
      collectionName = 'grammar_topics';
    } else {
      collectionName = activeSubTab === 'topics' ? 'vocabulary_topics' : 'vocabulary_words';
    }
    
    try {
      const { id, ...cleanData } = formData;
      
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

        if (activeTab === 'grammar') {
          dataToSave.count = 0;
          dataToSave.isPro = formData.isPro || false;
        } else if (activeSubTab === 'topics') {
          dataToSave.wordCount = 0;
          dataToSave.isPro = formData.isPro || false;
        } else {
          if (!selectedTopic) throw new Error("Chưa chọn bộ từ vựng");
          dataToSave.topicId = selectedTopic.id;
        }

        await addDoc(collection(db, collectionName), dataToSave);
        
        // Update word count if adding a word
        if (activeTab === 'vocabulary' && activeSubTab === 'words' && selectedTopic) {
          await updateDoc(doc(db, 'vocabulary_topics', selectedTopic.id), {
            wordCount: increment(1)
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
      collectionName = 'grammar_topics';
    } else {
      collectionName = activeSubTab === 'topics' ? 'vocabulary_topics' : 'vocabulary_words';
    }

    try {
      await deleteDoc(doc(db, collectionName, id));
      
      // Update word count if deleting a word
      if (activeTab === 'vocabulary' && activeSubTab === 'words' && selectedTopic) {
        await updateDoc(doc(db, 'vocabulary_topics', selectedTopic.id), {
          wordCount: increment(-1)
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
            onClick={() => setActiveTab('grammar')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'grammar' ? "bg-hsk-primary text-white" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BookText size={18} />
            Ngữ pháp
          </button>
          <button 
            onClick={() => setActiveTab('vocabulary')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'vocabulary' ? "bg-hsk-primary text-white" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BookOpen size={18} />
            Từ vựng
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
              {activeTab === 'vocabulary' && activeSubTab === 'words' && (
                <button 
                  onClick={() => {
                    setActiveSubTab('topics');
                    setSelectedTopic(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {activeTab === 'grammar' ? 'Quản lý Ngữ pháp' : 
                   activeSubTab === 'topics' ? 'Quản lý Bộ từ vựng' : `Từ vựng: ${selectedTopic?.title}`}
                </h1>
                <p className="text-slate-500 text-sm">
                  {activeTab === 'grammar' ? 'Thêm, sửa hoặc xóa các chủ điểm học tập.' :
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
                    {activeTab === 'grammar' || activeSubTab === 'topics' ? 'Tiêu đề' : 'Từ vựng'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'grammar' || activeSubTab === 'topics' ? 'Cấp độ' : 'Phiên âm'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'grammar' || activeSubTab === 'topics' ? 'Mô tả' : 'Nghĩa'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(activeTab === 'grammar' ? grammarTopics : activeSubTab === 'topics' ? vocabTopics : words).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.title || item.word}</div>
                      {(activeTab === 'grammar' || activeSubTab === 'topics') && item.isPro && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">PRO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === 'grammar' || activeSubTab === 'topics' ? (
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
                        <span className="text-sm text-slate-600">{item.pinyin}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{item.description || item.meaning}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
            {(activeTab === 'grammar' ? grammarTopics : activeSubTab === 'topics' ? vocabTopics : words).length === 0 && (
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
                {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 'grammar' ? 'Ngữ pháp' : activeSubTab === 'topics' ? 'Bộ từ vựng' : 'Từ vựng'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {activeTab === 'grammar' || activeSubTab === 'topics' ? (
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
                    {(activeTab === 'grammar' || activeSubTab === 'topics') && (
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

                  {activeTab === 'vocabulary' && (
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
