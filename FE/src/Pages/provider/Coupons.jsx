import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const emptyForm = {
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderValue: "",
  maxUsage: "1",
  startDate: "",
  endDate: "",
  serviceIds: "",
  status: "active",
};

const STATUS_CONFIG = {
  active: { label: "Hoạt động", cls: "bg-green-50 text-green-700" },
  inactive: { label: "Tắt", cls: "bg-gray-100 text-gray-500" },
};

const DISCOUNT_TYPE_LABEL = {
  percent: "Phần trăm",
  fixed: "Số tiền cố định",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const formatDiscountValue = (coupon) => {
  const value = Number(coupon.discountValue || 0);
  if (coupon.discountType === "percent") return `${value}%`;
  return `${value.toLocaleString("vi-VN")}đ`;
};

const getDigitsOnly = (value) => String(value || "").replace(/\D/g, "");

const formatNumberInput = (value) => {
  const digits = getDigitsOnly(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatDiscountValueInput = (discountType, value) => {
  const digits = getDigitsOnly(value);
  if (discountType === "fixed") return formatNumberInput(digits);
  return digits.slice(0, 3);
};

const todayInputValue = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

function CouponFormModal({
  open,
  isEdit,
  form,
  errors = {},
  minDate,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}) {
  if (!open) return null;

  const fieldWrapClass = "flex flex-col gap-2";
  const inputClass =
    "h-14 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#f97316]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isEdit ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Đóng"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Mã</RequiredLabel>
              <input
                value={form.code}
                onChange={(e) => onChange("code", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={fieldWrapClass}>
              <span className="text-sm text-slate-500">Trạng thái</span>
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className={inputClass}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tắt</option>
              </select>
            </label>

            <label className={fieldWrapClass}>
              <span className="text-sm text-slate-500">Kiểu giảm</span>
              <select
                value={form.discountType}
                onChange={(e) => onChange("discountType", e.target.value)}
                className={inputClass}
              >
                <option value="percent">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </label>

            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Giá trị giảm</RequiredLabel>
              <div className="relative h-14">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.discountValue}
                  onChange={(e) => onChange("discountValue", e.target.value)}
                  placeholder={form.discountType === "percent" ? "1 - 100" : "VD: 50.000"}
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {form.discountType === "percent" ? "%" : "VNĐ"}
                </span>
              </div>
            </label>

            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Đơn tối thiểu</RequiredLabel>
              <input
                type="text"
                inputMode="numeric"
                value={form.minOrderValue}
                onChange={(e) => onChange("minOrderValue", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Số lượt dùng</RequiredLabel>
              <input
                type="number"
                min="1"
                value={form.maxUsage}
                onChange={(e) => onChange("maxUsage", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Ngày bắt đầu</RequiredLabel>
              <input
                type="date"
                min={minDate}
                value={form.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
                className={`h-14 w-full rounded-xl border bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#f97316] ${
                  errors.startDate ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.startDate ? (
                <p className="text-xs font-medium text-red-500">{errors.startDate}</p>
              ) : null}
            </label>

            <label className={fieldWrapClass}>
              <RequiredLabel className="text-sm text-slate-500">Ngày hết hạn</RequiredLabel>
              <input
                type="date"
                min={form.startDate || minDate}
                value={form.endDate}
                onChange={(e) => onChange("endDate", e.target.value)}
                className={`h-14 w-full rounded-xl border bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#f97316] ${
                  errors.endDate ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.endDate ? (
                <p className="text-xs font-medium text-red-500">{errors.endDate}</p>
              ) : null}
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mã"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Trang quan ly ma giam gia cua provider.
export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : null;
  };

  // Lay danh sach coupon cua provider.
  const fetchCoupons = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Không tìm thấy token đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/api/coupons/my-coupons", { headers });
      setCoupons(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (fetchError) {
      toast.error(
        fetchError?.response?.data?.message || "Không tải được mã giảm giá.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Cap nhat state form khi provider chon sua.
  const handleEdit = (coupon) => {
    const discountType = coupon.discountType || "percent";
    setEditingId(coupon._id || coupon.id || "");
    setForm({
      code: coupon.code || "",
      discountType,
      discountValue:
        discountType === "fixed"
          ? formatNumberInput(coupon.discountValue ?? "")
          : String(coupon.discountValue ?? ""),
      minOrderValue: formatNumberInput(coupon.minOrderValue ?? ""),
      maxUsage: String(coupon.maxUsage ?? 1),
      startDate: coupon.startDate ? String(coupon.startDate).slice(0, 10) : "",
      endDate: coupon.endDate ? String(coupon.endDate).slice(0, 10) : "",
      serviceIds: Array.isArray(coupon.serviceIds)
        ? coupon.serviceIds.map((item) => String(item)).join(", ")
        : "",
      status: coupon.status || "active",
    });
    setError("");
    setShowModal(true);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      ...(field === "discountType"
        ? {
            discountType: value,
            discountValue: formatDiscountValueInput(value, prev.discountValue),
          }
        : {
            [field]:
              field === "minOrderValue"
                ? formatNumberInput(value)
                : field === "discountValue"
                  ? formatDiscountValueInput(prev.discountType, value)
                  : value,
          }),
    }));
  };

  const buildPayload = () => ({
    ...form,
    discountValue:
      form.discountType === "fixed"
        ? Number(getDigitsOnly(form.discountValue))
        : Number(form.discountValue || 0),
    minOrderValue: Number(getDigitsOnly(form.minOrderValue)),
    maxUsage: Number(form.maxUsage || 1),
    serviceIds: String(form.serviceIds || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Không tìm thấy token đăng nhập.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = buildPayload();
      if (
        payload.discountType === "percent" &&
        (payload.discountValue < 1 || payload.discountValue > 100)
      ) {
        toast.error("Phần trăm giảm giá phải từ 1 đến 100.");
        return;
      }

      if (payload.discountType === "fixed" && payload.discountValue <= 0) {
        toast.error("Số tiền giảm phải lớn hơn 0 VNĐ.");
        return;
      }

      if (editingId) {
        await axios.put(`/api/coupons/${editingId}`, payload, { headers });
        toast.success("Cập nhật mã giảm giá thành công.");
      } else {
        await axios.post("/api/coupons", payload, { headers });
        toast.success("Tạo mã giảm giá thành công.");
      }

      closeModal();
      await fetchCoupons();
    } catch (submitError) {
      toast.error(
        submitError?.response?.data?.message || "Không lưu được mã giảm giá.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xoa coupon cua provider.
  const handleDelete = async (couponId) => {
    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Không tìm thấy token đăng nhập.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này không?")) return;

    try {
      setError("");
      setIsSubmitting(true);

      await axios.delete(`/api/coupons/${couponId}`, { headers });

      toast.success("Đã xóa mã giảm giá.");
      await fetchCoupons();
    } catch (deleteError) {
      toast.error(
        deleteError?.response?.data?.message || "Không xóa được mã giảm giá.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const couponCountLabel = useMemo(
    () => `${coupons.length} `,
    [coupons.length],
  );

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
            Quản lý mã giảm giá
          </h1>
        </div>

      </div>

      {error ? (
        <div className="mx-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 sm:mx-6">
          {error}
        </div>
      ) : null}

      <div className="mx-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mx-6 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">
              Danh sách mã giảm giá
            </h2>
            <span className="text-[12px] text-gray-400">Tổng số mã : {couponCountLabel}</span>
          </div>

          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-5 text-sm font-semibold text-[#f97316] transition hover:bg-orange-100"
          >
            <span className="inline-flex items-center gap-2">
              <FiPlus size={16} /> Thêm mã giảm giá
            </span>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Đang tải mã giảm giá...
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
            Chưa có mã giảm giá nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-3 py-3 font-medium">Mã</th>
                  <th className="px-3 py-3 font-medium">Kiểu giảm</th>
                  <th className="px-3 py-3 font-medium">Giá trị</th>
                  <th className="px-3 py-3 font-medium">Đơn tối thiểu</th>
                  <th className="px-3 py-3 font-medium">Sử dụng</th>
                  <th className="px-3 py-3 font-medium">Hiệu lực</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                  <th className="px-3 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => {
                  const status =
                    STATUS_CONFIG[coupon.status] || STATUS_CONFIG.active;
                  return (
                    <tr
                      key={coupon._id}
                      className="border-b border-gray-100 transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className="px-3 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {coupon.code}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {Array.isArray(coupon.serviceIds) &&
                            coupon.serviceIds.length > 0
                              ? `${coupon.serviceIds.length} dịch vụ`
                              : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {DISCOUNT_TYPE_LABEL[coupon.discountType] ||
                          coupon.discountType ||
                          "—"}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-600">
                        {formatDiscountValue(coupon)}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {Number(coupon.minOrderValue || 0).toLocaleString(
                          "vi-VN",
                        )}
                        đ
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {Number(coupon.usedCount || 0)}/
                        {Number(coupon.maxUsage || 0)}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        <div className="flex whitespace-nowrap">
                          <p>{formatDate(coupon.startDate)}</p>
                          <p className="text-xs text-slate-400">
                           - {formatDate(coupon.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(coupon)}
                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                            title="Sửa"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon._id)}
                            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                            title="Xóa"
                          >
                            <FiTrash2 size={16} />
                          </button>
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

      <CouponFormModal
        open={showModal}
        isEdit={!!editingId}
        form={form}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={updateForm}
      />
    </div>
  );
}

