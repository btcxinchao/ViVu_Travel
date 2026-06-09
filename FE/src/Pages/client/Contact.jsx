import React, { useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const contactHeroImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=85";

const infomationContact = [
  {
    main: "Địa chỉ",
    Icon: <FaMapMarkerAlt className="text-[#f97316] text-xl" />,
    title: "123 Nguyễn Huệ, Q.1",
    title_Child: "TP.Hồ Chí Minh",
  },
  {
    main: "Số Điện Thoại",
    Icon: <FaPhoneAlt className="text-[#f97316] text-xl" />,
    title: "1900 1234",
    title_Child: "0901 234 567",
  },
  {
    main: "Email",
    Icon: <FaEnvelope className="text-[#f97316] text-xl" />,
    title: "hello@vivutravel.vn",
    title_Child: "support@vivutravel.vn",
  },
  {
    main: "Giờ làm việc",
    Icon: <FaClock className="text-[#f97316] text-xl" />,
    title: "T2 - T7: 8:00 - 18:00",
    title_Child: "CN: 9:00 - 15:00",
  },
];
const Contact = () => {
  const [from, setfrom] = useState({
    FullName: "",
    Email: "",
    PhoneNumber: "",
    Noted: "",
  });
  {
    console.log(from);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setfrom({
      ...from,
      [name]: value,
    });
  };
  return (
    <div>
      {/* HEADER */}
      <section className="relative flex h-[400px] items-center justify-center overflow-hidden text-center">
        <img
          src={contactHeroImage}
          alt="Liên hệ ViVu Travel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a1a2e]/70" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-white font-serif text-[clamp(30px,5vw,48px)] font-bold">
            Liên <span className="text-[#f97316]">Hệ</span>
          </h1>

          <p className="text-white/60 mt-4 text-base">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-[#f3f4f6] py-20 px-30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          {/* LEFT */}
          <div className="space-y-8">
            {infomationContact.map((item, index) => {
              return (
                <div
                  key={index}
                  className="flex gap-5 items-center hover:translate-x-1 transition"
                >
                  <div className="w-14 h-14 min-w-[56px] rounded-2xl bg-[#f97316]/10 flex items-center justify-center">
                    {item.Icon}
                  </div>

                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-[#1a1a2e]">
                      {item.main}
                    </h4>
                    <div className="text-gray-500 text-[15px] leading-6">
                      <p>{item.title}</p>
                      <p>{item.title_Child}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT */}
          <div className="text-left">
            <form className="bg-white rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition duration-300 mr-[20px]">
              <h3 className="text-2xl font-semibold mb-6 text-[#1a1a2e]">
                Gửi tin nhắn cho chúng tôi
              </h3>

              {/* Row */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-500"><RequiredLabel>Họ tên</RequiredLabel></label>
                  <input
                    maxLength={20}
                    name="FullName"
                    value={from.FullName}
                    type="text"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-500"><RequiredLabel>Email</RequiredLabel></label>
                  <input
                    type="email"
                    name="Email"
                    value={from.Email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition"
                  />
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm text-gray-500"><RequiredLabel>Số điện thoại</RequiredLabel></label>
                <input
                  type="type"
                  name="PhoneNumber"
                  value={from.PhoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition"
                />
              </div>

              <div className="mb-6 flex flex-col gap-1.5">
                <label className="text-sm text-gray-500"><RequiredLabel>Tin nhắn</RequiredLabel></label>
                <textarea
                  name="Noted"
                  value={from.Noted}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition"
                ></textarea>
              </div>

              <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition duration-300">
                Gửi tin nhắn
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
