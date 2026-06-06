import { Link, useLocation } from "react-router-dom";

const ROOT_ROUTES = {
  admin: {
    label: "Dashboard",
    to: "/admin",
  },
  provider: {
    label: "Quản lý",
    to: "/provider",
  },
  user: {
    label: "Dashboard",
    to: "/user/dashboard",
  },
};

const PAGE_LABELS = {
  dashboard: "Dashboard",
  servicemanager: "Quản lý dịch vụ",
  accountmanager: "Quản lý tài khoản",
  bookingmanager: "Quản lý đặt chỗ",
  services: "Dịch vụ",
  addservices: "Thêm dịch vụ",
  editservices: "Chỉnh sửa dịch vụ",
  detailservices: "Chi tiết dịch vụ",
  schedule: "Lịch khởi hành",
  booking: "Đặt chỗ",
  coupons: "Mã giảm giá",
  revenue: "Doanh thu",
  reconciliation: "Đối soát thanh toán",
};

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const [scope, section] = segments;
  const rootRoute = ROOT_ROUTES[scope];

  if (
    !rootRoute ||
    !section ||
    pathname.toLowerCase() === rootRoute.to.toLowerCase()
  ) {
    return null;
  }

  const normalizedSection = section.toLowerCase();

  return (
    <div className="mb-2 flex items-center gap-1.5 text-[13px] leading-none">
      <Link
        to={rootRoute.to}
        className="text-slate-400 transition hover:text-slate-600"
      >
        {rootRoute.label}
      </Link>

      <span className="text-slate-300">{">"}</span>

      <span className="text-[#f97316]">
        {PAGE_LABELS[normalizedSection] || section}
      </span>
    </div>
  );
}

export default Breadcrumb;
