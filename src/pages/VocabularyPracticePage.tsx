import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RotateCcw, 
  Keyboard, 
  CheckCircle2, 
  Gamepad2,
  Volume2,
  Settings,
  AlertCircle,
  Check,
  Lightbulb,
  ChevronRight,
  Zap,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, serverTimestamp, increment, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

type PracticeTab = 'flashcard' | 'typing' | 'quiz';

export default function VocabularyPracticePage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PracticeTab>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [learnedCount, setLearnedCount] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Typing state
  const [userInput, setUserInput] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  
  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!topicId) return;

    const path = 'vocabulary_words';
    const q = query(
      collection(db, path),
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
      setWords(wordsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [topicId]);

  const currentWord = words[currentIndex];

  // Quiz options generator
  const quizOptions = useMemo(() => {
    if (!currentWord || words.length < 2) return [];
    const correct = currentWord.meaning;
    const others = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, [currentIndex, words, currentWord]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch learned count for this topic
  useEffect(() => {
    if (!user || !topicId) return;

    const path = 'user_vocabulary_progress';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      where('topicId', '==', topicId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLearnedCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user, topicId]);

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserInput('');
      setTypingFeedback('none');
      setSelectedOption(null);
      setQuizFeedback('none');
    } else {
      setIsFinished(true);
    }
  };

  const handleFlashcardRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!user || !currentWord || !topicId || isSaving) return;

    const wordIdToSave = currentWord.id;
    handleNext();

    setIsSaving(true);
    const progressId = `${user.uid}_${wordIdToSave}`;
    const progressRef = doc(db, 'user_vocabulary_progress', progressId);

    // Simple SRS logic: calculate next review time
    let daysToAdd = 0;
    if (rating === 'hard') daysToAdd = 1;
    if (rating === 'good') daysToAdd = 3;
    if (rating === 'easy') daysToAdd = 7;

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);

    try {
      await setDoc(progressRef, {
        userId: user.uid,
        wordId: wordIdToSave,
        topicId: topicId,
        rating,
        lastStudiedAt: serverTimestamp(),
        nextReviewAt: nextReviewAt,
        repetitionCount: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'user_vocabulary_progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckTyping = () => {
    if (!currentWord) return;
    if (userInput.trim() === currentWord.word) {
      setTypingFeedback('correct');
      setTimeout(handleNext, 1000);
    } else {
      setTypingFeedback('wrong');
      setTimeout(() => setTypingFeedback('none'), 1000);
    }
  };

  const handleQuizSelect = (option: string, index: number) => {
    if (quizFeedback !== 'none' || !currentWord) return;
    setSelectedOption(index);
    if (option === currentWord.meaning) {
      setQuizFeedback('correct');
      setTimeout(handleNext, 1000);
    } else {
      setQuizFeedback('wrong');
      setTimeout(() => {
        setQuizFeedback('none');
        setSelectedOption(null);
      }, 1000);
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/30">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <UserIcon size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-slate-500 mb-8 text-center max-w-md">
            Bạn cần đăng nhập để lưu tiến độ học tập và sử dụng các tính năng luyện tập.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all"
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/30">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-8"
          >
            <CheckCircle2 size={48} />
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Hoàn thành!</h2>
          <p className="text-slate-500 mb-10 max-w-md">
            Chúc mừng bạn đã hoàn thành bộ từ vựng này. Hãy tiếp tục ôn tập để ghi nhớ lâu hơn nhé!
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
              }}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Học lại từ đầu
            </button>
            <button 
              onClick={() => navigate('/tu-vung')}
              className="px-8 py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
            >
              Chọn bộ từ khác
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/30">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa có từ vựng</h2>
          <p className="text-slate-500 mb-8">Bộ từ vựng này hiện chưa có dữ liệu để luyện tập.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all"
          >
            Quay lại
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Header />
      
      {/* Sub-header with Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('flashcard')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'flashcard' ? "bg-sky-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <RotateCcw size={16} />
              Flashcard
            </button>
            <button
              onClick={() => setActiveTab('typing')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'typing' ? "bg-sky-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Keyboard size={16} />
              Gõ từ
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'quiz' ? "bg-sky-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <CheckCircle2 size={16} />
              Trắc nghiệm
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-sm font-bold">
            <span className="text-amber-500 flex items-center gap-1">
              <Zap size={16} className="fill-current" />
              +0
            </span>
            <span>{currentIndex + 1}/{words.length} từ</span>
          </div>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {activeTab === 'flashcard' && (
              <motion.div
                key={`flashcard-${currentIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="relative perspective-1000"
              >
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={cn(
                    "w-full min-h-[400px] bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center p-10 cursor-pointer transition-all duration-500 transform-style-3d relative",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                >
                  {/* Card Front */}
                  <div className={cn("flex flex-col items-center backface-hidden", isFlipped ? "hidden" : "flex")}>
                    <div className="absolute top-6 right-8 flex gap-3 text-slate-300">
                      <Check size={20} />
                      <Settings size={20} />
                      <AlertCircle size={20} />
                    </div>
                    
                    <h2 className="text-5xl font-bold text-slate-900 mb-4">{currentWord?.word}</h2>
                    <div className="flex flex-col gap-2 mb-10">
                      <div className="flex items-center gap-2 text-sky-500">
                        <Volume2 size={20} />
                        <span className="font-medium">/{currentWord?.pinyin}/</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm">Nhấn để xem nghĩa</p>
                  </div>

                  {/* Card Back */}
                  <div className={cn("flex flex-col items-center backface-hidden rotate-y-180 w-full", isFlipped ? "flex" : "hidden")}>
                    <div className="absolute top-6 right-8 flex gap-3 text-slate-300">
                      <Check size={20} />
                      <Settings size={20} />
                      <AlertCircle size={20} />
                    </div>

                    <h3 className="text-3xl font-bold text-slate-800 mb-8 text-center">{currentWord?.meaning}</h3>
                    
                    {currentWord?.example && (
                      <div className="w-full bg-slate-50 p-6 rounded-2xl mb-10">
                        <p className="text-slate-700 font-medium text-center mb-2">"{currentWord.example}"</p>
                        {currentWord.exampleMeaning && (
                          <p className="text-slate-400 text-sm text-center italic">({currentWord.exampleMeaning})</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-3 w-full">
                      <button 
                        disabled={isSaving}
                        onClick={(e) => { e.stopPropagation(); handleFlashcardRating('again'); }}
                        className="flex flex-col items-center gap-1 p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-colors disabled:opacity-50"
                      >
                        <span className="font-bold text-sm">Học lại</span>
                        <span className="text-[10px] opacity-80">1m</span>
                      </button>
                      <button 
                        disabled={isSaving}
                        onClick={(e) => { e.stopPropagation(); handleFlashcardRating('hard'); }}
                        className="flex flex-col items-center gap-1 p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        <span className="font-bold text-sm">Khó</span>
                        <span className="text-[10px] opacity-80">6h</span>
                      </button>
                      <button 
                        disabled={isSaving}
                        onClick={(e) => { e.stopPropagation(); handleFlashcardRating('good'); }}
                        className="flex flex-col items-center gap-1 p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <span className="font-bold text-sm">Tốt</span>
                        <span className="text-[10px] opacity-80">1d</span>
                      </button>
                      <button 
                        disabled={isSaving}
                        onClick={(e) => { e.stopPropagation(); handleFlashcardRating('easy'); }}
                        className="flex flex-col items-center gap-1 p-3 bg-sky-500 text-white rounded-2xl hover:bg-sky-600 transition-colors disabled:opacity-50"
                      >
                        <span className="font-bold text-sm">Dễ</span>
                        <span className="text-[10px] opacity-80">3d</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'typing' && (
              <motion.div
                key={`typing-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 flex flex-col items-center"
              >
                <div className="absolute top-6 right-8 flex gap-3 text-slate-300">
                  <Check size={20} />
                  <Settings size={20} />
                  <AlertCircle size={20} />
                </div>

                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider mb-4">
                  Từ vựng
                </span>
                <h2 className="text-4xl font-bold text-slate-800 mb-10 text-center">{currentWord?.meaning}</h2>

                <div className="w-full max-w-md space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Gõ từ tiếng Trung..."
                      className={cn(
                        "w-full px-6 py-4 bg-slate-50 border rounded-2xl text-center text-xl font-bold transition-all focus:outline-none focus:ring-4",
                        typingFeedback === 'correct' ? "border-emerald-500 ring-emerald-100 text-emerald-600" : 
                        typingFeedback === 'wrong' ? "border-rose-500 ring-rose-100 text-rose-600 animate-shake" :
                        "border-slate-100 focus:border-sky-500 focus:ring-sky-100"
                      )}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckTyping()}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                      <Lightbulb size={24} />
                    </button>
                    <button 
                      onClick={handleCheckTyping}
                      className="flex-grow py-4 bg-sky-300 text-white rounded-2xl font-bold text-lg hover:bg-sky-400 transition-colors shadow-lg shadow-sky-100"
                    >
                      Kiểm tra
                    </button>
                  </div>
                </div>

                <p className="mt-8 text-slate-400 text-sm">Enter để kiểm tra</p>
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div
                key={`quiz-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 flex flex-col items-center"
              >
                <div className="absolute top-6 right-8 flex gap-3 text-slate-300">
                  <Check size={20} />
                  <Settings size={20} />
                  <AlertCircle size={20} />
                </div>

                <h2 className="text-5xl font-bold text-slate-900 mb-4">{currentWord?.word}</h2>
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex items-center gap-2 text-sky-500">
                    <Volume2 size={20} />
                    <span className="font-medium">/{currentWord?.pinyin}/</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  {quizOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizSelect(option, idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left font-bold transition-all flex items-center gap-4 group",
                        selectedOption === idx 
                          ? (quizFeedback === 'correct' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-rose-50 border-rose-500 text-rose-700")
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:border-sky-500 hover:bg-white"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
                        selectedOption === idx
                          ? (quizFeedback === 'correct' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")
                          : "bg-white text-slate-400 group-hover:bg-sky-500 group-hover:text-white"
                      )}>
                        {idx + 1}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Footer */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-8 text-sm font-bold">
              <span className="text-sky-500">{words.length} Từ mới</span>
              <span className="text-indigo-500">{learnedCount} Đã học</span>
              <span className="text-rose-500">0 Ôn tập</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-sky-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
