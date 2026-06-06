import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";
import {
  FaChartLine,
  FaClock,
  FaPercent,
  FaCircleCheck,
  FaRotateRight,
  FaFilter,
} from "react-icons/fa6";

const fmtVND = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;
const fmtDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const COMMISSION_RATE = 0.2;

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
          {fmtVND(value)}
        </p>
      </div>
      <p className="mt-1 text-slate-500" style={{ fontSize: 12 }}>
        {label}
      </p>
    </div>
  );
}

function Revenue() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/stats/partner", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch("/api/orders/provider", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const statsResult = await statsRes.json();
        const ordersResult = await ordersRes.json();

        if (!statsRes.ok) {
          throw new Error(
            statsResult.message || "Không thể tải thống kê doanh thu",
          );
        }

        if (!ordersRes.ok) {
          throw new Error(
            ordersResult.message || "Không thể tải lịch sử doanh thu",
          );
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

  const totalRevenue = Number(
    stats?.totalCollectedRevenue ?? stats?.totalRevenue ?? stats?.providerRevenue ?? 0,
  );
  const platformFee = Number(stats?.commissionRevenue || 0);
  const heldRevenue = Number(stats?.heldGrossRevenue || 0);
  const availableBalance = Number(stats?.availableBalance || 0);
  const isRefundedOrder = (order) =>
    [
      order?.refundStatus,
      order?.paymentStatus,
      order?.settlementStatus,
      order?.escrowStatus,
    ]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value === "succeeded" || value === "refunded");

  const refundRevenue = Number(
    orders.reduce((sum, order) => {
      if (!isRefundedOrder(order)) return sum;
      return sum + Number(order?.refundAmount || order?.refundInfo?.amount || 0);
    }, 0),
  );
  const [revenueMode, setRevenueMode] = useState("gross");
  const grossRevenueDisplay = totalRevenue;
  const netRevenueDisplay = Math.max(totalRevenue - platformFee, 0);
  const selectedRevenueDisplay =
    revenueMode === "net" ? netRevenueDisplay : grossRevenueDisplay;

  const transactionRows = useMemo(() => {
    const getOrderName = (order) =>
      order?.serviceId?.serviceName ||
      order?.tourSnapshot?.name ||
      order?.orderCode ||
      "Đơn hàng";
    const getCustomerName = (order) =>
      order?.customerInfo?.name || order?.userId?.fullName || "Khách hàng";
    const getCustomerPhone = (order) =>
      order?.customerInfo?.phone || order?.userId?.phone || "";

    const getProviderNet = (order) =>
      Math.max(Number(order?.totalPrice || 0) * (1 - COMMISSION_RATE), 0);

    const rows = [...orders].flatMap((order) => {
      const baseTime = new Date(order?.createdAt || 0).getTime();
      const completedTime = new Date(order?.updatedAt || order?.createdAt || 0).getTime();
      const refundTime = new Date(order?.refundedAt || order?.updatedAt || order?.createdAt || 0).getTime();
      const orderName = getOrderName(order);
      const refunded = isRefundedOrder(order);

      const paymentRow =
        order?.paymentStatus === "paid" && !refunded
          ? {
              id: `payment-${order?._id || order?.id}`,
              type: "payment",
              title: "Thanh toán",
              amount: Number(order?.totalPrice || 0),
              status: "Đã thu",
              note: `Đơn ${order?.orderCode || orderName}`,
              sortTime: baseTime,
            }
          : null;

      const commissionRow =
        order?.paymentStatus === "paid" && !refunded
          ? {
              id: `commission-${order?._id || order?.id}`,
              type: "commission",
              title: "Phí sàn",
              amount: Math.floor(Number(order?.totalPrice || 0) * COMMISSION_RATE),
              status: "Đã tính",
              note: `Phí sàn từ đơn ${order?.orderCode || orderName}`,
              sortTime: baseTime + 1,
            }
          : null;

      const payoutRow =
        order?.status === "completed" && !refunded
          ? {
              id: `payout-${order?._id || order?.id}`,
              type: "payout",
              title: "Đã giải ngân",
              amount: getProviderNet(order),
              status: "Hoàn tất",
              note: `Giải ngân cho đơn ${order?.orderCode || orderName}`,
              sortTime: completedTime + 2,
            }
          : null;

      const refundRow =
        refunded || Number(order?.refundAmount || 0) > 0
          ? {
              id: `refund-${order?._id || order?.id}`,
              type: "refund",
              title: "Hoàn tiền",
              amount: Number(order?.refundAmount || 0),
              status: "Đã hoàn tiền",
              note: `Hoàn tiền cho đơn ${order?.orderCode || orderName}`,
              sortTime: refundTime + 3,
            }
          : null;

      return [paymentRow, commissionRow, payoutRow, refundRow].filter(Boolean);
    });

    return rows.sort((a, b) => Number(b.sortTime || 0) - Number(a.sortTime || 0));
  }, [orders]);

  const revenueHistoryRows = useMemo(() => {
    return [...orders]
      .filter((order) => order?.status === "completed")
      .map((order) => {
        const orderCode = order?.orderCode || order?._id || "N/A";
        const customerName =
          order?.customerInfo?.name || order?.userId?.fullName || "Khách hàng";
        const customerPhone = order?.customerInfo?.phone || order?.userId?.phone || "";
        const tourName =
          order?.serviceId?.serviceName ||
          order?.tourSnapshot?.name ||
          "Không có tên tour";
        const totalAmount = Number(order?.totalPrice || 0);
        const commissionAmount = Math.floor(totalAmount * COMMISSION_RATE);
        const receivedAmount = Math.max(totalAmount - commissionAmount, 0);
        const seatsBooked = Number(order?.numPeople || 0);
        const transferredAt =
          order?.settledAt || order?.updatedAt || order?.createdAt || null;

        return {
          id: order?._id || orderCode,
          orderCode,
          customerName,
          customerPhone,
          tourName,
          totalAmount,
          commissionAmount,
          receivedAmount,
          seatsBooked,
          transferredAt,
          status: "Giải ngân từ admin",
        };
      })
      .sort(
        (a, b) =>
          new Date(b.transferredAt || 0).getTime() -
          new Date(a.transferredAt || 0).getTime(),
      );
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
          <Breadcrumb />
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px",
              fontWeight: "700",
              color: "rgb(26, 26, 46)",
            }}
          >
            Quản lý doanh thu
          </h1>
        </div>
        <div className="p-4 sm:p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
            Đang tải dữ liệu doanh thu...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <Breadcrumb />
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px",
            fontWeight: "700",
            color: "rgb(26, 26, 46)",
          }}
        >
          Quản lý doanh thu
        </h1>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-0 flex items-start justify-between gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "#f9731618" }}
              >
                <FaChartLine size={18} style={{ color: "#f97316" }} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <select
                  value={revenueMode}
                  onChange={(e) => setRevenueMode(e.target.value)}
                  className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700 outline-none"
                >
                  <option value="gross">Gross</option>
                  <option value="net">Net</option>
                </select>
                <p
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#1a1a2e",
                    textAlign: "center",
                  }}
                >
                  {fmtVND(selectedRevenueDisplay)}
                </p>
              </div>
            </div>
            <p className="mt-1 text-slate-500" style={{ fontSize: 12 }}>
              {revenueMode === "net"
                ? "Doanh thu ròng sau phí sàn và hoàn tiền"
                : "Tổng doanh thu trước phí sàn và hoàn tiền"}
            </p>
          </div>
          <MetricCard
            label="Phí sàn"
            value={platformFee}
            icon={FaPercent}
            color="#8b5cf6"
          />
          <MetricCard
            label="Hoàn tiền"
            value={refundRevenue}
            icon={FaRotateRight}
            color="#ef4444"
          />
          <MetricCard
            label="Đang giữ hộ"
            value={heldRevenue}
            icon={FaClock}
            color="#3b82f6"
          />
          <MetricCard
            label="Khả dụng"
            value={availableBalance}
            icon={FaCircleCheck}
            color="#10b981"
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Lịch sử giao dịch doanh thu
              </h3>
              {/* <p className="text-xs text-slate-500">
                Thanh toán, phí sàn, giải ngân và hoàn tiền của provider.
              </p> */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 px-3 pb-3">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-2 py-2">Mã đơn</th>
                  <th className="px-2 py-2">Tên khách</th>
                  <th className="px-2 py-2">Tên tour</th>
                  <th className="px-2 py-2">Số chỗ</th>
                  <th className="px-2 py-2">Tổng tiền</th>
                  <th className="px-2 py-2">Phí sàn</th>
                  <th className="px-2 py-2">Tiền thu về</th>
                  <th className="px-2 py-2">Trạng thái</th>
                  <th className="px-2 py-2">Ngày giờ</th>
                </tr>
              </thead>
              <tbody>
                {revenueHistoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6">
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500">
                        <FaFilter className="mx-auto mb-2 text-slate-300" size={18} />
                        Chưa có lịch sử giao dịch doanh thu nào.
                      </div>
                    </td>
                  </tr>
                ) : (
                  revenueHistoryRows.map((row) => (
                    <tr key={row.id} className="rounded-2xl bg-slate-50/80">
                      <td className="rounded-l-2xl px-2 py-3 text-[12px] font-medium text-slate-700">
                        {row.orderCode}
                      </td>
                      <td className="px-2 py-3 text-[12px] text-slate-700">
                        <div className="font-medium leading-tight">{row.customerName}</div>
                        
                      </td>
                      <td className="px-2 py-3 text-[12px] text-slate-600">
                        <div className="max-w-[180px] truncate font-medium text-slate-700">
                          {row.tourName}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-[12px] font-semibold text-slate-900">
                        {row.seatsBooked}
                      </td>
                      <td className="px-2 py-3 text-[12px] font-semibold text-slate-900">
                        {fmtVND(row.totalAmount)}
                      </td>
                      <td className="px-2 py-3 text-[12px] font-semibold text-slate-900">
                        {fmtVND(row.commissionAmount)}
                      </td>
                      <td className="px-2 py-3 text-[12px] font-semibold text-emerald-600">
                        {fmtVND(row.receivedAmount)}
                      </td>
                      <td className="px-2 py-3 text-[12px] text-slate-600">
                        {row.status}
                      </td>
                      <td className="rounded-r-2xl px-2 py-3 text-[12px] text-slate-500">
                        {fmtDateTime(row.transferredAt)}
                      </td>
                    </tr>
                  ))
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
