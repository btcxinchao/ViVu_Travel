import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CiLogin, FaRegEye, FaRegEyeSlash } from "../../assets/Icons/Icons";
import CustomApi from "../../../Server";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";
import { saveAuth } from "../../utils/authStorage.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignIn() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const getRedirectPath = (role) => {
    const normalizedRole = String(role || "").toLowerCase();
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "provider") return "/provider";
    return "/";
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (currentUser) {
    return <Navigate to={getRedirectPath(currentUser.role)} replace />;
  }

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-700 outline-none shadow-sm transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100";
  const errorInputClass =
    "border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";
  const getInputClass = (field) =>
    `${inputClass} ${fieldErrors[field] ? errorInputClass : ""}`;
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-2 px-1 text-left text-sm leading-5 text-rose-500">
        {fieldErrors[name]}
      </p>
    ) : null;

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!email.trim()) nextErrors.email = "Vui lòng nhập email";
    else if (!EMAIL_REGEX.test(email.trim()))
      nextErrors.email = "Email không đúng định dạng";
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.email) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const res = await CustomApi({
        Url: "/api/auth/login",
        method: "POST",
        data: { email, password },
      });

      const payload = res?.data || res;
      const authData = payload?.accessToken ? payload : payload?.data;
      const accessToken = authData?.accessToken;
      const user = authData?.user;

      if (!accessToken || !user) {
        throw new Error("Phản hồi đăng nhập không hợp lệ");
      }

      saveAuth(accessToken, user);
      toast.success("Đăng nhập thành công", { duration: 4000 });

      navigate(getRedirectPath(user?.role), { replace: true });
    } catch (err) {
      const message = err.message || "Đăng nhập thất bại";
      setFieldErrors({ password: message });
      passwordRef.current?.focus();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fffaf5_0%,#fff7ed_45%,#f8fafc_100%)] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-stone-200 bg-white/95 p-8 shadow-[0_18px_45px_-18px_rgba(120,113,108,0.35)]">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">Đăng nhập</h1>
            <p className="mb-3 mt-1 text-sm text-gray-500">
              Chào mừng bạn quay trở lại VIVU Travel
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block pl-2 text-left text-sm font-medium text-slate-500">
                <RequiredLabel>Email</RequiredLabel>
              </label>
              <input
                ref={emailRef}
                type="email"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                className={getInputClass("email")}
              />
              <FieldError name="email" />
            </div>

            <div>
              <label className="mb-1.5 block pl-2 text-left text-sm font-medium text-slate-500">
                <RequiredLabel>Password</RequiredLabel>
              </label>

              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPw ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  className={`${getInputClass("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-500 transition hover:text-orange-500"
                >
                  {showPw ? <FaRegEyeSlash size={18} /> : <FaRegEye size={18} />}
                </button>
              </div>
              <FieldError name="password" />
            </div>

            <div className="flex justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Ghi nhớ
              </label>

              <span
                onClick={() => navigate("/forgot-password")}
                className="cursor-pointer text-orange-500 hover:underline"
              >
                Quên mật khẩu?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#f97316] to-[#f59e0b] py-3 text-white transition hover:shadow-lg disabled:opacity-70"
            >
              <CiLogin />
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mb-6 mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-500 hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
