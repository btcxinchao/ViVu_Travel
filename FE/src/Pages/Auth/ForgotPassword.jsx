import { useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  MdOutlineMailOutline,
  MdOutlineKey,
  MdArrowBack,
} from "react-icons/md";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const emailRef = useRef(null);

  const inputClass =
    "w-full rounded-2xl border border-[#ead9cb] bg-[#fffaf7] px-4 py-3.5 text-sm text-[#1a1a2e] outline-none transition focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10";
  const errorInputClass =
    "border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-rose-100";
  const actionButtonClass =
    "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:shadow-orange-300 disabled:cursor-not-allowed disabled:opacity-70";

  const setEmailError = (text) => {
    setFieldErrors({ email: text });
    setMessage({ type: "", text: "" });
    emailRef.current?.focus();
  };

  const handleSendResetLink = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setEmailError("Vui lòng nhập email để tiếp tục");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Email không đúng định dạng");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      setFieldErrors({});

      await axios.post("/api/auth/forgot-password", {
        email: normalizedEmail,
      });

      setMessage({ type: "success", text: "Đã gửi" });
    } catch (error) {
      setEmailError(error?.response?.data?.message || "Không thể gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf5] px-4 py-8">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#f97316]/12 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[#f59e0b]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#1a1a2e]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="rounded-[32px] border border-[#f4dfcf] bg-white p-6 shadow-[0_24px_80px_rgba(26,26,46,0.12)] sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f97316]/10">
                <MdOutlineKey className="text-[28px] text-[#f97316]" />
              </div>

              <h1 className="text-3xl font-bold text-[#1a1a2e]">
                Quên mật khẩu
              </h1>
            </div>

            <div className="space-y-5">
              <p className="text-center text-sm text-slate-500">
                Nhập email của bạn
              </p>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1a1a2e]">
                  <RequiredLabel>Email</RequiredLabel>
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({});
                  }}
                  className={`${inputClass} ${fieldErrors.email ? errorInputClass : ""}`}
                  placeholder="Email của bạn"
                />
                {fieldErrors.email ? (
                  <p className="mt-2 px-1 text-left text-sm leading-5 text-rose-500">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={loading}
                className={actionButtonClass}
              >
                <MdOutlineMailOutline className="text-[18px]" />
                {loading ? "Đang gửi..." : "Gửi"}
              </button>

              {message.text ? (
                <p className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm text-green-600">
                  {message.text}
                </p>
              ) : null}

              <Link
                to="/signin"
                className="flex items-center justify-center gap-1 text-sm text-slate-500 transition hover:text-[#f97316]"
              >
                <MdArrowBack className="text-base" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
