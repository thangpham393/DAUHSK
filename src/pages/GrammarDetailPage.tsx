import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';

const LESSON_CONTENT = {
  title: "CÁCH NHẬN BIẾT CÂU TỪ LOẠI",
  intro: "Bạn nhận biết câu từ loại khi 4 lựa chọn A, B, C, D có cùng gốc từ nhưng mang các hậu tố (đuôi) khác nhau, biểu thị các loại từ khác nhau.",
  example: {
    text: "The new manager is responsible for the overall ________ of the team.",
    options: [
      { label: "A", text: "effective", type: "tính từ" },
      { label: "B", text: "effectively", type: "trạng từ" },
      { label: "C", text: "effectiveness", type: "danh từ" },
      { label: "D", text: "effect", type: "danh từ / động từ" }
    ]
  },
  sections: [
    {
      title: "LÀM SAO LÀM ĐƯỢC DẠNG CÂU TRÊN?",
      steps: [
        {
          label: "Bước 1 – Xác định vị trí",
          content: "Xác định chỗ trống cần điền loại từ gì, dựa vào vị trí của nó trong câu (phần này sẽ học kỹ ở bài sau)."
        },
        {
          label: "Bước 2 – Nhận diện hậu tố",
          content: "Dựa vào đuôi từ để xác định đó là danh từ, tính từ, hay động từ."
        }
      ]
    },
    {
      title: "HẬU TỐ TỪ LOẠI",
      subsections: [
        {
          title: "HẬU TỐ DANH TỪ",
          groups: [
            {
              title: "Danh từ chỉ người",
              items: [
                { suffix: "-er", example: "trainer (người huấn luyện)" },
                { suffix: "-ee", example: "trainee (học viên)" },
                { suffix: "-ist", example: "artist (nghệ sĩ)" },
                { suffix: "-ian", example: "musician (nhạc sĩ)" },
                { suffix: "-ant", example: "assistant (trợ lý)" },
                { suffix: "-or", example: "doctor (bác sĩ)" }
              ]
            },
            {
              title: "Danh từ khác",
              items: [
                { suffix: "-ment", example: "equipment (thiết bị)" },
                { suffix: "-tion", example: "creation (sự sáng tạo)" },
                { suffix: "-sion", example: "expansion (sự mở rộng)" },
                { suffix: "-ness", example: "darkness (bóng tối)" },
                { suffix: "-ty", example: "electricity (điện)" },
                { suffix: "-ure", example: "closure (sự đóng cửa)" },
                { suffix: "-ce", example: "silence (sự im lặng)" }
              ]
            }
          ]
        },
        {
          title: "HẬU TỐ TÍNH TỪ",
          groups: [
            {
              title: "Nhóm 1",
              items: [
                { suffix: "-able / -ible", example: "comfortable, understandable" },
                { suffix: "-ous", example: "dangerous (nguy hiểm)" },
                { suffix: "-ful", example: "beautiful (đẹp)" },
                { suffix: "-less", example: "hopeless (vô vọng)" }
              ]
            },
            {
              title: "Nhóm 2",
              items: [
                { suffix: "-ive", example: "active (năng động)" },
                { suffix: "-al", example: "personal (cá nhân)" },
                { suffix: "-ic", example: "artistic (thuộc về nghệ thuật)" },
                { suffix: "-ary", example: "necessary (cần thiết)" }
              ]
            }
          ]
        },
        {
          title: "HẬU TỐ ĐỘNG TỪ",
          groups: [
            {
              title: "Các đuôi phổ biến",
              items: [
                { suffix: "-ate", example: "create (tạo ra), educate (giáo dục)" },
                { suffix: "-ify", example: "beautify (làm đẹp)" },
                { suffix: "-en", example: "weaken (làm yếu đi)" },
                { suffix: "-ise / -ize", example: "modernize (hiện đại hóa)" }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const MOCK_QUESTIONS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  word: "trainer",
  options: [
    { label: "A", text: "Danh từ" },
    { label: "B", text: "Động từ" },
    { label: "C", text: "Tính từ" },
    { label: "D", text: "Trạng từ" }
  ],
  correct: "A"
}));

import { useAuth } from '../hooks/useAuth';

export default function GrammarDetailPage({ initialTab = 'lesson' }: { initialTab?: 'lesson' | 'practice' }) {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'lesson' | 'practice'>(initialTab);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Timer logic
  React.useEffect(() => {
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
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'practice' || isFinished) return;

      if (e.key === '1') handleAnswerSelect(currentQuestion, 'A');
      if (e.key === '2') handleAnswerSelect(currentQuestion, 'B');
      if (e.key === '3') handleAnswerSelect(currentQuestion, 'C');
      if (e.key === '4') handleAnswerSelect(currentQuestion, 'D');
      
      if (e.key === 'ArrowLeft' && currentQuestion > 1) {
        setCurrentQuestion(prev => prev - 1);
      }
      if (e.key === 'ArrowRight' && currentQuestion < 50) {
        setCurrentQuestion(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isFinished, currentQuestion]);

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    // Auto move to next question if not already answered
    if (!selectedAnswers[questionId] && questionId < 50) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    MOCK_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleFinish = () => {
    setIsFinished(true);
    setIsTimerActive(false);
  };

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

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-slate-100 transition-all duration-300 overflow-y-auto",
          isSidebarOpen ? "w-80" : "w-0 opacity-0 pointer-events-none"
        )}>
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Kiến thức ngữ pháp cơ bản</h2>
            <p className="text-slate-400 text-xs font-medium mb-6">1 bài học • 50 câu hỏi</p>
            
            <div className="space-y-2">
              {[
                { id: 1, title: 'Hậu tố từ loại', count: 50 },
                { id: 2, title: 'Đại từ nhân xưng', count: 25 },
                { id: 3, title: 'Số từ & Lượng từ', count: 30 },
                { id: 4, title: 'Phó từ phủ định', count: 15 },
                { id: 5, title: 'Câu hỏi với 吗', count: 10 },
              ].map((lesson, i) => (
                <button 
                  key={lesson.id}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                    lesson.id === 1 
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-100" 
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                    lesson.id === 1 ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-500"
                  )}>
                    {lesson.id.toString().padStart(2, '0')}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm">{lesson.title}</span>
                      {lesson.id === 1 && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase">FREE</span>}
                    </div>
                    <span className={cn(
                      "text-[10px]",
                      lesson.id === 1 ? "opacity-80" : "text-slate-400"
                    )}>{lesson.count} câu hỏi</span>
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
                <span className="ml-1 px-1.5 py-0.5 bg-sky-100 text-sky-600 rounded text-[10px]">50</span>
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
                    <h1 className="text-2xl font-black tracking-tight">{LESSON_CONTENT.title}</h1>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {LESSON_CONTENT.intro}
                  </p>
                </div>

                {/* Example Box */}
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-2 text-purple-600 font-bold">
                    <StickyNote size={18} />
                    <span>Ví dụ</span>
                  </div>
                  <div className="text-slate-800 font-medium text-lg italic">
                    {LESSON_CONTENT.example.text}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LESSON_CONTENT.example.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-bold text-slate-400">({opt.label})</span>
                        <span className="font-bold text-slate-800">{opt.text}</span>
                        <span className="text-slate-400 text-sm">({opt.type})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-sky-500">
                    <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">{LESSON_CONTENT.sections[0].title}</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {LESSON_CONTENT.sections[0].steps?.map((step, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-sky-600 font-bold mb-3">
                          <Info size={18} />
                          <span>Ghi chú</span>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{step.label}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{step.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suffixes Section */}
                <div className="space-y-12">
                  <div className="flex items-center gap-3 text-sky-500">
                    <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                      <BookOpen size={24} />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">{LESSON_CONTENT.sections[1].title}</h2>
                  </div>

                  {LESSON_CONTENT.sections[1].subsections?.map((sub, i) => (
                    <div key={i} className="space-y-6">
                      <div className="flex items-center gap-3 text-sky-500">
                        <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            i === 0 ? "bg-sky-500" : i === 1 ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">{sub.title}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-11">
                        {sub.groups.map((group, j) => (
                          <div key={j} className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                              {j === 0 ? "👥" : "📦"} {group.title}
                            </div>
                            <ul className="space-y-3">
                              {group.items.map((item, k) => (
                                <li key={k} className="flex items-center gap-3 text-sm">
                                  <span className="text-sky-500 font-bold min-w-[60px]">{item.suffix}</span>
                                  <ChevronRight size={14} className="text-slate-300" />
                                  <span className="text-slate-600">{item.example}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer CTA */}
                <div className="bg-sky-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-sm">
                      <Zap size={32} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Sẵn sàng kiếm XP?</h3>
                      <p className="text-slate-500 text-sm">50 câu hỏi • +500 XP tiềm năng</p>
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
                      <p className="text-slate-500">Bạn đã hoàn thành bộ đề "Hậu tố từ loại"</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-2xl font-black text-emerald-500">{calculateScore()}/50</div>
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
                ) : (
                  <>
                    {/* Question Card */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
                            {currentQuestion}
                          </span>
                          <span className="text-slate-400 font-bold text-sm">/ 50</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <button className="hover:text-slate-600 transition-colors"><AlertCircle size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><Video size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><Star size={18} /></button>
                          <button className="hover:text-slate-600 transition-colors"><StickyNote size={18} /></button>
                        </div>
                      </div>
                      
                      <div className="p-12 text-center space-y-12">
                        <h2 className="text-3xl font-bold text-slate-800">
                          {MOCK_QUESTIONS[currentQuestion - 1].word}
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                          {MOCK_QUESTIONS[currentQuestion - 1].options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleAnswerSelect(currentQuestion, opt.label)}
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                selectedAnswers[currentQuestion] === opt.label
                                  ? "border-sky-500 bg-sky-50"
                                  : "border-slate-100 hover:border-sky-200 hover:bg-slate-50"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                                selectedAnswers[currentQuestion] === opt.label
                                  ? "bg-sky-500 text-white"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600"
                              )}>
                                {opt.label}
                              </div>
                              <span className="font-bold text-slate-700">{opt.text}</span>
                            </button>
                          ))}
                        </div>
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
                            disabled={currentQuestion === 50}
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                            className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <span className="text-slate-300 text-xs font-bold mx-2">chuyển câu</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2">
                        {MOCK_QUESTIONS.map(q => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(q.id)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                              currentQuestion === q.id
                                ? "bg-sky-500 text-white shadow-lg shadow-sky-100"
                                : selectedAnswers[q.id]
                                  ? "bg-sky-100 text-sky-600"
                                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                          >
                            {q.id}
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
