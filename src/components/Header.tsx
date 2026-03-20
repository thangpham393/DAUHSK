import { motion, AnimatePresence } from 'motion/react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Book,
  Headphones, 
  Languages, 
  FileText, 
  Video, 
  Layout, 
  Info, 
  ChevronDown, 
  Zap, 
  Bell, 
  User as UserIcon,
  Search,
  LogOut,
  LogIn,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-hsk-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
              HSK
            </div>
            <span className="text-xl font-display font-bold text-slate-900">Đậu HSK</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/ngu-phap">
              <NavLink icon={<BookOpen size={18} />} label="Ngữ pháp" />
            </Link>
            <Link to="/tu-vung">
              <NavLink icon={<Languages size={18} />} label="Từ vựng" />
            </Link>
            <Link to="/doc">
              <NavLink icon={<Book size={18} />} label="Đọc" />
            </Link>
            <NavLink icon={<Headphones size={18} />} label="Nghe" />
            <NavLink icon={<FileText size={18} />} label="Đề thi" />
            <NavLink icon={<Video size={18} />} label="Video" />
            <div className="flex items-center gap-1 text-slate-600 hover:text-hsk-primary cursor-pointer transition-colors text-sm font-medium">
              <span>Thêm</span>
              <ChevronDown size={14} />
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-amber-200 transition-colors">
              <Zap size={16} fill="currentColor" />
              Nâng cấp
            </button>
            
            <div className="flex items-center gap-3 text-slate-400">
              <button className="hover:text-slate-600 transition-colors">
                <Search size={20} />
              </button>
              <button className="hover:text-slate-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-hsk-primary rounded-full border-2 border-white"></span>
              </button>
              
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-100 cursor-pointer hover:ring-2 hover:ring-hsk-primary/20 transition-all"
                >
                  <img 
                    src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
                    alt="User" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2"
                    >
                      {user ? (
                        <>
                          <div className="px-4 py-3 border-b border-slate-50">
                            <div className="text-sm font-bold text-slate-800 truncate">{user.displayName}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                          
                          <div className="py-1">
                            <Link 
                              to="/profile" 
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <UserIcon size={16} />
                              Trang cá nhân
                            </Link>
                            
                            {isAdmin && (
                              <Link 
                                to="/admin" 
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-hsk-primary font-bold hover:bg-sky-50 transition-colors"
                              >
                                <ShieldCheck size={16} />
                                Quản trị (Admin)
                              </Link>
                            )}
                            
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                              <Settings size={16} />
                              Cài đặt
                            </button>
                          </div>

                          <div className="border-t border-slate-50 pt-1">
                            <button 
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                            >
                              <LogOut size={16} />
                              Đăng xuất
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-2 py-1">
                          <Link 
                            to="/login" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-hsk-primary text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
                          >
                            <LogIn size={16} />
                            Đăng nhập
                          </Link>
                          <div className="mt-2 text-center">
                            <Link 
                              to="/login" 
                              state={{ mode: 'register' }}
                              onClick={() => setIsDropdownOpen(false)}
                              className="text-xs font-bold text-slate-500 hover:text-hsk-primary transition-colors"
                            >
                              Chưa có tài khoản? Đăng ký
                            </Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600 hover:text-hsk-primary cursor-pointer transition-colors text-sm font-medium">
      {icon}
      <span>{label}</span>
    </div>
  );
}
