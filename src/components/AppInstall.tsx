import { Smartphone, Monitor, CheckCircle2, Download } from 'lucide-react';
import { ReactNode } from 'react';

export default function AppInstall() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-600 mb-4">
          📱 Cài đặt miễn phí
        </span>
        <h2 className="text-3xl md:text-4xl mb-4">Cài đặt ứng dụng <span className="text-hsk-primary">Đậu HSK</span></h2>
        <p className="text-slate-500 mb-12">
          Học mọi lúc mọi nơi — cài ứng dụng miễn phí trực tiếp từ trình duyệt, không cần App Store
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            <Monitor size={18} />
            Android / Chrome
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-slate-100 text-slate-400 font-medium cursor-not-allowed">
            <Smartphone size={18} />
            iPhone / iPad
          </button>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <Step num={1} text="Mở trang web Đậu HSK trên trình duyệt Chrome" icon={<Monitor size={20} className="text-sky-500" />} />
          <Step num={2} text="Nhấn vào biểu tượng 'Cài đặt' trên thanh địa chỉ hoặc menu" icon={<Download size={20} className="text-sky-500" />} />
          <Step num={3} text="Xác nhận 'Cài đặt' — ứng dụng sẽ xuất hiện trên màn hình chính" icon={<CheckCircle2 size={20} className="text-sky-500" />} />
        </div>
      </div>
    </section>
  );
}

function Step({ num, text, icon }: { num: number; text: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 text-left">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
        {num}
      </div>
      <div className="shrink-0">{icon}</div>
      <span className="text-slate-700 font-medium text-sm">{text}</span>
    </div>
  );
}
