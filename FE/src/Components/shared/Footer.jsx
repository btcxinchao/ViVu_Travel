import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaYoutube, FaPhone, FaLocationDot, SiGmail } from "../../assets/Icons/Icons";

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#f59e0b] flex items-center justify-center text-white">
                <FaLocationDot />
              </div>
              <span className="text-xl font-bold">ViVu Travel</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nền tảng đặt dịch vụ du lịch trực tuyến hàng đầu Việt Nam. Kết nối khách hàng với nhà cung cấp dịch vụ uy tín trên toàn quốc.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Link to="/" className="w-[24px] h-[24px]"><FaFacebook /></Link>
              <Link to="/" className="w-[24px] h-[24px]"><FaInstagram /></Link>
              <Link to="/" className="w-[24px] h-[24px]"><FaYoutube /></Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Dịch Vụ</h4>
            <ul className="flex flex-col space-y-2 text-sm">
              <li><span className="hover:text-[#f97316] transition-colors">Tour du lịch</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Khách sạn & Resort</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Vé tham quan</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Gợi ý theo mùa</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="flex flex-col space-y-2 text-sm">
              <li><span className="hover:text-[#f97316] transition-colors">Trung tâm trợ giúp</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Chính sách hoàn tiền</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Điều khoản dịch vụ</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Chính sách bảo mật</span></li>
              <li><span className="hover:text-[#f97316] transition-colors">Đăng ký làm đối tác</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Liên Hệ</h4>
            <ul className="flex flex-col space-y-3 text-sm">
              <li>
                <span className="flex items-start gap-2">
                  <FaLocationDot className="mt-1" />
                  <span>Tòa Nhà Travel , Đà Nẵng </span>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2">
                  <FaPhone />
                  <span>0349970387 (Miễn phí)</span>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2">
                  <SiGmail />
                  <span>buitanchuong@vivu.vn</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 ViVu Travel. Được phát triển bởi Nhóm 116 - Trường KHMT.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png" alt="" className="h-6 opacity-60" />
            <span>Hỗ trợ thanh toán VNPAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;