import { CheckCircle2, Zap } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
              ✓ Bắt đầu miễn phí
            </span>
          </div>
          
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl mb-4">
              Đăng ký và học ngay, không cần thẻ tín dụng
            </h2>
            <p className="text-slate-500">
              Trải nghiệm đầy đủ các tính năng cơ bản. Nâng cấp PRO khi bạn sẵn sàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <FeatureItem text="Luyện tập ngữ pháp & từ vựng miễn phí" />
            <FeatureItem text="Giải thích chi tiết mỗi đáp án" />
            <FeatureItem text="Hỏi AI khi không hiểu bài" />
            <FeatureItem text="Đăng nhập để lưu tiến độ & streak" />
          </div>

          <div className="flex justify-center">
            <button className="w-full md:w-auto px-10 py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2 group">
              Bắt đầu luyện tập ngay
              <Zap size={20} className="fill-current group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <CheckCircle2 size={20} className="text-green-500 shrink-0" />
      <span className="text-slate-700 text-sm font-medium">{text}</span>
    </div>
  );
}
