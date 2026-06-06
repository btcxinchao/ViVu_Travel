import {
  FaLocationDot,
  FaRegStar,
  FaPhone,
  FaUser,
  CiLogin,
} from "../../assets/Icons/Icons";
import { MdOutlineDashboard } from "react-icons/md";
import { SiGmail } from "react-icons/si";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { clearAuth, useAuthStorage } from "../../utils/authStorage.js";

function Header({ variant = "default" }) {
  const navigate = useNavigate();
  const { accessToken, currentUser, user } = useAuthStorage();
  const isCheck = !!accessToken;
  const isDashboardHeader = variant === "dashboard";

  const Logout = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "text-[#f97316] font-semibold border-b-2 border-[#f97316] pb-1"
      : "hover:text-[#f97316] transition-colors";
  const logoPath = isDashboardHeader
    ? user?.role === "admin"
      ? "/admin"
      : "/provider"
    : "/";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      {!isDashboardHeader && (
        <div className="bg-[#1a1a2e] text-white/80 hidden md:block text-[15px]">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-6 px-2">
              <span className="flex items-center gap-1">
                <FaPhone />
                1900 1234
              </span>
              <span className="flex items-center gap-1">
                <SiGmail />
                hello@vivutravel.vn
              </span>
            </div>

            {!isCheck ? null : (
              <span className="flex items-center gap-1">
                <span className="flex items-center gap-1">
                  Xin chào <FaUser />
                  <span className="text-[#f97316] ">
                    {currentUser?.fullName || user?.fullName}
                  </span>
                </span>
                <span className="ml-2 px-2 py-0.5 bg-white/10 rounded text-[11px]">
                  {user?.role === "user" ? "Khách hàng" : ""}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main header */}
      <header
        className={`flex justify-between ${
          isDashboardHeader
            ? "w-full px-4 sm:px-6"
            : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center">
          <Link to={logoPath} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#f59e0b] flex items-center justify-center text-white">
              <FaLocationDot />
            </div>

            <span className="text-xl font-bold">
              <span className="text-black">ViVu</span>
              <span className="text-[#f97316]">Travel</span>
            </span>
          </Link>
        </div>

        {!isDashboardHeader && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navClass}>
              Trang Chủ
            </NavLink>

            <NavLink to="/destination" className={navClass}>
              Điểm Đến
            </NavLink>

            <NavLink to="/about" className={navClass}>
              Về Chúng Tôi
            </NavLink>

            <NavLink to="/contact" className={navClass}>
              Liên Hệ
            </NavLink>
          </div>
        )}

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {!isCheck ? (
            <>
              <NavLink
                to="/signin"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#f97316] font-semibold"
                    : "text-gray-600 hover:text-[#f97316] px-4 py-2"
                }
              >
                Đăng nhập
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive
                    ? "px-5 py-2 bg-[#f97316] text-white rounded-full"
                    : "px-5 py-2 bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white rounded-full hover:shadow-lg hover:shadow-orange-200 transition-all"
                }
              >
                Đăng ký
              </NavLink>
            </>
          ) : (
            <>
              {user?.role === "user" ? (
                <NavLink
                  to="/user/dashboard"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full border transition-colors ${
                      isActive
                        ? "border-[#f97316] text-[#f97316] bg-orange-50"
                        : "border-gray-200 text-gray-600 hover:border-[#f97316] hover:text-[#f97316]"
                    }`
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <MdOutlineDashboard className="text-base" />
                    Dashboard
                  </span>
                </NavLink>
              ) : null}

              <button
                onClick={Logout}
                className="flex items-center gap-1.5 px-2 py-2 text-muted-foreground hover:text-[#ef4444] transition-colors"
              >
                <CiLogin />
                Đăng xuất
              </button>
            </>
          )}
        </div>
      </header>
    </nav>
  );
}

export default Header;
