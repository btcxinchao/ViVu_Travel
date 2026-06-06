import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const menu = [
    { id: "tongquan", label: "Tổng quan", path: "/provider" },
    { id: "dichvu", label: "Dịch vụ", path: "/provider/services" },
    { id: "lich", label: "Lịch khởi hành", path: "/provider/schedule" },
    { id: "datcho", label: "Đặt chỗ", path: "/provider/booking", badge: 1 },
    { id: "coupon", label: "Mã giảm giá", path: "/provider/coupons" },
    { id: "doanhthu", label: "Doanh thu", path: "/provider/revenue" },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-[#1a1a2e] text-white">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm text-white/70">
          {currentUser?.fullName || "Công ty Du lịch Hạ Long"}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.path === "/provider"}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "border-l-4 border-orange-500 bg-gradient-to-r from-orange-500/30 to-yellow-500/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

     
    </div>
  );
}
