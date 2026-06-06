import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaCalendarDays,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateRight,
} from "react-icons/fa6";

const ACTIVE_BOOKING_STATUSES = [
  "awaiting_payment",
  "awaiting_confirm",
  "confirmed",
];
const COMMISSION_RATE = 0.2;

const fmtVND = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const toMoney = (value) => Math.max(0, Math.floor(Number(value || 0)));

const calcCommission = (gross) => Math.floor(toMoney(gross) * COMMISSION_RATE);

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

const providerLabel = (order) =>
  order?.provider_id?.fullName ||
  order?.provider_id?.name ||
  order?.providerName ||
  order?.partnerName ||
  "Chưa có tên provider";

function RevenueByProvider() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [revenueMode, setRevenueMode] = useState("gross");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const accessToken = localStorage.getItem("accessToken");

  const reloadData = async () => {
    try {
      setLoading(true);
      setError("");

      const ordersRes = await fetch("/api/orders/admin", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const ordersResult = await ordersRes.json();

      if (!ordersRes.ok) {
        throw new Error(
          ordersResult.message || "Không thể tải danh sách đơn hàng",
        );
      }

      setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu theo provider");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!selectedMonth) return orders;
    return orders.filter((order) => getMonthKey(order?.createdAt) === selectedMonth);
  }, [orders, selectedMonth]);

  const providerRows = useMemo(() => {
    const map = new Map();

    const ensureProvider = (key, name) => {
      if (!map.has(key)) {
        map.set(key, {
          providerId: key,
          providerName: name || "Chưa có tên provider",
          totalRevenue: 0,
          completedRevenue: 0,
          commissionRevenue: 0,
          refundRevenue: 0,
          heldRevenue: 0,
          completedOrders: 0,
          activeOrders: 0,
          totalOrders: 0,
        });
      }
      return map.get(key);
    };

    filteredOrders.forEach((order) => {
      const providerId = String(
        order?.provider_id?._id ||
          order?.provider_id ||
          order?.providerId ||
          "unknown",
      );
      const name = providerLabel(order);
      const row = ensureProvider(providerId, name);
      const amount = toMoney(order?.totalPrice);
      const refundAmount = toMoney(
        order?.refundAmount || order?.refundInfo?.amount,
      );
      const isRefunded = [
        order?.refundStatus,
        order?.paymentStatus,
        order?.settlementStatus,
        order?.escrowStatus,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value === "succeeded" || value === "refunded");
      const isPaid =
        order?.paymentStatus === "paid" &&
        order?.status !== "cancelled" &&
        !isRefunded;
      const isCompleted = isPaid && order?.status === "completed";
      const isActive =
        isPaid && ACTIVE_BOOKING_STATUSES.includes(order?.status);
      const commission = isCompleted ? calcCommission(amount) : 0;

      row.totalOrders += 1;
      row.providerName =
        row.providerName === "Chưa có tên provider" ? name : row.providerName;

      if (isPaid) {
        row.totalRevenue += amount;
      }

      if (isCompleted) {
        row.completedRevenue += amount;
        row.completedOrders += 1;
        row.commissionRevenue += commission;
      }

      if (isActive) {
        row.activeOrders += 1;
        row.heldRevenue += amount;
      }

      if (isRefunded) {
        row.refundRevenue += refundAmount || amount;
      }
    });

    return [...map.values()]
      .map((row) => {
        const providerGross = Math.max(row.totalRevenue, 0);
        const providerCommission = Math.max(row.commissionRevenue, 0);
        const providerRefund = Math.max(row.refundRevenue, 0);
        const providerNet = Math.max(providerGross - providerCommission, 0);
        const providerAvailable = Math.max(row.completedRevenue - providerCommission, 0);

        return {
          ...row,
          providerGross,
          providerCommission,
          providerRefund,
          providerNet,
          availableBalance: providerAvailable,
        };
      })
      .sort((a, b) =>
        revenueMode === "net"
          ? b.providerNet - a.providerNet
          : b.providerGross - a.providerGross,
      );
  }, [filteredOrders, revenueMode]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return providerRows;

    return providerRows.filter((row) => {
      return (
        row.providerName.toLowerCase().includes(keyword) ||
        String(row.providerId).toLowerCase().includes(keyword)
      );
    });
  }, [providerRows, search]);

  const monthSummary = useMemo(() => {
    const summary = {
      totalRevenue: 0,
      commissionRevenue: 0,
      refundRevenue: 0,
      heldRevenue: 0,
      availableBalance: 0,
      totalOrders: 0,
      providerCount: 0,
    };

    providerRows.forEach((row) => {
      const rowRevenue = revenueMode === "net" ? row.providerNet : row.providerGross;
      summary.totalRevenue += Number(rowRevenue || 0);
      summary.commissionRevenue += Number(row.providerCommission || 0);
      summary.refundRevenue += Number(row.providerRefund || 0);
      summary.heldRevenue += Number(row.heldRevenue || 0);
      summary.availableBalance += Number(row.availableBalance || 0);
      summary.totalOrders += Number(row.totalOrders || 0);
    });

    summary.providerCount = providerRows.length;
    return summary;
  }, [providerRows, revenueMode]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
        Đang tải dữ liệu theo provider...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Quản lý doanh thu Provider
            </h3>
           
          </div>

          <div className="flex w-full flex-col gap-2 lg:ml-auto lg:w-auto lg:flex-row lg:items-center">
            <div className="flex w-full items-center gap-2 lg:w-auto">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <FaMagnifyingGlass className="text-slate-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên provider..."
                  className="w-full bg-transparent text-sm outline-none"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Xóa tìm kiếm"
                  >
                    <FaRotateRight size={14} />
                  </button>
                ) : null}
              </div>

              <select
                value={revenueMode}
                onChange={(e) => setRevenueMode(e.target.value)}
                className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 outline-none"
              >
                <option value="gross">Gross</option>
                <option value="net">Net</option>
              </select>
            </div>

            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:ml-2">
              <div className="pointer-events-none flex h-full w-full items-center justify-center bg-orange-50 text-orange-500">
                <FaCalendarDays size={16} />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Lọc theo tháng"
                title={`Lọc theo tháng: ${selectedMonth || "Tất cả"}`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Tổng doanh thu</th>
                <th className="px-3 py-2">Phí sàn</th>
                <th className="px-3 py-2">Hoàn tiền</th>
                <th className="px-3 py-2">Đang giữ hộ</th>
                <th className="px-3 py-2">Khả dụng</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6">
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                      <FaFilter
                        className="mx-auto mb-2 text-slate-300"
                        size={18}
                      />
                      Không tìm thấy provider phù hợp.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.providerId}
                    className="rounded-2xl bg-slate-50/80"
                  >
                    <td className="rounded-l-2xl px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#f97316]">
                          <FaBuilding size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {row.providerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.totalOrders} đơn, {row.completedOrders} hoàn
                            tất
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">
                      {fmtVND(revenueMode === "net" ? row.providerNet : row.providerGross)}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">
                      {fmtVND(row.providerCommission)}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">
                      {fmtVND(row.providerRefund)}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">
                      {fmtVND(row.heldRevenue)}
                    </td>
                    <td className="rounded-r-2xl px-3 py-4 text-sm font-medium text-slate-700">
                      {fmtVND(row.availableBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RevenueByProvider;
