import { motion } from 'motion/react';
import { Play, FileCheck, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-red-50 text-hsk-primary mb-6 border border-red-100">
            ✨ Nền tảng luyện thi HSK hàng đầu Việt Nam
          </span>
          
          <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
            Luyện HSK hiệu quả<br />
            <span className="text-hsk-primary">Đạt mục tiêu nhanh hơn</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Luyện nghe 4 cấp độ, luyện đề, học từ vựng, ngữ pháp — tất cả trong một nền tảng. 
            Học thông minh, thi là đỗ.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="w-full sm:w-auto px-8 py-4 bg-hsk-primary text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 group">
              Tiếp tục học
              <Play size={20} className="fill-current group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              Làm bài test thử
              <FileCheck size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Đăng ký miễn phí, bắt đầu ngay
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Theo dõi tiến độ học tập
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Giải thích chi tiết từng câu
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-100 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
}
