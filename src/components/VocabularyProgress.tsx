import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Settings, 
  Clock, 
  BookOpen, 
  BarChart2, 
  Book, 
  CheckCircle, 
  Calendar, 
  Trophy,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDocFromServer, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

interface UserProgress {
  id: string;
  wordId: string;
  topicId: string;
  rating: string;
  lastStudiedAt: any;
  nextReviewAt: any;
  repetitionCount: number;
}

export default function VocabularyProgress() {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

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
    if (!user) return;

    const path = 'user_vocabulary_progress';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProgress[];
      setProgress(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const learned = progress.length;
    const mastered = progress.filter(p => p.repetitionCount >= 5).length;
    const dueForReview = progress.filter(p => {
      if (!p.nextReviewAt) return false;
      const nextReview = p.nextReviewAt.toDate ? p.nextReviewAt.toDate() : new Date(p.nextReviewAt);
      return nextReview <= now;
    }).length;

    const newToday = progress.filter(p => {
      if (!p.lastStudiedAt) return false;
      const lastStudied = p.lastStudiedAt.toDate ? p.lastStudiedAt.toDate() : new Date(p.lastStudiedAt);
      return lastStudied >= today && p.repetitionCount === 1;
    }).length;

    const pending = progress.filter(p => {
      if (!p.nextReviewAt) return false;
      const nextReview = p.nextReviewAt.toDate ? p.nextReviewAt.toDate() : new Date(p.nextReviewAt);
      return nextReview > now;
    }).length;

    return {
      learned,
      mastered,
      dueForReview,
      newToday,
      pending,
      dailyGoal: 20, // Mock goal
    };
  }, [progress]);

  if (!user) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400">Vui lòng đăng nhập để xem tiến độ học tập.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-hsk-primary animate-spin mb-4" />
        <p className="text-slate-500">Đang tải tiến độ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Today's Goal Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-500">
              <Target size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Mục tiêu hôm nay</h2>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Review Card */}
          <div className="bg-purple-50/50 rounded-2xl p-8 border border-purple-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-4 left-4 text-purple-400">
              <Clock size={20} />
            </div>
            <div className="text-purple-600 font-bold text-sm mb-4 uppercase tracking-wider">Ôn tập</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-purple-700">{stats.dueForReview}</span>
              <span className="text-xl font-bold text-purple-400">từ</span>
            </div>
            <div className="text-purple-400 text-sm font-medium">Cần ôn ngay</div>
          </div>

          {/* New Words Card */}
          <div className="bg-sky-50/50 rounded-2xl p-8 border border-sky-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-4 left-4 text-sky-400">
              <BookOpen size={20} />
            </div>
            <div className="text-sky-600 font-bold text-sm mb-4 uppercase tracking-wider">Từ mới</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black text-sky-700">{stats.newToday}</span>
              <span className="text-xl font-bold text-sky-400">/{stats.dailyGoal} từ</span>
            </div>
            
            <div className="w-full max-w-xs space-y-2">
              <div className="h-2.5 w-full bg-sky-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (stats.newToday / stats.dailyGoal) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sky-500 text-xs font-bold">
                {Math.round((stats.newToday / stats.dailyGoal) * 100)}% hoàn thành
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Đã học', value: stats.learned.toString(), icon: <Book size={20} />, color: 'bg-amber-50 text-amber-500' },
          { label: 'Thành thạo', value: stats.mastered.toString(), icon: <CheckCircle size={20} />, color: 'bg-emerald-50 text-emerald-500' },
          { label: 'Cần ôn', value: stats.dueForReview.toString(), icon: <Clock size={20} />, color: 'bg-purple-50 text-purple-500' },
          { label: 'Đang chờ', value: stats.pending.toString(), icon: <Calendar size={20} />, color: 'bg-sky-50 text-sky-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.color)}>
              {stat.icon}
            </div>
            <div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-slate-800">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Progress Sections */}
      <div className="space-y-4">
        {/* Pending Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-sky-200 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">Từ chưa đến hạn</h3>
              <div className="text-xl font-black text-sky-600">{stats.pending} từ đang chờ</div>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-sky-500 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-sky-100">
            Xem chi tiết
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mastered Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-emerald-200 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">Từ đã thành thạo</h3>
              <div className="text-xl font-black text-emerald-600">{stats.mastered} từ</div>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-emerald-100">
            Xem chi tiết
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
