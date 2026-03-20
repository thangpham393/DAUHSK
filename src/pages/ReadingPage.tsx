import { Book, Search, Filter, ArrowRight, Star, Clock, User } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const READING_TOPICS = [
  {
    id: 1,
    title: "Cuộc sống ở Bắc Kinh",
    level: "HSK 3",
    category: "Đời sống",
    author: "Trần Minh",
    time: "5 phút",
    rating: 4.8,
    image: "https://picsum.photos/seed/beijing/400/250"
  },
  {
    id: 2,
    title: "Lễ hội Thuyền Rồng",
    level: "HSK 4",
    category: "Văn hóa",
    author: "Lý Tiểu Long",
    time: "8 phút",
    rating: 4.9,
    image: "https://picsum.photos/seed/dragonboat/400/250"
  },
  {
    id: 3,
    title: "Kinh tế Trung Quốc 2024",
    level: "HSK 6",
    category: "Kinh tế",
    author: "Vương Hạo",
    time: "12 phút",
    rating: 4.7,
    image: "https://picsum.photos/seed/economy/400/250"
  },
  {
    id: 4,
    title: "Ẩm thực Tứ Xuyên",
    level: "HSK 2",
    category: "Ẩm thực",
    author: "Trương Tam",
    time: "4 phút",
    rating: 4.6,
    image: "https://picsum.photos/seed/sichuan/400/250"
  }
];

export default function ReadingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Luyện đọc tiếng Trung</h1>
                <p className="text-slate-500">Cải thiện kỹ năng đọc hiểu qua các bài báo, câu chuyện và tin tức.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm bài đọc..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hsk-primary/20 focus:border-hsk-primary transition-all w-64"
                  />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Level Filter */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {['Tất cả', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((level) => (
                <button 
                  key={level}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    level === 'Tất cả' 
                      ? 'bg-hsk-primary text-white shadow-lg shadow-sky-100' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-hsk-primary hover:text-hsk-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Reading Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {READING_TOPICS.map((topic) => (
                <div 
                  key={topic.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={topic.image} 
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-hsk-primary uppercase">
                      {topic.level}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <Book size={12} />
                      {topic.category}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-1">{topic.title}</h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User size={14} />
                        {topic.author}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star size={14} fill="currentColor" />
                        {topic.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={14} />
                        {topic.time}
                      </div>
                      <button className="flex items-center gap-1 text-sm font-bold text-hsk-primary hover:gap-2 transition-all">
                        Đọc ngay
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <button className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all">
                Xem thêm bài đọc
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
