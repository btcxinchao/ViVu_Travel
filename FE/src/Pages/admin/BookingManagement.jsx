import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IoSearch } from "react-icons/io5";

const STATUS_LABELS = {
  completed: "Hoàn tất",
  confirmed: "Đã xác nhận",
  awaiting_confirm: "Chờ xác nhận",
  awaiting_payment: "Chờ TT",
  cancelled: "Đã hủy",
};

const STATUS_CLASS = {
  completed: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-green-100 text-green-700",
  awaiting_confirm: "bg-blue-100 text-blue-700",
  awaiting_payment: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getOrderId = (order) =>
  order?.orderCode ||
  order?.paymentInfo?.orderInfo ||
  order?._id ||
  order?.id ||
  "";

const getCustomerName = (order) =>
  order?.customerInfo?.name || order?.userId?.fullName || "Khách hàng";

const getServiceName = (order) =>
  order?.serviceId?.serviceName ||
  order?.tourSnapshot?.name ||
  "Chưa có tên tour";

const getProviderName = (order) =>
  order?.provider_id?.fullName || "Chưa có đối tác";

const getStatusLabel = (status) => STATUS_LABELS[status] || status || "Chưa rõ";

const getStatusClass = (status) =>
  STATUS_CLASS[status] || "bg-slate-100 text-slate-600";

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const accessToken = localStorage.getItem("accessToken");
        const result = await axios.get("/api/orders/admin", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setBookings(Array.isArray(result.data?.data) ? result.data.data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Không thể tải dữ liệu booking",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const keyword = bookingSearch.trim().toLowerCase();
    if (!keyword) return bookings;

    return bookings.filter((item) => {
      const orderId = String(getOrderId(item)).toLowerCase();
      const customer = String(getCustomerName(item)).toLowerCase();
      const service = String(getServiceName(item)).toLowerCase();
      const provider = String(getProviderName(item)).toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      return (
        orderId.includes(keyword) ||
        customer.includes(keyword) ||
        service.includes(keyword) ||
        provider.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }, [bookingSearch, bookings]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-left text-xl font-semibold text-slate-900">
            Giám sát Booking
          </h2>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="relative">
        <IoSearch className=  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          value={bookingSearch}
          onChange={(e) => setBookingSearch(e.target.value)}
          placeholder="Tìm theo mã đơn, khách hàng, dịch vụ, đối tác..."
          className={`${inputClass} pl-11`}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Mã</th>
              <th className="px-4 py-3 text-left font-medium">Khách hàng</th>
              <th className="px-4 py-3 text-left font-medium">Dịch vụ</th>
              <th className="px-4 py-3 text-left font-medium">Đối tác</th>
              <th className="px-4 py-3 text-left font-medium">Tổng tiền</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium">Ngày đặt</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-16 text-center text-slate-400"
                >
                  Đang tải dữ liệu booking...
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-16 text-center text-slate-400"
                >
                  Chưa có booking nào
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking, index) => {
                const orderId = getOrderId(booking);
                const statusLabel = getStatusLabel(booking.status);
                const statusClass = getStatusClass(booking.status);

                return (
                  <tr
                    key={orderId || index}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {orderId || "--"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {getCustomerName(booking)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-4 text-slate-700">
                      {getServiceName(booking)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {getProviderName(booking)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#f97316]">
                      {formatMoney(booking.totalPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(booking.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BookingManagement;
