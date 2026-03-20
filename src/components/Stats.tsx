export default function Stats() {
  const stats = [
    { label: 'Học viên đang học', value: '12.450+' },
    { label: 'Câu luyện nghe', value: '8.210+' },
    { label: 'Câu hỏi ngữ pháp', value: '2.500+' },
  ];

  return (
    <section className="py-12 border-y border-slate-100 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-display font-bold text-hsk-primary mb-2">
                {stat.value}
              </div>
              <div className="text-slate-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
