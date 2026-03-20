import { motion } from 'motion/react';
import { 
  BookOpen, 
  Headphones, 
  Languages, 
  FileText, 
  Video, 
  Layout, 
  ArrowRight,
  Newspaper
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: 'Ngữ pháp',
      desc: 'Chinh phục cấu trúc HSK với hệ thống bài học và luyện tập từ cơ bản đến nâng cao.',
      icon: <BookOpen className="text-blue-500" />,
      color: 'bg-blue-50',
      dot: 'bg-blue-500'
    },
    {
      title: 'Luyện nghe',
      desc: 'Luyện nghe 4 chế độ: Điền từ, Nghe Check, Nghe Chép, Nghe Hiểu.',
      icon: <Headphones className="text-green-500" />,
      color: 'bg-green-50',
      dot: 'bg-green-500'
    },
    {
      title: 'Từ vựng',
      desc: 'Học từ vựng HSK theo chủ đề với flashcard và phương pháp lặp lại ngắt quãng.',
      icon: <Languages className="text-amber-500" />,
      color: 'bg-amber-50',
      dot: 'bg-amber-500'
    },
    {
      title: 'Luyện đề',
      desc: 'Luyện đề HSK full test với chấm điểm và phân tích chi tiết kết quả.',
      icon: <FileText className="text-purple-500" />,
      color: 'bg-purple-50',
      dot: 'bg-purple-500'
    },
    {
      title: 'Blog',
      desc: 'Mẹo làm bài, chiến lược, lộ trình và kinh nghiệm thi HSK đạt điểm cao.',
      icon: <Newspaper className="text-sky-500" />,
      color: 'bg-sky-50',
      dot: 'bg-sky-500'
    },
    {
      title: 'Luyện đọc',
      desc: 'Luyện đọc HSK qua các đoạn văn, tin tức và bài báo song ngữ Trung-Việt.',
      icon: <Layout className="text-indigo-500" />,
      color: 'bg-indigo-50',
      dot: 'bg-indigo-500'
    },
    {
      title: 'Video',
      desc: 'Lộ trình học HSK qua video bài giảng sinh động và dễ hiểu.',
      icon: <Video className="text-rose-500" />,
      color: 'bg-rose-50',
      dot: 'bg-rose-500'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-4">
            Trên <span className="text-hsk-primary">ĐẬU HSK</span> bạn luyện được gì?
          </h2>
          <p className="text-slate-500">
            Hệ thống luyện tập toàn diện, từ ngữ pháp đến luyện nghe, từ vựng đến luyện đề
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="group p-6 rounded-2xl border border-slate-100 hover:border-hsk-primary/20 hover:shadow-xl hover:shadow-slate-100 transition-all relative"
            >
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${f.dot}`}></div>
              <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {f.desc}
              </p>
              <button className="flex items-center gap-1 text-hsk-primary font-bold text-sm group-hover:gap-2 transition-all">
                Bắt đầu
                <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
