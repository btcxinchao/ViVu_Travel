import React from "react";
import {
  FaHeadset,
  FaMapLocationDot,
  FaRegHandshake,
  FaShieldHeart,
} from "react-icons/fa6";

const aboutHeroImage =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=85";
const introduceImage =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85";

const aboutSections = [
  {
    icon: FaRegHandshake,
    title: "Chúng tôi là ai",
    desc: "ViVu Travel là nền tảng kết nối khách hàng với các dịch vụ du lịch chất lượng, được phát triển bởi Team 117 Đại học Duy Tân. Chúng tôi xây dựng sản phẩm với mục tiêu giúp việc tìm kiếm, đặt tour và quản lý hành trình trở nên đơn giản hơn.",
  },
  {
    icon: FaMapLocationDot,
    title: "Chúng tôi làm gì",
    desc: "Chúng tôi cung cấp thông tin điểm đến, tour du lịch, lịch khởi hành và công cụ đặt dịch vụ trực tuyến. ViVu Travel cũng hỗ trợ nhà cung cấp đăng tải dịch vụ, quản lý booking và tiếp cận nhiều khách hàng hơn.",
  },
  {
    icon: FaShieldHeart,
    title: "Tại sao nên chọn chúng tôi",
    desc: "ViVu Travel ưu tiên trải nghiệm rõ ràng, thông tin minh bạch và quy trình đặt dịch vụ thuận tiện. Mỗi lựa chọn đều hướng đến sự an tâm của khách hàng và khả năng vận hành hiệu quả cho đối tác.",
  },
];

const strengths = [
  "Dịch vụ du lịch được trình bày rõ ràng, dễ so sánh.",
  "Quy trình đặt tour nhanh, thuận tiện và dễ theo dõi.",
  "Kết nối khách hàng với nhà cung cấp trong cùng một nền tảng.",
  "Đội ngũ phát triển luôn cải thiện sản phẩm theo nhu cầu thực tế.",
];

const About = () => {
  return (
    <main className="bg-white">
      <section className="relative h-[360px] overflow-hidden md:h-[420px]">
        <img
          src={aboutHeroImage}
          alt="Về ViVu Travel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a1a2e]/65" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 text-white">
          <span className="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-widest text-orange-200 backdrop-blur-sm">
            VIVU TRAVEL
          </span>
          <h1 className="max-w-2xl text-[clamp(34px,5vw,56px)] font-bold leading-tight">
            Về <span className="text-[#f97316]">chúng tôi</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
            Đồng hành cùng khách hàng trong những hành trình đáng nhớ và giúp
            đối tác du lịch vận hành dịch vụ hiệu quả hơn.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={introduceImage}
              alt="Khách du lịch trong hành trình khám phá"
              className="h-[320px] w-full object-cover object-center md:h-[360px] lg:h-[380px]"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold tracking-widest text-[#f97316]">
              CÂU CHUYỆN CỦA CHÚNG TÔI
            </span>
            <h2 className="mt-3 text-[clamp(30px,4vw,46px)] font-bold leading-tight text-[#1a1a2e]">
              ViVu Travel đồng hành cùng{" "}
              <span className="text-[#f97316]">hành trình</span> của bạn
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-600">
              Chúng tôi tin rằng mỗi chuyến đi nên bắt đầu từ sự rõ ràng: rõ
              điểm đến, rõ dịch vụ, rõ chi phí và rõ lịch trình. Vì vậy, ViVu
              Travel tập trung xây dựng một trải nghiệm đặt dịch vụ du lịch dễ
              dùng, đáng tin cậy và phù hợp với nhu cầu của người Việt.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Từ khách hàng muốn tìm một chuyến đi phù hợp đến nhà cung cấp
              muốn quản lý dịch vụ tốt hơn, ViVu Travel là cầu nối giúp hai bên
              gặp nhau nhanh chóng và hiệu quả.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold tracking-widest text-[#f97316]">
              GIÁ TRỊ CỐT LÕI
            </span>
            <h2 className="mt-3 text-[clamp(28px,4vw,40px)] font-bold text-[#1a1a2e]">
              Những điều ViVu Travel đang xây dựng
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {aboutSections.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl text-[#f97316]">
                    <Icon />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a2e]">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="text-sm font-semibold tracking-widest text-[#f97316]">
              LÝ DO LỰA CHỌN
            </span>
            <h2 className="mt-3 text-[clamp(28px,4vw,40px)] font-bold leading-tight text-[#1a1a2e]">
              Tại sao nên chọn{" "}
              <span className="text-[#f97316]">ViVu Travel</span>
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Chúng tôi không chỉ tạo một trang đặt tour, mà còn xây dựng một
              hệ thống giúp khách hàng và đối tác thao tác thuận tiện hơn trong
              toàn bộ quá trình du lịch.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {strengths.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1a1a2e] py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold tracking-widest text-orange-300">
              SẴN SÀNG KHÁM PHÁ
            </span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Bắt đầu hành trình tiếp theo cùng ViVu Travel
            </h2>
            <div className="mt-5 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white/85">
              <FaHeadset className="text-xl text-[#f97316]" />
              <span>Hỗ trợ khách hàng và đối tác trong từng bước sử dụng.</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center md:min-w-[360px]">
            <div className="rounded-2xl bg-white/5 px-4 py-5">
              <p className="text-2xl font-bold text-[#f97316]">100+</p>
              <p className="mt-1 text-sm text-white/65">Dịch vụ</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-5">
              <p className="text-2xl font-bold text-[#f97316]">50K+</p>
              <p className="mt-1 text-sm text-white/65">Khách hàng</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-5">
              <p className="text-2xl font-bold text-[#f97316]">4.9</p>
              <p className="mt-1 text-sm text-white/65">Đánh giá</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
