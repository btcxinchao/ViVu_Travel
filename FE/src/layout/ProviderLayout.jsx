import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { jwt } from "../utils/jwt.js";
import Header from "../Components/shared/Header.jsx";
import {
  FaArrowRightFromBracket,
  FaBell,
  FaCalendarDays,
  FaChartLine,
  FaLocationDot,
  FaPercent,
  FaTicket,
  FaXmark,
  FaBriefcase,
  FaWallet,
  FaTableColumns,
} from "react-icons/fa6";

const DARK = "#1a1a2e";
const ORANGE = "#f97316";

function ProviderLayout() {
  const user = jwt();
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  })();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [providerProfile, setProviderProfile] = useState(null);

  const NAV_ITEMS = useMemo(
    () => [
      {
        id: "revenue",
        label: "Doanh thu",
        path: "/provider/revenue",
        icon: FaWallet,
      },
      {
        id: "services",
        label: "Dịch vụ",
        path: "/provider/services",
        icon: FaBriefcase,
      },
      {
        id: "schedule",
        label: "Lịch khởi hành",
        path: "/provider/schedule",
        icon: FaCalendarDays,
      },
      {
        id: "bookings",
        label: "Đặt chỗ",
        path: "/provider/booking",
        icon: FaTicket,
      },
      {
        id: "coupons",
        label: "Mã giảm giá",
        path: "/provider/coupons",
        icon: FaPercent,
      },
      {
        id: "reconciliation",
        label: "Đối soát thanh toán",
        path: "/provider/reconciliation",
        icon: FaTableColumns,
      },
    ],
    [],
  );

  const activeItem =
    NAV_ITEMS.find((item) => {
      if (location.pathname.toLowerCase() === "/provider") {
        return item.id === "revenue";
      }
      return location.pathname
        .toLowerCase()
        .startsWith(item.path.toLowerCase());
    }) || NAV_ITEMS[0];

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const fetchSidebarMeta = async () => {
      try {
        const ordersRes = await fetch("/api/orders/provider", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const ordersResult = await ordersRes.json();
        if (ordersRes.ok) {
          const orders = Array.isArray(ordersResult.data)
            ? ordersResult.data
            : [];
          setPendingBookings(
            orders.filter((order) => order.status === "awaiting_confirm")
              .length,
          );
        }

        const profileRes = await fetch("/api/provider/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profileResult = await profileRes.json();
        if (profileRes.ok) {
          const profile = profileResult.data || null;
          setProviderProfile(profile);
          if (profile) {
            localStorage.setItem(
              "currentUser",
              JSON.stringify({
                ...(currentUser || {}),
                providerProfile: {
                  id: profile._id,
                  businessName: profile.businessName,
                  legalRepresentative: profile.legalRepresentative,
                },
              }),
            );
          }
        }
      } catch {
        setPendingBookings(0);
      }
    };

    fetchSidebarMeta();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    window.location.reload();
  };

  const providerName =
    providerProfile?.providerID?.fullName ||
    currentUser?.fullName ||
    user?.fullName ||
    providerProfile?.legalRepresentative ||
    currentUser?.providerProfile?.legalRepresentative ||
    currentUser?.legalRepresentative ||
    "Đối tác";

  const providerInitial =
    String(providerName || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <div
      className="min-h-screen bg-[#f8fafc] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Header variant="dashboard" />

      <div className="relative flex flex-1 min-h-0">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-64 flex-col overflow-hidden transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            background: "#ffffff",
            borderRight: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
          }}
        >
          <div
            className="mx-4 mb-2 mt-4 rounded-2xl px-4 py-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(245,158,11,0.04))",
              border: "1px solid rgba(249,115,22,0.14)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#f59e0b] text-[13px] font-bold text-white shadow-sm">
                {providerInitial}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {providerName}
                </p>
                <p className="text-[11px] text-slate-500">Đối tác</p>
              </div>
            </div>
          </div>

          {pendingBookings > 0 ? (
            <div
              className="mx-4 mb-2 flex items-center gap-2.5 rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              <FaBell size={14} className="shrink-0 text-amber-500" />
              <p className="text-[12px] text-amber-700">
                <span className="font-semibold">{pendingBookings}</span> booking
                chờ xác nhận
              </p>
            </div>
          ) : null}

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = activeItem.id === item.id;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === "/provider"}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 text-[#f97316] shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={
                    isActive
                      ? {
                          borderLeft: `3px solid ${ORANGE}`,
                        }
                      : { borderLeft: "3px solid transparent" }
                  }
                >
                  <Icon
                    size={16}
                    style={isActive ? { color: ORANGE } : { color: "#64748b" }}
                  />
                  <span>{item.label}</span>
                  {item.id === "bookings" && pendingBookings > 0 ? (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white shadow-sm">
                      {pendingBookings}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProviderLayout;
