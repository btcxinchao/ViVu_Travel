import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IoSearch } from "react-icons/io5";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { FiRefreshCw } from "react-icons/fi";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "awaiting_confirm", label: "Chờ xác nhận" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "completed", label: "Hoàn tất" },
  { id: "cancelled", label: "Đã hủy" },
];

const STATUS_META = {
  awaiting_payment: {
    label: "Chờ thanh toán",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  awaiting_confirm: {
    label: "Chờ xác nhận",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Hoàn tất",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Đã hủy",
    cls: "bg-red-100 text-red-700 border-red-200",
  },
};

const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

const getOrderId = (order) => order?._id || order?.id || "";

const getServiceName = (order) =>
  order?.tourSnapshot?.name ||
  order?.serviceId?.serviceName ||
  "Chưa có tên tour";

const getDepartureDate = (order) =>
  order?.tourSnapshot?.departureDate ||
  order?.scheduleId?.departureDate ||
  null;

const getCustomerName = (order) =>
  order?.customerInfo?.name || order?.customerInfo?.fullName || "Khách hàng";

const getCustomerPhone = (order) => order?.customerInfo?.phone || "";

const getInitial = (name) =>
  String(name || "K")
    .trim()
    .charAt(0)
    .toUpperCase() || "K";

const getStatusLabel = (status) =>
  STATUS_META[status]?.label || status || "Chưa rõ";

const getStatusClass = (status) =>
  STATUS_META[status]?.cls || "bg-slate-100 text-slate-600 border-slate-200";

const canComplete = (status) => status === "confirmed";
const getDisplayDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có ngày";

function Booking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  const fetchOrders = async () => {
    if (!accessToken) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/api/orders/provider", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setOrders(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError.message ||
          "Không thể tải danh sách đặt chỗ",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(
    () =>
      orders.reduce(
        (acc, order) => {
          acc.all += 1;
          if (acc[order.status] !== undefined) acc[order.status] += 1;
          return acc;
        },
        {
          all: 0,
          awaiting_confirm: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        },
      ),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = getCustomerName(order).toLowerCase();
      const serviceName = getServiceName(order).toLowerCase();
      const phone = getCustomerPhone(order).toLowerCase();
      const matchSearch =
        !keyword ||
        customerName.includes(keyword) ||
        serviceName.includes(keyword) ||
        phone.includes(keyword);

      const matchStatus =
        activeFilter === "all" || order.status === activeFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, search, activeFilter]);

  const updateOrder = async (orderId, status) => {
    if (!accessToken) return;

    try {
      setActionLoadingId(orderId);
      setError("");

      const res = await axios.patch(
        `/api/orders/status/${orderId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const updated = res.data?.data;
      if (updated) {
        setOrders((prev) =>
          prev.map((item) =>
            getOrderId(item) === orderId ? { ...item, ...updated } : item,
          ),
        );
      } else {
        await fetchOrders();
      }
    } catch (updateError) {
      setError(
        updateError?.response?.data?.message ||
          updateError.message ||
          "Không thể cập nhật trạng thái đơn hàng",
      );
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div>
            <Breadcrumb />
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "20px",
                fontWeight: "700",
                color: "rgb(26, 26, 46)",
              }}
            >
              Quản lý đặt chỗ
            </h1>
          </div>
        </div>

        <div className="mx-4 rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center text-slate-400 sm:mx-6 sm:px-6">
          Đang tải danh sách đặt chỗ...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div>
          <Breadcrumb />
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "20px",
              fontWeight: "700",
              color: "rgb(26, 26, 46)",
            }}
          >
            Quản lý đặt chỗ
          </h1>
        </div>
      </div>

      <div className="space-y-5 px-4 pb-6 sm:px-6">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((filter) => {
              const count = counts[filter.id] ?? counts.all;
              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-[#f97316] bg-[#f97316] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#f97316] hover:text-[#f97316]"
                  }`}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
            <div className="relative w-full lg:w-[360px]">
              <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên khách, tour hoặc số điện thoại"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-5 text-sm font-semibold text-[#f97316] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <FiRefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Đang tải..." : "Làm mới"}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
              Chưa có dữ liệu booking
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-3 py-3 font-medium">Khách hàng</th>
                    <th className="px-3 py-3 font-medium">Dịch vụ</th>
                    <th className="px-3 py-3 font-medium">Ngày khởi hành</th>
                    <th className="px-3 py-3 font-medium">Khách / Mã</th>
                    <th className="px-3 py-3 font-medium">Tổng tiền</th>
                    <th className="px-3 py-3 font-medium">Trạng thái</th>
                    <th className="px-3 py-3 font-medium">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const orderId = getOrderId(order);
                    const bookingStatus = getStatusLabel(order.status);
                    const statusClass = getStatusClass(order.status);
                    const isAwaitingConfirm =
                      order.status === "awaiting_confirm";
                    const isConfirmed = canComplete(order.status);
                    const departureDate = getDepartureDate(order);

                    return (
                      <tr
                        key={orderId}
                        className="border-b border-gray-100 transition-colors hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-4 text-left">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {getCustomerName(order)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {getCustomerPhone(order) || "Không có SĐT"}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-left">
                          <p className="max-w-[260px] truncate font-medium text-slate-700">
                            {getServiceName(order)}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 text-left text-slate-700">
                          {getDisplayDate(departureDate)}
                        </td>

                        <td className="px-3 py-4 text-left text-slate-600">
                          <div className="space-y-1">
                            <p>{order.numPeople || 0} khách</p>
                            <p className="text-xs text-slate-400">
                              #{String(orderId).slice(-6)}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-left font-semibold text-[#f97316]">
                          {formatMoney(order.totalPrice)}
                        </td>

                        <td className="px-3 py-4 text-left">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 border-blue-200 ${statusClass}`}
                          >
                            {bookingStatus}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-left">
                          <div className="flex flex-nowrap items-center gap-2">
                            {isAwaitingConfirm ? (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === orderId}
                                  onClick={() =>
                                    updateOrder(orderId, "confirmed")
                                  }
                                  title="Xác nhận"
                                  aria-label="Xác nhận"
                                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  <FaCircleCheck size={18} />
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoadingId === orderId}
                                  onClick={() =>
                                    updateOrder(orderId, "cancelled")
                                  }
                                  title="Từ chối"
                                  aria-label="Từ chối"
                                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl  text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  <FaCircleXmark size={18} />
                                </button>
                              </>
                            ) : null}

                            {isConfirmed ? (
                              <button
                                type="button"
                                disabled={actionLoadingId === orderId}
                                onClick={() =>
                                  updateOrder(orderId, "completed")
                                }
                                className="inline-flex whitespace-nowrap items-center gap-2 rounded-2xl border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Hoàn tất
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Booking;
