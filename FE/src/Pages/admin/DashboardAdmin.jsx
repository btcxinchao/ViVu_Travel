import { useState } from "react";
import {
  IoBarChartOutline,
  IoPeopleOutline,
  IoPricetagOutline,
  IoShieldCheckmarkOutline,
  IoTicketOutline,
  IoBusinessOutline,
  IoWalletOutline,
} from "react-icons/io5";

import TotalSystem from "./TotalSystem";
import Revenue from "./Revenue";
import ServiceManagement from "./ServiceManagement";
import AccountManagement from "./AccountManagement";
import BookingManagement from "./BookingManagement";
import ProviderManagement from "./ProviderManagement";
import RevenueByProvider from "./RevenueByProvider";

const tabs = [
  { id: "overview", label: "Tổng quan", icon: IoBarChartOutline },
  { id: "services", label: "Dịch vụ", icon: IoPricetagOutline },
  { id: "revenue", label: "Doanh thu", icon: IoWalletOutline },
  { id: "provider-revenue", label: "Doanh thu Provider", icon: IoBusinessOutline },
  { id: "accounts", label: "Tài khoản", icon: IoPeopleOutline },
  { id: "providers", label: "Nhà cung cấp", icon: IoBusinessOutline },
  { id: "bookings", label: "Đơn hàng", icon: IoTicketOutline },
];

const DashboardAdmin = ({ initialTab = "overview" } = {}) => {
  const [tab, setTab] = useState(initialTab);
  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-7xl px-6 pt-0 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
            <IoShieldCheckmarkOutline className="text-xl" />
          </div>
          <div>
            <h1 className="my-5 text-3xl font-bold text-slate-900">
              Admin <span className="text-orange-500">Dashboard</span>
            </h1>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-[#eef2f7] p-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-white text-orange-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="text-base" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className={cardClass}>
          {tab === "overview" ? <TotalSystem /> : null}
          {tab === "revenue" ? <Revenue /> : null}
          {tab === "provider-revenue" ? <RevenueByProvider /> : null}
          {tab === "services" ? <ServiceManagement /> : null}
          {tab === "accounts" ? <AccountManagement /> : null}
          {tab === "providers" ? <ProviderManagement /> : null}
          {tab === "bookings" ? <BookingManagement /> : null}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
