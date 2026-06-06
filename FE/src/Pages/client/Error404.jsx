import { Link } from "react-router-dom";
import { FaArrowLeft, FaTriangleExclamation } from "react-icons/fa6";

function Error404() {
  return (
    <div className="min-h-[70vh] bg-[#f9fafb] px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-[#f97316] shadow-sm">
          <FaTriangleExclamation size={34} />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-[#f97316]">
          404
        </p>
        <h1
          className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Không được phép truy cập
        </h1>
        <p className="mb-8 max-w-xl text-[15px] leading-7 text-slate-500">
          Trang bạn đang cố truy cập không tồn tại hoặc bạn không có quyền xem nội
          dung này.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-orange-200"
          >
            <FaArrowLeft size={14} />
            Về trang chủ
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#f97316]/40 hover:text-[#f97316]"
          >
            Xem dịch vụ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Error404;
