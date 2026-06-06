import React from "react";
import { FiTrash2 } from "react-icons/fi";

export default function DeleteScheduleModal({
  open,
  scheduleName,
  isSubmitting,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} role="presentation" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
          <FiTrash2 size={24} className="text-red-500" />
        </div>

        <h3 className="mb-2 text-[16px] font-bold text-gray-900">Xác nhận xóa?</h3>

        <p className="mb-6 text-[13px] text-gray-500">
          Xóa lịch khởi hành <span className="font-semibold text-gray-700">"{scheduleName}"</span>?
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-2.5 text-[13px] font-medium text-gray-600">
            Hủy
          </button>

          <button onClick={onConfirm} disabled={isSubmitting} className="flex-1 rounded-xl bg-red-500 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
            {isSubmitting ? "Đang xóa..." : "Xóa lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}
