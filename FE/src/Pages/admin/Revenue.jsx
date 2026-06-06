import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";
import {
  FaClock,
  FaCircleCheck,
  FaDollarSign,
  FaFilter,
  FaCalendarDays,
  FaPercent,
} from "react-icons/fa6";

import { formatVND } from "../../utils/money";

const fmtDateTime = (value) => {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const txMetaMap = {
  payment: {
    label: "Thanh toán",
    className: "bg-blue-50 text-blue-600",
    direction: "in",
  },
  commission: {
    label: "Phí sàn",
    className: "bg-purple-50 text-purple-600",
    direction: "in",
  },
  payout: {
    label: "Giải ngân",
    className: "bg-orange-50 text-orange-600",
    direction: "out",
  },
  refund: {
    label: "Hoàn tiền",
    className: "bg-amber-50 text-amber-600",
    direction: "out",
  },
};

const currentMonthKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const getMonthKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
};

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-50 bg-white p-3 shadow-sm">
      <div className="mb-0 flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}18` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <p
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: "#1a1a2e",
            textAlign: "center",
          }}
        >
          {formatVND(value)}
        </p>
      </div>
      <p className="mt-1 text-slate-500" style={{ fontSize: 12 }}>
        {label}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon = FaFilter, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Icon size={22} className="text-slate-300" />
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

function MonthPicker({ value, onChange }) {
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="pointer-events-none flex h-full w-full items-center justify-center bg-orange-50 text-orange-500">
        <FaCalendarDays size={16} />
      </div>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Lọc theo tháng"
        title={`Lọc theo tháng: ${value || "Tất cả"}`}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function Revenue() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/stats/admin", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch("/api/orders/admin", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const statsResult = await statsRes.json();
        const ordersResult = await ordersRes.json();

        if (!statsRes.ok) {
          throw new Error(statsResult.message || "Không thể tải thống kê doanh thu");
        }

        if (!ordersRes.ok) {
          throw new Error(ordersResult.message || "Không thể tải danh sách đơn hàng");
        }

        setStats(statsResult.data || null);
        setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
      } catch (err) {
        setError(err?.message || "Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  const filteredOrders = useMemo(() => {
    if (!selectedMonth) return orders;
    return orders.filter((order) => getMonthKey(order?.createdAt) === selectedMonth);
  }, [orders, selectedMonth]);

  const filteredStats = useMemo(() => {
    const commissionRate = Number(stats?.commissionRate || 0.2);
    const totals = {
      totalCollectedRevenue: 0,
      commissionRevenue: 0,
      refundedRevenue: 0,
      providerPayout: 0,
      heldRevenue: 0,
    };

    filteredOrders.forEach((order) => {
      const totalAmount = Number(order?.totalPrice || 0);
      const commissionAmount = Math.floor(totalAmount * commissionRate);
      const providerNet = Math.max(totalAmount - commissionAmount, 0);
      const isRefunded = [
        order?.refundStatus,
        order?.paymentStatus,
        order?.settlementStatus,
        order?.escrowStatus,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value === "succeeded" || value === "refunded");
      const isPaid = order?.paymentStatus === "paid" && !isRefunded;

      if (isPaid) {
        totals.totalCollectedRevenue += totalAmount;
        totals.commissionRevenue += commissionAmount;
      }

      if (isPaid && order?.status === "completed") {
        totals.providerPayout += providerNet;
      }

      if (isRefunded || Number(order?.refundAmount || 0) > 0) {
        totals.refundedRevenue += Number(order?.refundAmount || 0);
      }

      if (isPaid && ["awaiting_payment", "awaiting_confirm", "confirmed"].includes(String(order?.status || ""))) {
        totals.heldRevenue += totalAmount;
      }
    });

    return totals;
  }, [filteredOrders, stats?.commissionRate]);

  const displayTotalCollected = filteredStats.totalCollectedRevenue;
  const displayCommissionRevenue = filteredStats.commissionRevenue;
  const displayRefundedRevenue = filteredStats.refundedRevenue;
  const displayProviderPayout = filteredStats.providerPayout;
  const displayHeldRevenue = filteredStats.heldRevenue;
  const displayRevenueValue = displayTotalCollected;

  const historyRows = useMemo(() => {
    const commissionRate = Number(stats?.commissionRate || 0.2);

    const getCustomerName = (order) =>
      order?.customerInfo?.name || order?.userId?.fullName || "Khách hàng";
    const getProviderName = (order) =>
      order?.provider_id?.fullName || "Provider";
    const getServiceName = (order) =>
      order?.serviceId?.serviceName ||
      order?.tourSnapshot?.name ||
      "Không có tên tour";

    const rows = [...filteredOrders].flatMap((order) => {
      const orderId = order?._id || order?.id;
      const customerName = getCustomerName(order);
      const providerName = getProviderName(order);
      const serviceName = getServiceName(order);
      const providerRole = order?.provider_id?.role || "provider";
      const userRole = order?.userId?.role || "user";
      const orderDate = order?.createdAt || null;
      const completedDate = order?.settledAt || order?.updatedAt || order?.createdAt || null;
      const refundDate = order?.refundCompletedAt || order?.refundedAt || order?.updatedAt || order?.createdAt || null;
      const totalAmount = Number(order?.totalPrice || 0);
      const commissionAmount = Math.floor(totalAmount * commissionRate);
      const providerNet = Math.max(totalAmount - commissionAmount, 0);

      const isRefunded = [
        order?.refundStatus,
        order?.paymentStatus,
        order?.settlementStatus,
        order?.escrowStatus,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value === "succeeded" || value === "refunded");
      const isPaid = order?.paymentStatus === "paid" && !isRefunded;

      const paymentRow =
        isPaid
          ? {
              id: `payment-${orderId}`,
              type: "payment",
              name: customerName,
              role: userRole,
              title: "Thanh toán",
              note: `Khách hàng đã thanh toán cho tour ${serviceName}`,
              amount: totalAmount,
              createdAt: orderDate,
              statusText: "Đã thanh toán",
            }
          : null;

      const payoutRow =
        order?.status === "completed"
          ? {
              id: `payout-${orderId}`,
              type: "payout",
              name: providerName,
              role: providerRole,
              title: "Giải ngân",
              note: `Giải ngân cho đối tác ${providerName}`,
              amount: providerNet,
              createdAt: completedDate,
              statusText: "Đã giải ngân",
            }
          : null;

      const refundRow =
        isRefunded || Number(order?.refundAmount || 0) > 0
          ? {
              id: `refund-${orderId}`,
              type: "refund",
              name: customerName,
              role: userRole,
              title: "Hoàn tiền",
              note: `Hoàn tiền cho khách hàng ${customerName} của tour ${serviceName}`,
              amount: Number(order?.refundAmount || 0),
              createdAt: refundDate,
              statusText: "Đã hoàn tiền",
            }
          : null;

      return [paymentRow, payoutRow, refundRow].filter(Boolean);
    });

    return rows
      .filter((item) => {
        if (!search) return true;
        const keyword = search.trim().toLowerCase();
        return (
          item.note.toLowerCase().includes(keyword) ||
          item.title.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [filteredOrders, search, stats?.commissionRate]);

  if (loading) {
    return (
      <div>
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <Breadcrumb />
            <h1 className="text-left text-xl font-semibold text-slate-900">
              Doanh thu hệ thống
            </h1>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
            Đang tải dữ liệu doanh thu...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-left ml-4 text-2xl font-semibold text-slate-900">
            Doanh thu hệ thống
          </h1>
          
        </div>

        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="space-y-3 p-3">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-50 bg-white p-3 shadow-sm">
  <div className="mb-0 flex items-start justify-between gap-3">
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl"
      style={{ background: "#f9731618" }}
    >
      <FaDollarSign size={18} style={{ color: "#f97316" }} />
    </div>
    <p
      style={{
        fontSize: 19,
        fontWeight: 700,
        color: "#1a1a2e",
        textAlign: "center",
      }}
    >
      {formatVND(displayRevenueValue)}
    </p>
            </div>
            <p className="mt-1 text-slate-500" style={{ fontSize: 12 }}>
              Tổng doanh thu gross của tháng đang chọn
            </p>
          </div>
          <MetricCard label="Hoa hồng đã thu" value={displayCommissionRevenue} icon={FaPercent} color="#10b981" />
          <MetricCard label="Đang giữ hộ" value={displayHeldRevenue} icon={FaClock} color="#3b82f6" />
          <MetricCard label="Hoàn tiền" value={displayRefundedRevenue} icon={FaDollarSign} color="#f59e0b" />
          <MetricCard label="Đã giải ngân" value={displayProviderPayout} icon={FaCircleCheck} color="#8b5cf6" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Lịch sử giao dịch
              </h3>
              <p className="text-xs text-slate-500">
                Gồm thanh toán, giải ngân và hoàn tiền của toàn hệ thống.
              </p>
            </div>

            <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <FaFilter className="text-slate-400" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mô tả giao dịch..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-2 py-2">Tên</th>
                  <th className="px-2 py-2">Mô tả ngắn gọn</th>
                  <th className="px-2 py-2">Loại</th>
                  <th className="px-2 py-2">Số tiền</th>
                  <th className="px-2 py-2">Trạng thái</th>
                  <th className="px-2 py-2">Ngày giờ</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6">
                      <EmptyState
                        icon={FaFilter}
                        title="Chưa có lịch sử giao dịch"
                        description="Hệ thống sẽ hiển thị các khoản thanh toán, giải ngân và hoàn tiền ở đây."
                      />
                    </td>
                  </tr>
                ) : (
                  historyRows.map((item) => {
                    const meta = txMetaMap[item.type] || txMetaMap.payment;
                    const isIn = meta.direction === "in";

                    return (
                      <tr key={item.id} className="rounded-2xl bg-slate-50/80">
                        <td className="rounded-l-2xl px-2 py-3 text-[12px] font-medium text-slate-700">
                          <div className="font-medium leading-tight">{item.name || "-"}</div>
                          <div className="text-[11px] text-slate-500">
                            ({String(item.role || "-").toUpperCase()})
                          </div>
                        </td>
                        <td className="px-2 py-3 text-left text-[12px] text-slate-600">
                          <div className="max-w-[420px] truncate text-left">{item.note}</div>
                        </td>
                        <td className="px-2 py-3 text-[12px] text-slate-600">
                          {item.title || meta.label}
                        </td>
                        <td
                          className="px-2 py-3 text-[12px] font-semibold"
                          style={{ color: isIn ? "#10b981" : "#ef4444" }}
                        >
                          {isIn ? "+" : "-"}
                          {formatVND(item.amount)}
                        </td>
                        <td className="px-2 py-3 text-[12px] text-slate-600">
                          {item.statusText || meta.label}
                        </td>
                        <td className="rounded-r-2xl px-2 py-3 text-[12px] text-slate-500">
                          {fmtDateTime(item.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Revenue;


