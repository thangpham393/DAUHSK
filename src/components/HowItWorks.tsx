export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Chọn kỹ năng muốn luyện',
      desc: 'Ngữ pháp, luyện nghe, từ vựng, hoặc làm đề thi thử HSK.'
    },
    {
      num: '02',
      title: 'Làm bài và nhận phản hồi',
      desc: 'Bắt đầu làm bài và nhận phản hồi chi tiết cho từng câu trả lời.'
    },
    {
      num: '03',
      title: 'Đăng nhập để lưu tiến độ',
      desc: 'Theo dõi streak, XP, và xem phân tích điểm mạnh/yếu của bạn.'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl text-center mb-16">Cách hoạt động</h2>
        
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-6 p-6 rounded-2xl border border-slate-100 hover:border-hsk-primary/20 transition-all group">
              <div className="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-xl shrink-0 group-hover:scale-110 transition-transform">
                {step.num}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-slate-800">{step.title}</h3>
                <p className="text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
