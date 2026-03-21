import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronLeft, 
  PanelLeftClose, 
  PanelLeftOpen, 
  BookOpen, 
  Play, 
  Clock, 
  Zap, 
  AlertCircle, 
  Video, 
  Star, 
  StickyNote,
  ChevronRight,
  Keyboard,
  CheckCircle2,
  Lightbulb,
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  word: string; // This will be the source sentence to translate
  options?: string[];
  correctAnswer: string; // Can be multiple answers separated by '|'
  explanation?: string;
}

import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function GrammarDetailPage({ initialTab = 'lesson' }: { initialTab?: 'lesson' | 'practice' }) {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'lesson' | 'practice'>(initialTab);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch All Topics for Sidebar
        const topicsQuery = query(collection(db, 'grammar_topics'));
        const topicsSnap = await getDocs(topicsQuery);
        const fetchedTopics = topicsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GrammarTopic[];
        setTopics(fetchedTopics);

        if (!id) return;
        
        // Fetch Current Topic
        const docRef = doc(db, 'grammar_topics', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTopic({ id: docSnap.id, ...docSnap.data() } as GrammarTopic);
        }

        // Fetch Questions
        const q = query(collection(db, 'grammar_questions'), where('topicId', '==', id));
        const querySnapshot = await getDocs(q);
        const fetchedQuestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GrammarQuestion[];
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Error fetching grammar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerActive && !isFinished) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'practice' || isFinished) return;

      if (e.key === '1') handleAnswerSelect(currentQuestion, 'A');
      if (e.key === '2') handleAnswerSelect(currentQuestion, 'B');
      if (e.key === '3') handleAnswerSelect(currentQuestion, 'C');
      if (e.key === '4') handleAnswerSelect(currentQuestion, 'D');
      
      if (e.key === 'ArrowLeft' && currentQuestion > 1) {
        setCurrentQuestion(prev => prev - 1);
      }
      if (e.key === 'ArrowRight' && currentQuestion < questions.length) {
        setCurrentQuestion(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isFinished, currentQuestion]);

  const handleAnswerSelect = (questionId: number, answer: any) => {
    if (checkedQuestions[questionId]) return; // Prevent changing answer after checking
    
    const currentQ = questions[questionId - 1];
    if (!currentQ) return;

    // Safety: if it's a reorder question, answer must be an array
    if (currentQ.type === 'reorder' && !Array.isArray(answer)) return;
    // Safety: if it's a multiple-choice or translation question, answer must be a string
    if ((currentQ.type === 'multiple-choice' || currentQ.type === 'translation') && typeof answer !== 'string') return;

    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleCheckAnswer = (questionId: number) => {
    const answer = selectedAnswers[questionId];
    if (!answer) return;
    
    const currentQ = questions[questionId - 1];
    if (currentQ?.type === 'reorder' && Array.isArray(answer) && answer.length === 0) return;

    setCheckedQuestions(prev => ({ ...prev, [questionId]: true }));
  };

  const normalizeAnswer = (str: string) => {
    // Remove spaces, punctuation, and special characters
    // \p{L} matches any letter from any language (including Chinese characters)
    // \p{N} matches any kind of numeric character in any script
    return str.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  };

  const isCorrect = (questionId: number) => {
    const q = questions[questionId - 1];
    const answer = selectedAnswers[questionId];
    if (!q || !answer) return false;

    if (q.type === 'reorder' || q.type === 'translation') {
      const userAnswerNormalized = normalizeAnswer(Array.isArray(answer) ? answer.join('') : answer);
      
      // Split by '|' to support multiple correct answers
      const correctAnswers = q.correctAnswer.split('|').map(a => a.trim());
      
      return correctAnswers.some(correct => normalizeAnswer(correct) === userAnswerNormalized);
    } else {
      return answer === q.correctAnswer;
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((_, idx) => {
      if (isCorrect(idx + 1)) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleFinish = () => {
    setIsFinished(true);
    setIsTimerActive(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-hsk-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài học</h2>
          <button 
            onClick={() => navigate('/ngu-phap')}
            className="px-6 py-2 bg-hsk-primary text-white rounded-xl font-bold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {/* Sub-header / Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between sticky top-16 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            <span>{isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}</span>
          </button>
          <button 
            onClick={() => navigate('/ngu-phap')}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden flex-row">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-slate-100 transition-all duration-300 overflow-y-auto shrink-0",
          isSidebarOpen ? "w-80" : "w-0 opacity-0 pointer-events-none"
        )}>
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              {topic?.level ? `Ngữ pháp ${topic.level}` : "Kiến thức ngữ pháp"}
            </h2>
            <p className="text-slate-400 text-xs font-medium mb-6">
              {topics.filter(t => t.level === topic?.level).length} bài học • {topics.filter(t => t.level === topic?.level).reduce((acc, t) => acc + (t.count || 0), 0)} câu hỏi
            </p>
            
            <div className="space-y-2">
              {topics
                .filter(t => t.level === topic?.level)
                .map((lesson, i) => (
                <button 
                  key={lesson.id}
                  onClick={() => {
                    navigate(`/ngu-phap/${lesson.id}`);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                    lesson.id === id 
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-100" 
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                    lesson.id === id ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-500"
                  )}>
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm line-clamp-1">{lesson.title}</span>
                      {lesson.isPro === false && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase">FREE</span>}
                    </div>
                    <span className={cn(
                      "text-[10px]",
                      lesson.id === id ? "opacity-80" : "text-slate-400"
                    )}>{lesson.count || 0} câu hỏi</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {!user && (
              <div className="mb-6 bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sky-500 shadow-sm">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Đăng nhập để lưu tiến trình</h4>
                    <p className="text-xs text-slate-500">Lưu lại kết quả luyện tập và theo dõi lộ trình học của bạn.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/login', { state: { from: { pathname: window.location.pathname } } })}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl mb-8 w-fit mx-auto">
              <button
                onClick={() => setActiveTab('lesson')}
                className={cn(
                  "flex items-center gap-2 px-8 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'lesson' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <BookOpen size={18} />
                Bài học
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={cn(
                  "flex items-center gap-2 px-8 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'practice' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Play size={18} />
                Luyện tập
                <span className="ml-1 px-1.5 py-0.5 bg-sky-100 text-sky-600 rounded text-[10px]">{questions.length}</span>
              </button>
            </div>

            {activeTab === 'lesson' ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Lesson Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sky-500">
                    <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                      <Lightbulb size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">{topic.title}</h1>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {topic.description}
                  </p>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-slate max-w-none">
                  <div className="markdown-body">
                    <ReactMarkdown>{topic.content || ''}</ReactMarkdown>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="bg-sky-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-sm">
                      <Zap size={32} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Sẵn sàng luyện tập?</h3>
                      <p className="text-slate-500 text-sm">Củng cố kiến thức vừa học qua các bài tập trắc nghiệm.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('practice')}
                    className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
                  >
                    Bắt đầu luyện tập
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Practice Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        isTimerActive 
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-100" 
                          : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Clock size={16} />
                      {isTimerActive ? formatTime(timer) : "Ghi thời gian"}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      <Zap size={16} />
                      Speed Mode
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleFinish}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                  >
                    Nộp bài
                  </button>
                </div>

                {isFinished ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                      <CheckCircle2 size={48} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 mb-2">Hoàn thành bài tập!</h2>
                      <p className="text-slate-500">Bạn đã hoàn thành bộ đề "{topic?.title}"</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-2xl font-black text-emerald-500">{calculateScore()}/{questions.length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Đúng</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-2xl font-black text-sky-500">{formatTime(timer)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Thời gian</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-2xl font-black text-amber-500">+{calculateScore() * 10}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">XP</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setIsFinished(false);
                          setSelectedAnswers({});
                          setCurrentQuestion(1);
                          setTimer(0);
                        }}
                        className="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
                      >
                        Làm lại
                      </button>
                      <button 
                        onClick={() => navigate('/ngu-phap')}
                        className="w-full sm:w-auto px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Quay về trang chủ
                      </button>
                    </div>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <BookOpen size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Chưa có bài tập</h2>
                    <p className="text-slate-500">Chủ điểm này hiện chưa có bài tập luyện tập. Vui lòng quay lại sau.</p>
                    <button 
                      onClick={() => setActiveTab('lesson')}
                      className="px-6 py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all"
                    >
                      Quay lại bài học
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Question Card */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
                            {currentQuestion}
                          </span>
                          <span className="text-slate-400 font-bold text-sm">/ {questions.length}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <button className="hover:text-slate-600 transition-colors"><AlertCircle size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><Video size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><Star size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><StickyNote size={18} /></button>
                        </div>
                      </div>
                      
                      <div className="p-12 text-center space-y-12">
                        {questions[currentQuestion - 1].type === 'reorder' ? (
                          <div className="space-y-8">
                            <h2 className="text-xl font-bold text-slate-500 italic">Sắp xếp các từ sau thành câu hoàn chỉnh:</h2>
                            
                            {/* Answer Area */}
                            <div className={cn(
                              "min-h-[80px] p-4 bg-slate-50 rounded-2xl border-2 border-dashed flex flex-wrap justify-center gap-2 items-center transition-colors",
                              checkedQuestions[currentQuestion]
                                ? isCorrect(currentQuestion)
                                  ? "border-emerald-200 bg-emerald-50/30"
                                  : "border-red-200 bg-red-50/30"
                                : "border-slate-200"
                            )}>
                              {(selectedAnswers[currentQuestion] || []).length === 0 && (
                                <span className="text-slate-400 text-sm">Chọn các từ bên dưới...</span>
                              )}
                              {(selectedAnswers[currentQuestion] || []).map((word: string, idx: number) => (
                                <button
                                  key={idx}
                                  disabled={checkedQuestions[currentQuestion]}
                                  onClick={() => {
                                    const newAnswer = [...selectedAnswers[currentQuestion]];
                                    newAnswer.splice(idx, 1);
                                    handleAnswerSelect(currentQuestion, newAnswer);
                                  }}
                                  className={cn(
                                    "px-4 py-2 rounded-xl font-bold shadow-sm transition-all animate-in zoom-in duration-200",
                                    checkedQuestions[currentQuestion]
                                      ? "bg-white border border-slate-200 text-slate-400 cursor-default"
                                      : "bg-white border border-sky-200 text-sky-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                                  )}
                                >
                                  {word}
                                </button>
                              ))}
                            </div>

                            {/* Options Area */}
                            {!checkedQuestions[currentQuestion] && (
                              <div className="flex flex-wrap justify-center gap-3">
                                {questions[currentQuestion - 1].options?.filter(word => 
                                  !(selectedAnswers[currentQuestion] || []).includes(word) || 
                                  (questions[currentQuestion - 1].options?.filter(w => w === word).length || 0) > 
                                  (selectedAnswers[currentQuestion] || []).filter((w: string) => w === word).length
                                ).map((word, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const currentAnswer = selectedAnswers[currentQuestion] || [];
                                      handleAnswerSelect(currentQuestion, [...currentAnswer, word]);
                                    }}
                                    className="px-4 py-2 bg-white border border-slate-100 text-slate-700 rounded-xl font-bold shadow-sm hover:border-sky-300 hover:text-sky-500 transition-all"
                                  >
                                    {word}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : questions[currentQuestion - 1].type === 'translation' ? (
                          <div className="space-y-8 max-w-2xl mx-auto">
                            <div className="space-y-4">
                              <h2 className="text-xl font-bold text-slate-500 italic">Dịch câu sau:</h2>
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-2xl font-bold text-slate-800">{questions[currentQuestion - 1].word}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <textarea
                                value={selectedAnswers[currentQuestion] || ''}
                                onChange={(e) => handleAnswerSelect(currentQuestion, e.target.value)}
                                disabled={checkedQuestions[currentQuestion]}
                                placeholder="Nhập bản dịch của bạn tại đây..."
                                className={cn(
                                  "w-full p-6 rounded-2xl border-2 transition-all focus:outline-none min-h-[120px] text-lg font-medium",
                                  checkedQuestions[currentQuestion]
                                    ? isCorrect(currentQuestion)
                                      ? "border-emerald-200 bg-emerald-50/30 text-emerald-800"
                                      : "border-red-200 bg-red-50/30 text-red-800"
                                    : "border-slate-100 focus:border-sky-500 bg-slate-50/50"
                                )}
                              />
                              <p className="text-xs text-slate-400 text-left px-2 italic">
                                * Lưu ý: Hệ thống sẽ tự động bỏ qua các dấu câu và khoảng trắng khi chấm điểm.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h2 className="text-3xl font-bold text-slate-800">
                              {questions[currentQuestion - 1].word}
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                              {['A', 'B', 'C', 'D'].map((label, i) => {
                                const optText = questions[currentQuestion - 1].options?.[i];
                                if (!optText) return null;
                                return (
                                  <button
                                    key={i}
                                    disabled={checkedQuestions[currentQuestion]}
                                    onClick={() => handleAnswerSelect(currentQuestion, label)}
                                    className={cn(
                                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                      checkedQuestions[currentQuestion]
                                        ? label === questions[currentQuestion - 1].correctAnswer
                                          ? "border-emerald-500 bg-emerald-50"
                                          : selectedAnswers[currentQuestion] === label
                                            ? "border-red-500 bg-red-50"
                                            : "border-slate-100 opacity-50"
                                        : selectedAnswers[currentQuestion] === label
                                          ? "border-sky-500 bg-sky-50"
                                          : "border-slate-100 hover:border-sky-200 hover:bg-slate-50"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                                      checkedQuestions[currentQuestion]
                                        ? label === questions[currentQuestion - 1].correctAnswer
                                          ? "bg-emerald-500 text-white"
                                          : selectedAnswers[currentQuestion] === label
                                            ? "bg-red-500 text-white"
                                            : "bg-slate-100 text-slate-400"
                                        : selectedAnswers[currentQuestion] === label
                                          ? "bg-sky-500 text-white"
                                          : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600"
                                    )}>
                                      {label}
                                    </div>
                                    <span className={cn(
                                      "font-bold transition-colors",
                                      checkedQuestions[currentQuestion] && label === questions[currentQuestion - 1].correctAnswer
                                        ? "text-emerald-700"
                                        : checkedQuestions[currentQuestion] && selectedAnswers[currentQuestion] === label
                                          ? "text-red-700"
                                          : "text-slate-700"
                                    )}>{optText}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {/* Check Answer Button */}
                        {!checkedQuestions[currentQuestion] && (
                          (questions[currentQuestion - 1]?.type === 'multiple-choice' && selectedAnswers[currentQuestion]) ||
                          (questions[currentQuestion - 1]?.type === 'reorder' && Array.isArray(selectedAnswers[currentQuestion]) && selectedAnswers[currentQuestion].length > 0) ||
                          (questions[currentQuestion - 1]?.type === 'translation' && typeof selectedAnswers[currentQuestion] === 'string' && selectedAnswers[currentQuestion].trim().length > 0)
                        ) && (
                          <div className="mt-8 flex justify-center">
                            <button
                              onClick={() => handleCheckAnswer(currentQuestion)}
                              className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
                            >
                              Kiểm tra đáp án
                            </button>
                          </div>
                        )}

                        {/* Explanation Area */}
                        {checkedQuestions[currentQuestion] && (
                          <div className={cn(
                            "mt-8 p-6 rounded-2xl border-2 animate-in slide-in-from-bottom-4 duration-300 text-left",
                            isCorrect(currentQuestion) 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                              : "bg-red-50 border-red-100 text-red-800"
                          )}>
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                isCorrect(currentQuestion) ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                              )}>
                                {isCorrect(currentQuestion) ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-bold text-lg mb-1">
                                  {isCorrect(currentQuestion) ? "Chính xác!" : "Chưa đúng rồi!"}
                                </h4>
                                <p className="text-sm opacity-90 mb-4">
                                  Đáp án đúng là: <span className="font-bold">{questions[currentQuestion - 1].correctAnswer}</span>
                                </p>
                                {questions[currentQuestion - 1].explanation && (
                                  <div className="pt-4 border-t border-current/10">
                                    <h5 className="font-bold text-sm mb-2 flex items-center gap-2">
                                      <Lightbulb size={16} />
                                      Giải thích:
                                    </h5>
                                    <p className="text-sm leading-relaxed">
                                      {questions[currentQuestion - 1].explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Navigation */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-4">
                          <button className="text-slate-400 hover:text-slate-600"><Keyboard size={20} /></button>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map(n => (
                              <button key={n} className="w-8 h-8 rounded-lg border border-slate-100 text-xs font-bold text-slate-400 hover:border-sky-200 hover:text-sky-500 transition-all">
                                {n}
                              </button>
                            ))}
                            <span className="text-slate-300 text-xs font-bold mx-2">chọn đáp án</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={currentQuestion === 1}
                            onClick={() => setCurrentQuestion(prev => prev - 1)}
                            className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            disabled={currentQuestion === questions.length}
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                            className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <span className="text-slate-300 text-xs font-bold mx-2">chuyển câu</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2">
                        {questions.map((q, idx) => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(idx + 1)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                              currentQuestion === idx + 1
                                ? "bg-sky-500 text-white shadow-lg shadow-sky-100"
                                : selectedAnswers[idx + 1]
                                  ? "bg-sky-100 text-sky-600"
                                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
