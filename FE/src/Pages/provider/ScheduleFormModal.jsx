import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

export default function ScheduleFormModal({
  open,
  isEdit,
  services,
  form,
  isSubmitting,
  errors = {},
  canSubmit = false,
  minDate,
  onClose,
  onChange,
  onBlur,
  onSubmit,
}) {
  if (!open) return null;

  const title = isEdit ? "Sửa lịch khởi hành" : "Thêm lịch khởi hành";
  const description = isEdit ? "Cập nhật thông tin lịch khởi hành" : "Tạo lịch khởi hành mới cho dịch vụ";
  const submitText = isEdit ? "Cập nhật" : "Thêm lịch";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} role="presentation" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">{title}</h2>
            <p className="mt-0.5 text-[13px] text-gray-400">{description}</p>
          </div>

          <button onClick={onClose} type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
            <FiX className="text-gray-500" size={16} />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
              Dịch vụ <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <select value={form.serviceId} onBlur={() => onBlur("serviceId")} onChange={(e) => onChange("serviceId", e.target.value)} className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-4 pr-9 text-[14px] text-gray-800 outline-none focus:border-[#f97316] ${errors.serviceId ? "border-red-400" : "border-gray-200"}`}>
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.location}
                  </option>
                ))}
              </select>

              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
            {errors.serviceId ? <p className="mt-1 text-xs font-medium text-red-500">{errors.serviceId}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                Ngày đi <span className="text-red-500">*</span>
              </label>
              <input type="date" min={minDate} value={form.departureDate} onBlur={() => onBlur("departureDate")} onChange={(e) => onChange("departureDate", e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#f97316] ${errors.departureDate ? "border-red-400" : "border-gray-200"}`} />
              {errors.departureDate ? <p className="mt-1 text-xs font-medium text-red-500">{errors.departureDate}</p> : null}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                Ngày về <span className="text-red-500">*</span>
              </label>
              <input type="date" min={form.departureDate || minDate} value={form.endDate} onBlur={() => onBlur("endDate")} onChange={(e) => onChange("endDate", e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#f97316] ${errors.endDate ? "border-red-400" : "border-gray-200"}`} />
              {errors.endDate ? <p className="mt-1 text-xs font-medium text-red-500">{errors.endDate}</p> : null}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                Số chỗ tối đa <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={form.maxPeople} onBlur={() => onBlur("maxPeople")} onChange={(e) => onChange("maxPeople", e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#f97316] ${errors.maxPeople ? "border-red-400" : "border-gray-200"}`} />
              {errors.maxPeople ? <p className="mt-1 text-xs font-medium text-red-500">{errors.maxPeople}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Ghi chú</label>
            <textarea value={form.note} onBlur={() => onBlur("note")} onChange={(e) => onChange("note", e.target.value)} rows={2} maxLength={500} placeholder="VD: Lịch Tết, đoàn riêng..." className={`w-full resize-none rounded-xl border bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#f97316] ${errors.note ? "border-red-400" : "border-gray-200"}`} />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-red-500">{errors.note || errors.duplicate || ""}</span>
              <span className="text-gray-400">{form.note.length}/500</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-7 py-5">
          <button onClick={onClose} type="button" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-600">
            Hủy
          </button>

          <button onClick={onSubmit} disabled={isSubmitting || !canSubmit} type="button" className="rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-6 py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Đang lưu..." : submitText}
          </button>
        </div>
      </div>
    </div>
  );
}
