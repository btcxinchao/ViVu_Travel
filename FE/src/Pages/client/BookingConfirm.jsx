import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTicket } from "react-icons/fa6";
import { MdOutlineLocalOffer } from "react-icons/md";
import { FaLocationDot, FaClock } from "../../assets/Icons/Icons";
import { formatDate } from "../../utils/formatDate";
import { formatVND } from "../../utils/money";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const FALLBACK_IMAGE = "/images/service-placeholder.svg";

const getServiceImage = (service) => {
  if (Array.isArray(service?.images) && service.images[0])
    return service.images[0];
  if (service?.imageUrl) return service.imageUrl;
  if (service?.imageFile) return `/uploads/${service.imageFile}`;
  return FALLBACK_IMAGE;
};

const getServiceName = (service) =>
  service?.serviceName ||
  service?.servicesName ||
  service?.name ||
  "Chưa có dữ liệu tour";

const getLocation = (service) =>
  service?.location || service?.destination || "Chưa cập nhật";

const getScheduleId = (schedule) => schedule?._id || schedule?.id || "";

const getRemainingSlots = (schedule) => {
  const maxSlots = Number(schedule?.maxSlots || schedule?.maxPeople || 0);
  const bookedSlots = Number(schedule?.bookedSlots || 0);
  return Math.max(maxSlots - bookedSlots, 0);
};

function BookingConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId: routeServiceId } = useParams();
  const state = location.state || {};

  const serviceId =
    routeServiceId || state.serviceId || state.service?._id || "";
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [service, setService] = useState(state.service || null);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    state.scheduleId || getScheduleId(state.selectedSchedule) || "",
  );
  const [bookingForm, setBookingForm] = useState({
    people: state.people ? Math.max(Number(state.people), 1) : "",
    note: state.note || "",
  });
  const [customerForm, setCustomerForm] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const people = Number(bookingForm.people || 0);
  const price = Number(service?.prices || service?.price || 0);
  const originalTotal = Number(state.originalTotal ?? price * people);
  const appliedCoupon =
    state.appliedCoupon || state.couponResult || state.coupon || null;
  const couponCode = String(
    state.couponCode || appliedCoupon?.code || "",
  ).trim();
  const discountAmount = Number(
    state.discountAmount || appliedCoupon?.discountAmount || 0,
  );
  const total = Math.max(
    Number(state.finalTotal ?? state.total ?? originalTotal - discountAmount),
    0,
  );
  const selectedSchedule =
    schedules.find((item) => getScheduleId(item) === selectedScheduleId) ||
    null;

  const summaryDate = useMemo(() => {
    if (!selectedSchedule?.departureDate) return "Chưa chọn lịch khởi hành";
    try {
      return formatDate(selectedSchedule.departureDate);
    } catch {
      return String(selectedSchedule.departureDate);
    }
  }, [selectedSchedule?.departureDate]);

  // Tai thong tin tour va lich khoi hanh cho man xac nhan.
  useEffect(() => {
    if (!serviceId) {
      setError("Thiếu mã tour để tải dữ liệu.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError("");

        const [serviceRes, scheduleRes] = await Promise.all([
          axios.get(`/api/services/detail/${serviceId}`),
          axios.get(`/api/schedules/service/${serviceId}`),
        ]);

        if (!isMounted) return;

        const serviceData = serviceRes.data?.data || null;
        const scheduleData = Array.isArray(scheduleRes.data?.data)
          ? scheduleRes.data.data
          : [];

        setService(serviceData);
        setSchedules(scheduleData);

        if (!selectedScheduleId && scheduleData.length > 0) {
          const firstSchedule = scheduleData[0];
          setSelectedScheduleId(getScheduleId(firstSchedule));
        }
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError?.response?.data?.message ||
            "Không thể tải dữ liệu tour từ database.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBookingData();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  // Quay lai trang truoc do.
  const handleBack = () => navigate(-1);

  // Tao don dat tour va luu coupon neu co.
  const handleCreateOrder = async ({ paymentStatus = "unpaid" } = {}) => {
    if (!serviceId) {
      setError("Không tìm thấy mã tour.");
      return;
    }

    if (!selectedScheduleId) {
      setError("Vui lòng chọn lịch khởi hành.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/signin", { replace: true });
      return;
    }

    const validationMessage = validateBookingBeforeSubmit();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!customerForm.fullName || !customerForm.email || !customerForm.phone) {
      setError("Vui lòng nhập đầy đủ họ tên, email và số điện thoại.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        scheduleId: selectedScheduleId,
        numPeople: people,
        customerInfo: {
          name: customerForm.fullName,
          email: customerForm.email,
          phone: customerForm.phone,
        },
        note: bookingForm.note,
        couponCode,
        paymentStatus,
      };

      const res = await axios.post("/api/orders", payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const createdOrder = res.data?.data;
      setSuccess(
        paymentStatus === "paid"
          ? "Đã tạo đơn đặt tour. Phần thanh toán sẽ được nối tiếp từ đơn hàng thật."
          : "Đã xác nhận đặt tour thành công.",
      );

      if (createdOrder) {
        setBookingForm((prev) => ({ ...prev, note: prev.note }));
      }
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError.message ||
          "Không thể tạo đơn đặt tour.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Tao don va chuyen sang cong thanh toan VNPay.
  const handlePayNow = async () => {
    if (!serviceId) {
      setError("Khong tim thay ma tour.");
      return;
    }

    if (!selectedScheduleId) {
      setError("Vui long chon lich khoi hanh.");
      return;
    }

    const validationMessage = validateBookingBeforeSubmit();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!customerForm.fullName || !customerForm.email || !customerForm.phone) {
      setError("Vui long nhap day du ho ten, email va so dien thoai.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/signin", { replace: true });
        return;
      }

      const orderInfo = [
        getServiceName(service),
        `${people} nguoi`,
        selectedSchedule ? `KH ${summaryDate}` : "",
        couponCode ? `Coupon ${couponCode}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const orderRes = await axios.post(
        "/api/orders",
        {
          scheduleId: selectedScheduleId,
          numPeople: people,
          customerInfo: {
            name: customerForm.fullName,
            email: customerForm.email,
            phone: customerForm.phone,
          },
          note: bookingForm.note,
          couponCode,
          paymentStatus: "unpaid",
          paymentFlow: "vnpay",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const createdOrder = orderRes.data?.data;
      if (!createdOrder?._id) {
        setError("Khong tao duoc don hang cho thanh toan.");
        return;
      }

      const res = await axios.post("/api/create-qr", {
        amount: String(createdOrder.totalPrice || total),
        orderInfo,
        txnRef: String(createdOrder._id),
      });

      const paymentUrl = res.data?.vnpayRespone;
      if (!paymentUrl) {
        setError("Khong tao duoc link thanh toan.");
        return;
      }

      window.location.href = paymentUrl;
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError.message ||
          "Khong the ket noi den cong thanh toan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] px-4 py-8">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-white p-8 text-slate-500 shadow-sm">
          Đang tải dữ liệu tour từ database...
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] px-4 py-8">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-white p-8 text-red-600 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  const remainingSlots = selectedSchedule
    ? getRemainingSlots(selectedSchedule)
    : 0;
  const validateBookingBeforeSubmit = () => {
    if (!selectedScheduleId) return "Vui long chon lich khoi hanh.";
    if (!bookingForm.people) return "Vui lòng nhập số lượng người đi";
    if (people < 1) return "So luong khach khong hop le.";
    if (people > remainingSlots) {
      return "Số lượng chỗ còn lại không đủ";
    }
    if (!customerForm.fullName || !customerForm.email || !customerForm.phone) {
      return "Vui long nhap day du ho ten, email va so dien thoai.";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-left md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-[#f97316]"
          >
            <FaArrowLeft size={14} />
            Quay lại
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <p className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900">
                Xác nhận đặt tour
              </p>

              <div className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  {getServiceName(service)}
                </h2>
                <div className="mt-4 space-y-2 text-[15px] text-slate-600">
                  <p className="flex items-center gap-2">
                    <FaLocationDot className="text-[#f97316]" />
                    Điểm đến: {getLocation(service)}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaClock className="text-[#f97316]" />
                    Thời lượng: {service?.duration || "Chưa cập nhật"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaTicket className="text-[#f97316]" />
                    Ngày khởi hành: {summaryDate}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
                <MdOutlineLocalOffer className="text-[#f97316]" />
                Mã giảm giá
              </div>

              {couponCode ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-700">
                  <p className="mt-1 text-lg font-semibold text-slate-900 color-[#gray]">
                    {couponCode}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#eceef4] px-4 py-4 text-center text-[15px] font-semibold text-slate-500">
                  {state.appliedCoupon || state.couponResult || state.coupon ? (
                    <div className="space-y-1">
                      <p className="text-slate-600">Mã giảm giá đã sử dụng</p>
                      <p className="text-lg font-bold text-slate-900">
                        {String(
                          state.couponCode ||
                            state.appliedCoupon?.code ||
                            state.couponResult?.code ||
                            state.coupon?.code ||
                            "",
                        ).trim()}
                      </p>
                    </div>
                  ) : (
                    "Không có mã giảm giá khả dụng"
                  )}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-5 text-xl font-semibold text-slate-900">
                Tóm tắt giá
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[15px] text-slate-500">
                  <span>Tổng tiền:</span>
                  <span className="font-medium text-slate-700">
                    {formatVND(originalTotal)}
                  </span>
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between text-[15px] text-slate-500">
                    <span>Giảm giá:</span>
                    <span className="font-medium text-emerald-600">
                      -{formatVND(discountAmount)}
                    </span>
                  </div>
                ) : null}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[18px] font-semibold text-slate-900">
                      Thành tiền:
                    </span>
                    <span className="text-[26px] font-extrabold text-[#0f74c8]">
                      {formatVND(total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-5 text-xl font-semibold text-slate-900">
                Thông tin khách hàng
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <RequiredLabel className="text-sm text-slate-500">Họ tên</RequiredLabel>
                  <input
                    value={customerForm.fullName}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                  />
                </label>

                <label className="space-y-2">
                  <RequiredLabel className="text-sm text-slate-500">Email</RequiredLabel>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                  />
                </label>

                <label className="space-y-2">
                  <RequiredLabel className="text-sm text-slate-500">Số điện thoại</RequiredLabel>
                  <input
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm text-slate-500">Ghi chú</span>
                <textarea
                  rows={3}
                  value={bookingForm.note}
                  onChange={(e) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
                />
              </label>
            </section>

            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mt-2 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl bg-[#e7eaef] px-5 py-3 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-300"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder({ paymentStatus: "unpaid" })}
                  disabled={submitting}
                  className="rounded-xl bg-slate-700 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Đang xử lý..." : "Đặt tour (Thanh toán sau)"}
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={submitting}
                  className="rounded-xl bg-[#0f74c8] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0b5ea4] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Đang xử lý..." : "Đặt tour & Thanh toán ngay"}
                </button>
              </div>

              {success ? (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {success}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="xl:pt-2">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6">
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Tóm tắt đặt tour
                </h3>

                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={getServiceImage(service)}
                    alt={getServiceName(service)}
                    className="h-52 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Tour</p>
                    <p className="mt-1 text-[15px] font-semibold leading-6 text-slate-900">
                      {getServiceName(service)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Số lượng</p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">
                      {people} Người lớn
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Lịch khởi hành</p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">
                      {selectedSchedule ? summaryDate : "Chưa chọn lịch"}
                    </p>
                    {selectedSchedule ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Còn {remainingSlots} chỗ
                      </p>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-slate-900">
                        Tổng cộng:
                      </span>
                      <span className="text-[18px] font-extrabold text-[#0f74c8]">
                        {formatVND(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirm;
