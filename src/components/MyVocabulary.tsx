import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, Search, Book, ExternalLink } from 'lucide-react';

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
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface WordProgress {
  id: string;
  wordId: string;
  rating: string;
  lastStudiedAt: any;
  repetitionCount: number;
}

interface WordDetail {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
}

export default function MyVocabulary() {
  const [progress, setProgress] = useState<WordProgress[]>([]);
  const [words, setWords] = useState<Record<string, WordDetail>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const progressData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WordProgress[];
      
      setProgress(progressData);

      // Fetch word details for these words
      const wordIds = progressData.map(p => p.wordId);
      const uniqueWordIds = Array.from(new Set(wordIds));
      
      const newWords: Record<string, WordDetail> = { ...words };
      const wordsToFetch = uniqueWordIds.filter(id => !newWords[id]);

      if (wordsToFetch.length > 0) {
        // Firestore doesn't support 'in' with more than 10-30 items easily, 
        // but for a user's vocab it might grow. 
        // For simplicity, we fetch them individually or in chunks if needed.
        // Here we'll just fetch them one by one for now as it's a small app.
        try {
          await Promise.all(wordsToFetch.map(async (id) => {
            const wordDoc = await getDoc(doc(db, 'vocabulary_words', id));
            if (wordDoc.exists()) {
              newWords[id] = { id: wordDoc.id, ...wordDoc.data() } as WordDetail;
            }
          }));
          setWords(newWords);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'vocabulary_words');
        }
      }
      
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredProgress = progress.filter(p => {
    const word = words[p.wordId];
    if (!word) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      word.word.toLowerCase().includes(searchLower) ||
      word.pinyin.toLowerCase().includes(searchLower) ||
      word.meaning.toLowerCase().includes(searchLower)
    );
  });

  if (!user) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400">Vui lòng đăng nhập để xem từ vựng của bạn.</p>
      </div>
    );
  }

  if (loading && progress.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-hsk-primary animate-spin mb-4" />
        <p className="text-slate-500">Đang tải từ vựng...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Từ vựng của tôi</h2>
          <p className="text-slate-500">Danh sách các từ bạn đã học ({progress.length} từ)</p>
        </div>
        
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm trong từ vựng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm"
          />
        </div>
      </div>

      {filteredProgress.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Từ vựng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Phiên âm</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nghĩa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Đánh giá</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Lặp lại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProgress.map((p) => {
                const word = words[p.wordId];
                if (!word) return null;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xl font-bold text-slate-800">{word.word}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500 font-medium">{word.pinyin}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{word.meaning}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                        p.rating === 'easy' ? "bg-emerald-100 text-emerald-700" :
                        p.rating === 'good' ? "bg-sky-100 text-sky-700" :
                        p.rating === 'hard' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {p.rating === 'easy' ? 'Dễ' : 
                         p.rating === 'good' ? 'Tốt' : 
                         p.rating === 'hard' ? 'Khó' : 'Lại'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-slate-700">{p.repetitionCount}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Book size={32} />
          </div>
          <p className="text-slate-400">
            {searchQuery ? "Không tìm thấy từ vựng nào phù hợp." : "Bạn chưa học từ vựng nào."}
          </p>
        </div>
      )}
    </div>
  );
}
