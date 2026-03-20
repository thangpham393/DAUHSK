import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LogIn, 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Chrome, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const initialMode = (location.state as any)?.mode || 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
    return unsubscribe;
  }, [navigate, from]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync user to Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      setSuccess('Đăng nhập thành công!');
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err: any) {
      console.error(err);
      setError('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'register') {
        if (!displayName) throw new Error('Vui lòng nhập họ tên');
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        
        // Create user in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: displayName,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        setSuccess('Đăng ký tài khoản thành công!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        
        // Update last login
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp()
          }, { merge: true });
        }
        
        setSuccess('Đăng nhập thành công!');
      }
      
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
      } else {
        setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand/Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-hsk-primary rounded-2xl text-white font-bold text-3xl shadow-xl shadow-sky-100 mb-4">
              HSK
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              {mode === 'login' ? 'Chào mừng quay trở lại' : 'Tạo tài khoản mới'}
            </h1>
            <p className="text-slate-500 mt-2">
              {mode === 'login' 
                ? 'Đăng nhập để tiếp tục hành trình chinh phục HSK' 
                : 'Tham gia cộng đồng học tiếng Trung cùng Đậu HSK'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            {/* Social Login */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Chrome size={20} className="text-red-500" />
              Tiếp tục với Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-wider">Hoặc sử dụng Email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <UserPlus size={18} />
                    </div>
                    <input 
                      required
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs font-bold text-hsk-primary hover:underline">
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-hsk-primary text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Đăng nhập' : 'Đăng ký ngay'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-1.5 text-hsk-primary font-bold hover:underline"
                >
                  {mode === 'login' ? 'Đăng ký miễn phí' : 'Đăng nhập ngay'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Bảo mật SSL
            </div>
            <Link to="/terms" className="hover:text-slate-600">Điều khoản</Link>
            <Link to="/privacy" className="hover:text-slate-600">Bảo mật</Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
