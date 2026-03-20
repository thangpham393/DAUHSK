import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white pt-20">
      {/* Pre-footer CTA */}
      <div className="bg-sky-500 py-16 text-center text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Sẵn sàng nâng cao điểm HSK?</h2>
          <p className="text-sky-100 mb-8">Tham gia cùng 12.450+ học viên đang chinh phục HSK mỗi ngày</p>
          <button className="px-8 py-3 bg-white text-sky-500 rounded-lg font-bold hover:bg-sky-50 transition-colors flex items-center gap-2 mx-auto">
            Tiếp tục học
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-hsk-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                HSK
              </div>
              <span className="text-xl font-display font-bold text-slate-900">Đậu HSK</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Nền tảng luyện thi HSK miễn phí #1 Việt Nam. 
              Ngữ pháp, luyện nghe, từ vựng, đề thi thử — tất cả trong một.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Sản phẩm</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Ngữ pháp</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Luyện nghe</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Từ vựng</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Đề thi thử</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Tài nguyên</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Blog</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Lộ trình học</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Bảng xếp hạng</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Tổng quan</li>
              <li className="hover:text-hsk-primary cursor-pointer transition-colors">Liên hệ</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© 2026 Đậu HSK. Bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 cursor-pointer">Điều khoản dịch vụ</span>
            <span className="hover:text-slate-600 cursor-pointer">Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
