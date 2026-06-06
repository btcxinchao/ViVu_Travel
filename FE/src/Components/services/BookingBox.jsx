import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaClock as Clock,
  FaCircleCheck as CheckCircle2,
} from "../../assets/Icons/Icons";
import { formatDate } from "../../utils/formatDate";
import RequiredLabel from "../shared/RequiredLabel.jsx";

const numberInputClass =
  "w-full px-3 py-2.5 rounded-xl bg-[#f8fafc] border border-border outline-none focus:border-[#f97316] no-spinner";

function BookingBox({
  props,
  schedules = [],
  viewPage,
  setViewPage,
  setView,
  selectedSchedule,
  setSelectedSchedule,
  onCheckout,
}) {
  const navigate = useNavigate();
  const service = props || {};
  const [showBooking, setShowBooking] = useState(viewPage === false);
  const [activeTab, setActiveTab] = useState("overview");
  const [people, setPeople] = useState("");
  const [peopleError, setPeopleError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const price = Number(service?.price || service?.prices || 0);
  const selectedScheduleId =
    selectedSchedule?._id || selectedSchedule?.id || "";
  const peopleInputRef = useRef(null);
  const normalizedPeople = Number(
    String(people || "").replace(/^0+(?=\d)/, "") || 0,
  );
  const subtotal = price * normalizedPeople;
  const discountAmount = Number(couponResult?.discountAmount || 0);
  const finalTotal = Math.max(subtotal - discountAmount, 0);
  const availableSlots = Math.max(
    Number(selectedSchedule?.maxSlots || selectedSchedule?.maxPeople || 0) -
      Number(selectedSchedule?.bookedSlots || 0),
    0,
  );
  const isOverCapacity =
    Boolean(selectedScheduleId) && normalizedPeople > availableSlots;

  useEffect(() => {
    if (viewPage === false) setShowBooking(true);
  }, [viewPage]);

  useEffect(() => {
    setCouponResult(null);
    setCouponError("");
  }, [normalizedPeople, selectedScheduleId, service?._id]);

  // Kiem tra ma giam gia tren backend.
  const handleApplyCoupon = async () => {
    const code = String(couponCode || "").trim();

    if (!code) {
      setCouponError("Vui long nhap ma giam gia.");
      setCouponResult(null);
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const res = await axios.post("/api/coupons/validate", {
        code,
        serviceId: service?._id || "",
        amount: subtotal,
      });

      setCouponResult(res.data?.data || null);
      setCouponError("");
    } catch (applyError) {
      setCouponResult(null);
      setCouponError(
        applyError?.response?.data?.message || "Khong the ap dung ma giam gia.",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // Tao payload dat tour va chuyen sang trang xac nhan.
  const handleBook = () => {
    if (!String(people || "").trim()) {
      setPeopleError("Vui lòng nhập số lượng người đi");
      peopleInputRef.current?.focus();
      return;
    }

    if (normalizedPeople < 1) {
      setPeopleError("Số lượng khách không hợp lệ.");
      peopleInputRef.current?.focus();
      return;
    }

    if (!selectedScheduleId) {
      setScheduleError("Vui lòng chọn lịch khởi hành.");
      return;
    }

    if (isOverCapacity) {
      setCouponError("Số lượng chỗ còn lại không đủ");
      return;
    }

    const payload = {
      serviceId: service?._id || "",
      service,
      scheduleId: selectedScheduleId,
      schedule: selectedSchedule || null,
      people: normalizedPeople,
      note,
      price,
      originalTotal: subtotal,
      discountAmount,
      finalTotal,
      total: finalTotal,
      couponCode: couponResult?.code || "",
      coupon: couponResult || null,
      couponResult: couponResult || null,
      appliedCoupon: couponResult || null,
    };

    if (typeof onCheckout === "function") {
      onCheckout(payload);
      return;
    }

    navigate(`/booking/confirm/${payload.serviceId}`, { state: payload });
  };

  // Mo khung dat lich va chuyen view sang tab lich khoi hanh.
  const openBooking = () => {
    setShowBooking(true);
    setActiveTab("schedules");
    if (typeof setView === "function") setView("schedules");
    if (typeof setViewPage === "function") setViewPage(false);
  };

  // Dong khung dat tour quay ve trang xem thong tin.
  const closeBooking = () => {
    setShowBooking(false);
    if (typeof setViewPage === "function") setViewPage(true);
  };

  return (
    <div className="lg:col-span-1">
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          appearance: textfield;
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="sticky top-20 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-border">
          <div className="text-center mb-5">
            <span
              className="text-[#f97316]"
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {price.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 14 }}>
              {" "}
              /người
            </span>

            {service.duration && (
              <p
                className="text-muted-foreground mt-1 flex items-center justify-center gap-1"
                style={{ fontSize: 13 }}
              >
                <Clock size={14} /> {service.duration}
              </p>
            )}
          </div>

          {!showBooking ? (
            <button
              onClick={openBooking}
              className="w-full py-3.5 bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
              style={{ fontSize: 15, fontWeight: 600 }}
            >
              Đặt dịch vụ ngay
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  className="block mb-1.5 text-left text-muted-foreground"
                  style={{ fontSize: 13 }}
                >
                  <RequiredLabel>Lịch khởi hành</RequiredLabel>
                </label>
                <select
                  value={selectedSchedule?._id || selectedSchedule?.id || ""}
                  onChange={(e) => {
                    const selected = schedules.find(
                      (item) =>
                        item._id === e.target.value ||
                        item.id === e.target.value,
                    );
                    if (typeof setSelectedSchedule === "function") {
                      setSelectedSchedule(selected || null);
                    }
                    if (scheduleError) setScheduleError("");
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl bg-[#f8fafc] border border-border outline-none focus:border-[#f97316] ${
                    scheduleError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  style={{ fontSize: 14 }}
                >
                  <option value="">Chọn lịch khởi hành</option>
                  {schedules
                    .filter(
                      (s) => String(s?.status || "").toLowerCase() === "open",
                    )
                    .map((s) => {
                      const remain =
                        Number(s.maxSlots || 0) - Number(s.bookedSlots || 0);
                      return (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {new Date(s.departureDate).toLocaleDateString(
                            "vi-VN",
                          )}{" "}
                          ( còn {remain} chỗ)
                        </option>
                      );
                    })}
                </select>
                {scheduleError ? (
                  <p className="mt-2 text-left text-sm text-red-500">
                    {scheduleError}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="block mb-1.5 text-left text-muted-foreground"
                  style={{ fontSize: 13 }}
                >
                  <RequiredLabel>Số người</RequiredLabel>
                </label>
                <input
                  ref={peopleInputRef}
                  type="text"
                  inputMode="numeric"
                  value={people}
                  placeholder="Nhập số lượng"
                  onChange={(e) => {
                    const digits = String(e.target.value || "").replace(
                      /\D/g,
                      "",
                    );
                    setPeople(digits);
                    if (peopleError) setPeopleError("");
                  }}
                  onBlur={() => {
                    const cleaned = String(people || "")
                      .replace(/\D/g, "")
                      .replace(/^0+(?=\d)/, "");
                    setPeople(cleaned);
                  }}
                  className={`${numberInputClass} ${
                    peopleError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  style={{
                    fontSize: 14,
                  }}
                />
                {peopleError ? (
                  <p className="mt-2 text-left text-sm text-red-500">
                    {peopleError}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  className="block mb-1.5 text-left text-muted-foreground"
                  style={{ fontSize: 13 }}
                >
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 w-full px-3 py-2.5 rounded-xl bg-[#f8fafc] border border-border outline-none focus:border-[#f97316]"
                    style={{ fontSize: 14 }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="rounded-xl bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {couponLoading ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>
                {couponError ? (
                  <p className="mt-2 text-left text-sm text-red-500">
                    {couponError}
                  </p>
                ) : null}
                {couponResult ? (
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-sm text-emerald-700">
                    Đã áp dụng mã <strong>{couponResult.code}</strong> - giảm{" "}
                    {Number(couponResult.discountAmount || 0).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </div>
                ) : null}
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2">
                <div className="flex justify-between" style={{ fontSize: 14 }}>
                  <span className="text-muted-foreground">
                    Giá x {normalizedPeople} người
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {subtotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {couponResult ? (
                  <div
                    className="flex justify-between"
                    style={{ fontSize: 14 }}
                  >
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="font-semibold text-emerald-600">
                      -{discountAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ) : null}

                <div className="border-t border-border pt-2 flex justify-between">
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    Tổng cộng
                  </span>
                  <span
                    className="text-[#f97316]"
                    style={{ fontSize: 18, fontWeight: 700 }}
                  >
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={isOverCapacity}
                className="w-full py-3.5 bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2"
                style={{ fontSize: 15, fontWeight: 600 }}
              >
                <CheckCircle2 size={18} /> Thanh toán qua VNPAY
              </button>

              <button
                onClick={closeBooking}
                className="w-full py-2 text-muted-foreground hover:text-[#1a1a2e]"
                style={{ fontSize: 13 }}
              >
                Hủy
              </button>
            </div>
          )}

          <div className="mt-6 space-y-3 pt-5 border-t border-border">
            {["Xác nhận tức thì", "Hỗ trợ 24/7", "Hoàn tiền linh hoạt"].map(
              (t) => (
                <p
                  key={t}
                  className="flex items-center gap-2 text-muted-foreground"
                  style={{ fontSize: 13 }}
                >
                  <CheckCircle2 size={14} className="text-green-500" /> {t}
                </p>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingBox;
