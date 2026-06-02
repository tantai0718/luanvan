import { Link } from 'react-router-dom';

const farmerImage = '/images/farm2table-ecology.png';

const storyCards = [
  ['compost', 'Nguồn giống thuần chủng', 'Tuyển chọn nhà cung cấp có quy trình minh bạch.'],
  ['science', 'Kiểm tra vi sinh', 'Xét nghiệm định kỳ để giữ an toàn cho bữa ăn.'],
  ['inventory_2', 'Đóng gói an toàn', 'Bảo quản phù hợp từ kho đến lúc giao.'],
  ['qr_code_2', 'Truy xuất nguồn gốc', 'Theo dõi thông tin sản phẩm rõ ràng.'],
];

export default function About() {
  return (
    <div className="market-shell">
      <section className="market-page grid gap-10 py-10 lg:grid-cols-[1fr_520px] lg:items-center lg:py-16">
        <div>
          <p className="stitch-kicker">Hành trình từ tâm</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[#1b1c1c] md:text-5xl">
            Gói trọn tinh túy đất trời vào từng bữa ăn gia đình.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#404943]">
            Farm2Table rút ngắn khoảng cách giữa người nông dân tận tụy và bàn ăn của bạn bằng những sản phẩm sạch,
            thông tin rõ ràng và trải nghiệm mua hàng liền mạch.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-lg bg-[#0f5238] px-6 py-3 text-sm font-semibold text-white">
              Tìm hiểu thêm
            </Link>
            <Link to="/products" className="rounded-lg border border-[#707973] px-6 py-3 text-sm font-semibold text-[#0f5238]">
              Hợp tác cùng nông dân
            </Link>
          </div>
        </div>
        <div className="relative">
          <img src={farmerImage} alt="Người nông dân thu hoạch rau sạch" className="aspect-[4/5] w-full rounded-[24px] object-cover" />
          <div className="absolute -bottom-4 left-[-12px] rounded-xl bg-[#ffdad2] p-5 shadow-lg">
            <p className="text-2xl font-bold text-[#1b1c1c]">500+</p>
            <p className="mt-1 text-xs leading-5 text-[#404943]">Hộ tác nghiệp trải dài khắp Việt Nam</p>
          </div>
        </div>
      </section>

      <section className="market-page rounded-[24px] bg-white px-6 py-10 text-center shadow-sm md:px-10">
        <h2 className="text-3xl font-bold text-[#0f5238]">Quy trình kiểm định 4 lớp</h2>
        <p className="mt-2 text-sm text-[#404943]">Minh bạch tuyệt đối từ hạt giống đến khi trao tận tay bạn.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {storyCards.map(([icon, title, copy]) => (
            <div key={title} className="px-3">
              <span className="material-symbols-outlined rounded-xl bg-[#b1f0ce] p-4 text-[#0f5238]">{icon}</span>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#404943]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="news" className="market-page py-14">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold">Góc Sức Khỏe & Bếp Việt</h2>
            <p className="mt-2 text-sm text-[#404943]">Mẹo hay mỗi ngày cho lối sống lành mạnh.</p>
          </div>
          <Link to="/products" className="stitch-link text-sm">Xem sản phẩm đang có</Link>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <article className="overflow-hidden rounded-[24px] bg-[#122019] text-white">
            <div className="grid min-h-[360px] content-end bg-[linear-gradient(180deg,rgba(16,23,19,.1),rgba(16,23,19,.94)),url('https://lh3.googleusercontent.com/aida-public/AB6AXuBUpkdEsciIwQH8k6VQBF7neh6_loOtR99eqcPqvZEqMAg77TvR6abecBRnR_UEQjfJMcToAPuC4pYjaXnQ_0AvcC8QxqeMa7ZveGH70Rc5LTvE3EkF4ShiyDzI8S7uLFJJbx83MQpTKqQ6xy07q10VnVloVYg4fwBruCreyAZnfI63cgg-acU29yyhYXQw69arYasC-u_Ml7-p2W-wcJntiCXdu5hb56rrSg3UUi8P_b8zVkx3O0MmYMtFCEfFsEJb5CjzDsao6GI')] bg-cover bg-center p-7">
              <span className="w-fit rounded-full bg-[#a33d23] px-3 py-1 text-xs font-semibold">Mẹo nấu ăn</span>
              <h3 className="mt-4 max-w-xl text-3xl font-bold">Giữ trọn vitamin trong rau củ khi chế biến</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">Chọn nhiệt độ và thời gian nấu phù hợp để bữa ăn ngon hơn.</p>
            </div>
          </article>
          <div className="grid gap-5">
            {[
              'Top 5 loại nông sản tăng cường sức đề kháng',
              'Xây dựng thói quen đi chợ không rác thải nhựa',
              'Phân biệt rau hữu cơ và rau sạch chuẩn VietGAP',
            ].map((title, index) => (
              <article key={title} className={`rounded-[24px] p-6 ${index === 1 ? 'bg-[#2d6a4f] text-white' : 'bg-[#efeded]'}`}>
                <p className="text-xs font-semibold uppercase opacity-70">Lối sống</p>
                <h3 className="mt-3 text-xl font-bold leading-7">{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
