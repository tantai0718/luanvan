import { Link } from 'react-router-dom';

const storyCards = [
  { icon: 'compost', title: 'Nguồn giống thuần chủng', desc: 'Tuyển chọn nhà cung cấp có quy trình minh bạch.' },
  { icon: 'science', title: 'Kiểm tra vi sinh', desc: 'Xét nghiệm định kỳ để giữ an toàn cho bữa ăn.' },
  { icon: 'inventory_2', title: 'Đóng gói an toàn', desc: 'Bảo quản phù hợp từ kho đến lúc giao.' },
  { icon: 'qr_code_2', title: 'Truy xuất nguồn gốc', desc: 'Theo dõi thông tin sản phẩm rõ ràng.' },
];

export default function About() {
  return (
    <div className="bg-background min-h-screen">
      <section className="relative w-full overflow-hidden">
        <img
          src="/images/farm2table-ecology.png"
          alt="Người nông dân thu hoạch rau sạch"
          className="w-full h-[420px] md:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 flex items-end z-10">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop w-full pb-12 md:pb-16">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-label-sm text-label-sm mb-4">
                Hành trình từ tâm
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                Gói trọn <span className="text-primary-fixed italic">tinh túy</span> đất trời vào từng bữa ăn.
              </h1>
              <p className="text-body-lg font-body-lg text-white/85 mb-8 max-w-lg">
                Farm2Table rút ngắn khoảng cách giữa người nông dân tận tụy và bàn ăn của bạn bằng những sản phẩm sạch,
                thông tin rõ ràng và trải nghiệm mua hàng liền mạch.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="px-8 py-4 bg-primary text-on-primary rounded-xl font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-all active:scale-95"
                >
                  Mua nông sản sạch
                </Link>
                <Link
                  to="/products"
                  className="px-8 py-4 bg-white/15 backdrop-blur-sm border border-white/40 text-white rounded-xl font-title-md text-title-md hover:bg-white/25 transition-all active:scale-95"
                >
                  Khám phá mùa vụ
                </Link>
              </div>
            </div>
            <div className="hidden md:block absolute bottom-12 right-margin-desktop">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="mt-1 text-body-md font-body-md text-white/80">Hộ tác nghiệp trải dài khắp Việt Nam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Quy trình kiểm định 4 lớp</h2>
            <p className="text-on-surface-variant font-body-md text-body-md mt-2">Minh bạch từ hạt giống đến khi trao tận tay bạn.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {storyCards.map(({ icon, title, desc }) => (
              <div key={title} className="bg-surface rounded-3xl p-6 border border-outline-variant/30 organic-shadow text-center flex flex-col items-center group hover:border-primary/30 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">{icon}</span>
                </div>
                <h3 className="text-title-md font-title-md text-on-surface">{title}</h3>
                <p className="mt-2 text-body-md font-body-md text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News / Tips Section */}
      <section className="py-xl">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Góc sức khỏe & bếp Việt</h2>
              <p className="text-on-surface-variant mt-2 font-body-md text-body-md">Mẹo hay mỗi ngày cho lối sống lành mạnh.</p>
            </div>
            <Link to="/products" className="text-primary font-label-sm flex items-center gap-1 group">
              Xem sản phẩm đang có <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
          <div className="grid gap-gutter lg:grid-cols-[1.35fr_1fr]">
            {/* Featured article */}
            <article className="overflow-hidden rounded-3xl group organic-shadow">
              <div
                className="grid min-h-[360px] content-end bg-cover bg-center p-8"
                style={{ backgroundImage: "linear-gradient(180deg, rgba(16,23,19,.1), rgba(16,23,19,.94)), url('/images/raucu.webp')" }}
              >
                <span className="w-fit rounded-full bg-secondary text-on-secondary px-3 py-1 font-label-sm text-label-sm">Mẹo nấu ăn</span>
                <h3 className="mt-4 max-w-xl text-3xl font-bold text-white">Giữ trọn vitamin trong rau củ khi chế biến</h3>
                <p className="mt-3 max-w-xl text-body-md font-body-md text-white/80">Chọn nhiệt độ và thời gian nấu phù hợp để bữa ăn ngon hơn.</p>
              </div>
            </article>
            {/* Side articles */}
            <div className="grid gap-gutter">
              {[
                { title: 'Top 5 loại nông sản tăng cường sức đề kháng', variant: 'default' },
                { title: 'Xây dựng thói quen đi chợ không rác thải nhựa', variant: 'highlight' },
                { title: 'Phân biệt rau hữu cơ và rau sạch chuẩn VietGAP', variant: 'default' },
              ].map(({ title, variant }) => (
                <article
                  key={title}
                  className={`rounded-3xl p-6 organic-shadow border transition-all hover:scale-[1.02] cursor-pointer ${
                    variant === 'highlight'
                      ? 'bg-primary-container text-on-primary-container border-primary-container'
                      : 'bg-surface border-outline-variant/30 text-on-surface'
                  }`}
                >
                  <p className={`font-label-sm text-label-sm uppercase ${variant === 'highlight' ? 'opacity-70' : 'text-on-surface-variant'}`}>Lối sống</p>
                  <h3 className="mt-3 text-xl font-bold leading-7">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
