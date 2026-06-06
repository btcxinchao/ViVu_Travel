import React, { useEffect, useRef, useState } from "react";
import { FiFileText, FiX } from "react-icons/fi";

export default function ScheduleImportModal({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  const hasFile = !!file;

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">
              Upload lịch trình từ Excel
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-400">
              Tải file .xlsx, .xls hoặc .csv theo đúng mẫu
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100"
          >
            <FiX className="text-gray-500" size={16} />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-[13px] text-gray-700">
            <p className="font-semibold text-gray-900">Cấu trúc file mẫu</p>
            <p className="mt-1 leading-6">
              Cột cần có: <span className="font-medium">serviceId</span>, <span className="font-medium">serviceName</span>, <span className="font-medium">departureDate</span>, <span className="font-medium">endDate</span>, <span className="font-medium">maxPeople</span>, <span className="font-medium">note</span>, <span className="font-medium">status</span>.
            </p>
            <a
              href="/templates/schedule-import-template.xlsx"
              className="mt-2 inline-flex items-center gap-2 font-semibold text-orange-600 underline-offset-4 hover:underline"
              download
            >
              <FiFileText size={14} />
              Tải file mẫu Excel
            </a>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
              Chọn file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-700 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-orange-600"
            />
            {file && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-3 py-2 text-[13px] text-gray-600">
                <span className="min-w-0 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Xóa file Excel"
                >
                  <FiX size={15} />
                </button>
              </div>
            )}
            <p className="mt-2 text-[12px] text-gray-400">
              Dòng đầu tiên phải là tiêu đề cột. Ngày nên nhập theo định dạng YYYY-MM-DD.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-7 py-5">
          <button
            onClick={onClose}
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-600"
          >
            Hủy
          </button>

          <button
            onClick={() => onSubmit(file)}
            disabled={isSubmitting || !hasFile}
            type="button"
            className="rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-6 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Đang import..." : "Import file"}
          </button>
        </div>
      </div>
    </div>
  );
}
