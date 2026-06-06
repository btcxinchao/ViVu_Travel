import React from "react";
import about from "../../assets/image/about.png";
import introduce from "../../assets/image/introduce.avif";

const About = () => {
  return (
    <div>
      {/* HEADER */}
      <section className="relative h-[400px]">
        <img
          src={about}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative h-full flex flex-col justify-center items-center text-center text-white px-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Về <span className="text-orange-500">chúng tôi</span>
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Câu chuyện và sứ mệnh của VIVU Travel
          </p>
        </div>
      </section>

      {/* GIỚI THIỆU */}
      <section className="container-custom py-20 grid md:grid-cols-2 gap-16 items-center">
        <div className="overflow-hidden rounded-3xl aspect-[4/3]">
          <img
            src={introduce}
            alt=""
            className="w-full h-full object-cover object-[50%_35%]"
          />
        </div>

        <div>
          <span className="text-orange-500 text-sm font-semibold tracking-widest">
            CÂU CHUYỆN CỦA CHÚNG TÔI
          </span>

          <h2 className="mt-3 mb-6 text-4xl md:text-5xl font-bold leading-tight text-[#1A1A2E] ">
            ViVu Travel  đồng hành cùng{" "}
            <span className="text-orange-500">hành trình</span> của bạn
          </h2>

          <p className="text-gray-500 mb-4 leading-relaxed">
            ViVu Travel được thành lập năm 2026 với niềm đam mê mang đến những
            trải nghiệm du lịch chất lượng cao cho người Việt. ViVu Travel được phát triển bời team 117 Đại Học Duy Tân 
            <br />
           
          </p>

          <p className="text-gray-500 leading-relaxed">
            Mỗi chuyến đi là một câu chuyện, mỗi điểm đến là một khám phá.
          </p>
        </div>
      </section>

      {/* SỨ MỆNH */}
      <section className="bg-gray-50 py-20">
        <div className="container-custom grid md:grid-cols-2 gap-8">
          {[
            {
              title: "Sứ mệnh",
              desc: "Mang đến trải nghiệm du lịch tuyệt vời nhất với dịch vụ chuyên nghiệp.",
            },
            {
              title: "Tầm nhìn",
              desc: "Trở thành thương hiệu du lịch hàng đầu Việt Nam.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-orange-100 flex items-center justify-center" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-20">
        <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["10+", "Năm kinh nghiệm"],
            ["500+", "Tour du lịch"],
            ["50K+", "Khách hàng"],
            ["100+", "Điểm đến"],
          ].map(([num, label], i) => (
            <div key={i}>
              <p className="text-orange-500 text-4xl font-bold">{num}</p>
              <p className="text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-gray-50 py-20">
        <div className="container-custom text-center">
          <span className="text-orange-500 text-sm font-semibold tracking-widest">
            ĐỘI NGŨ
          </span>

          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-12 font-serif">
            Gặp gỡ <span className="text-orange-500">đội ngũ</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Nguyễn Văn An", role: "CEO" },
              { name: "Trần Thị Bích", role: "COO" },
              { name: "Lê Minh Tuấn", role: "Tour Manager" },
              { name: "Phạm Thị Lan", role: "Marketing" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="avatar">
                  {item.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(-2)
                    .join("")}
                </div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-gray-500 text-sm">{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
