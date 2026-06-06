import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CiLogin } from "../../assets/Icons/Icons";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";
import { useAuthStorage } from "../../utils/authStorage.js";
import TermsContent from "./TermsContent";

const defaultForm = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPass: "",
  role: "user",
  taxCode: "",
  businessLicense: "",
  address: "",
  legalRepresentative: "",
  bankAccountNumber: "",
  bankName: "",
  agreements: {
    termsAccepted: false,
    policyAccepted: false,
    complaintPolicyAccepted: false,
    infoCommitment: false,
  },
};

const createDefaultForm = (role = "user") => ({
  ...defaultForm,
  role,
  agreements: { ...defaultForm.agreements },
});

const createDefaultFormForCurrentUser = (role, user) => ({
  ...createDefaultForm(role),
  fullName: user?.fullName || "",
  email: user?.email || "",
  phone: user?.phone || "",
});

const PERSON_NAME_REGEX = /^[\p{L}\s]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BUSINESS_TEXT_REGEX = /^[\p{L}\d\s]+$/u;
const VIETNAM_PHONE_REGEX = /^0\d{9}$/;
const MAX_BUSINESS_LICENSE_SIZE = 5 * 1024 * 1024;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Register({
  initialRole = "user",
  lockRole = false,
  useCurrentUserCredentials = false,
}) {
  const navigate = useNavigate();
  const { accessToken, currentUser, user } = useAuthStorage();
  const loggedInUser = currentUser || user;
  const [form, setForm] = useState(() =>
    useCurrentUserCredentials
      ? createDefaultFormForCurrentUser(initialRole, loggedInUser)
      : createDefaultForm(initialRole),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const fieldRefs = {
    fullName: useRef(null),
    businessName: useRef(null),
    taxCode: useRef(null),
    address: useRef(null),
    businessLicense: useRef(null),
    legalRepresentative: useRef(null),
    bankAccountNumber: useRef(null),
    bankName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPass: useRef(null),
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setAgreement = (key, value) => {
    setForm((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [key]: value,
      },
    }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (!useCurrentUserCredentials || !loggedInUser) return;

    setForm((prev) => ({
      ...prev,
      fullName: loggedInUser.fullName || prev.fullName,
      email: loggedInUser.email || prev.email,
      phone: loggedInUser.phone || prev.phone,
      password: "",
      confirmPass: "",
    }));
  }, [loggedInUser, useCurrentUserCredentials]);

  const handleBusinessLicenseChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setField("businessLicense", "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setField("businessLicense", "");
      setError("Vui lòng chọn file ảnh giấy phép kinh doanh");
      return;
    }

    if (file.size > MAX_BUSINESS_LICENSE_SIZE) {
      setField("businessLicense", "");
      setError("Ảnh giấy phép kinh doanh không được vượt quá 5MB");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setField("businessLicense", dataUrl);
      setError("");
    } catch {
      setError("Khong the doc file anh, vui long thu lai");
    }
  };

  const validateProviderForm = () => {
    const businessName = form.businessName.trim();
    const address = form.address.trim();
    const bankAccountNumber = form.bankAccountNumber.trim();

    if (!businessName)
      return "Vui lòng nhập tên doanh nghiệp/hộ kinh doanh/thương nhân";
    if (!BUSINESS_TEXT_REGEX.test(businessName))
      return "Tên doanh nghiệp không được chứa ký tự đặc biệt";
    if (businessName.length < 5 || businessName.length > 30)
      return "Tên doanh nghiệp phải từ 5 đến 30 ký tự";
    if (!form.taxCode.trim()) return "Vui lòng nhập mã số thuế";
    if (!address) return "Vui lòng nhập địa chỉ doanh nghiệp";
    if (address.length < 5 || address.length > 30)
      return "Địa chỉ doanh nghiệp phải từ 5 đến 30 ký tự";
    if (!form.businessLicense.trim())
      return "Vui lòng upload giấy phép kinh doanh";
    if (!form.legalRepresentative.trim())
      return "Vui lòng nhập người đại diện pháp luật";
    if (!bankAccountNumber)
      return "Vui lòng nhập số tài khoản ngân hàng";
    if (!/^\d+$/.test(bankAccountNumber))
      return "Số tài khoản ngân hàng bắt buộc phải là số";
    if (!form.bankName.trim()) return "Vui lòng nhập tên ngân hàng";
    if (form.agreements.termsAccepted !== true) {
      return "Bạn cần đồng ý với điều khoản hợp tác";
    }
    return "";
  };

  const focusFirstInvalidField = (errors) => {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;
    fieldRefs[firstField]?.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const nextErrors = {};

    if (form.role === "user") {
      if (!fullName) {
        nextErrors.fullName = "Vui lòng nhập họ tên";
      } else if (!PERSON_NAME_REGEX.test(fullName)) {
        nextErrors.fullName = "Vui lòng nhập đúng định dạng ";
      } else if (fullName.length < 3 || fullName.length > 30) {
        nextErrors.fullName = "Họ tên phải từ 3 đến 30 ký tự";
      }
    } else {
      const businessName = form.businessName.trim();
      const address = form.address.trim();
      const bankAccountNumber = form.bankAccountNumber.trim();

      if (!businessName) {
        nextErrors.businessName = "Vui lòng nhập tên doanh nghiệp";
      } else if (!BUSINESS_TEXT_REGEX.test(businessName)) {
        nextErrors.businessName = "Tên doanh nghiệp không được chứa ký tự đặc biệt";
      } else if (businessName.length < 5 || businessName.length > 30) {
        nextErrors.businessName = "Tên doanh nghiệp phải từ 5 đến 30 ký tự";
      }
      if (!form.taxCode.trim()) nextErrors.taxCode = "Vui lòng nhập mã số thuế";
      if (!address) {
        nextErrors.address = "Vui lòng nhập địa chỉ doanh nghiệp";
      } else if (address.length < 5 || address.length > 30) {
        nextErrors.address = "Địa chỉ doanh nghiệp phải từ 5 đến 30 ký tự";
      }
      if (!form.businessLicense.trim()) nextErrors.businessLicense = "Vui lòng upload giấy phép kinh doanh";
      if (!form.legalRepresentative.trim()) nextErrors.legalRepresentative = "Vui lòng nhập người đại diện pháp luật";
      if (!bankAccountNumber) {
        nextErrors.bankAccountNumber = "Vui lòng nhập số tài khoản ngân hàng";
      } else if (!/^\d+$/.test(bankAccountNumber)) {
        nextErrors.bankAccountNumber = "Số tài khoản ngân hàng bắt buộc phải là số";
      }
      if (!form.bankName.trim()) nextErrors.bankName = "Vui lòng nhập tên ngân hàng";
      if (form.agreements.termsAccepted !== true) nextErrors.termsAccepted = "Bạn cần đồng ý với điều khoản hợp tác";
    }

    if (!useCurrentUserCredentials && !email) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!useCurrentUserCredentials && !EMAIL_REGEX.test(email)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (!useCurrentUserCredentials && !phone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!useCurrentUserCredentials && !/^\d+$/.test(phone)) {
      nextErrors.phone = "Số điện thoại chỉ được nhập số";
    } else if (!useCurrentUserCredentials && !VIETNAM_PHONE_REGEX.test(phone)) {
      nextErrors.phone = "Số điện thoại phải đúng 10 số và bắt đầu bằng số 0";
    }

    if (!useCurrentUserCredentials && !form.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (!useCurrentUserCredentials && (form.password.length < 6 || form.password.length > 10)) {
      nextErrors.password = "Mật khẩu phải từ 6 đến 10 ký tự";
    }

    if (!useCurrentUserCredentials && !form.confirmPass) {
      nextErrors.confirmPass = "Vui lòng nhập lại mật khẩu";
    } else if (!useCurrentUserCredentials && form.password !== form.confirmPass) {
      nextErrors.confirmPass = "Nhập lại mật khẩu phải trùng với mật khẩu";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("");
      focusFirstInvalidField(nextErrors);
      return;
    }

    setFieldErrors({});

    if (form.role === "user") {
      if (!fullName || !email || !phone || !form.password || !form.confirmPass) {
        setError("Không được để trống thông tin đăng ký");
        return;
      }

      if (!PERSON_NAME_REGEX.test(fullName)) {
        setError("Họ tên chỉ được chứa chữ cái");
        return;
      }

      if (fullName.length < 3 || fullName.length > 30) {
        setError("Họ tên phải từ 3 đến 30 ký tự");
        return;
      }
    }

    if (!useCurrentUserCredentials && !EMAIL_REGEX.test(email)) {
      setError("Email không đúng định dạng");
      return;
    }

    if (!useCurrentUserCredentials && !/^\d+$/.test(phone)) {
      setError("Số điện thoại chỉ được nhập số");
      return;
    }

    if (!useCurrentUserCredentials && !VIETNAM_PHONE_REGEX.test(phone)) {
      setError("Số điện thoại phải đúng 10 số và bắt đầu bằng số 0");
      return;
    }

    if (!useCurrentUserCredentials && (form.password.length < 6 || form.password.length > 10)) {
      setError("Mật khẩu phải từ 6 đến 10 ký tự");
      return;
    }

    if (!useCurrentUserCredentials && form.password !== form.confirmPass) {
      setError("Nhập lại mật khẩu phải trùng với mật khẩu");
      return;
    }

    if (form.role === "provider") {
      const providerError = validateProviderForm();
      if (providerError) {
        setError(providerError);
        return;
      }
    }

    setLoading(true);
    setError("");
    setSubmitted(true);
  };

  useEffect(() => {
    if (!submitted) return;

    const registerUser = async () => {
      try {
        const payload = {
          fullName:
            form.role === "provider" ? form.businessName.trim() : form.fullName.trim(),
          businessName: form.businessName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPass: form.confirmPass,
          role: form.role,
        };

        if (form.role === "provider") {
          payload.taxCode = form.taxCode.trim();
          payload.businessLicense = form.businessLicense;
          payload.address = form.address.trim();
          payload.legalRepresentative = form.legalRepresentative.trim();
          payload.bankAccountNumber = form.bankAccountNumber.trim();
          payload.bankName = form.bankName.trim();
          payload.agreements = form.agreements;
        }

        const endpoint = useCurrentUserCredentials
          ? "/api/auth/register-provider"
          : "/api/auth/register";
        const headers = {
          "Content-Type": "application/json",
          ...(useCurrentUserCredentials && accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}),
        };
        const body = useCurrentUserCredentials
          ? {
              businessName: form.businessName.trim(),
              taxCode: form.taxCode.trim(),
              businessLicense: form.businessLicense,
              address: form.address.trim(),
              legalRepresentative: form.legalRepresentative.trim(),
              bankAccountNumber: form.bankAccountNumber.trim(),
              bankName: form.bankName.trim(),
              agreements: form.agreements,
            }
          : payload;

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(data.message || "Đăng ký thành công", { duration: 4000 });
          setForm(createDefaultForm(initialRole));
          if (useCurrentUserCredentials) {
            setTimeout(() => navigate("/"), 1000);
          } else {
            setTimeout(() => navigate("/signin"), 1000);
          }
        } else {
          if (data.message?.toLowerCase().includes("email")) {
            const nextErrors = { email: data.message };
            setFieldErrors(nextErrors);
            focusFirstInvalidField(nextErrors);
          } else if (data.message?.toLowerCase().includes("số điện thoại")) {
            const nextErrors = { phone: data.message };
            setFieldErrors(nextErrors);
            focusFirstInvalidField(nextErrors);
          }
          setError(data.message || "Đăng ký thất bại");
        }
      } catch {
        setError("Lỗi hệ thống");
      } finally {
        setLoading(false);
        setSubmitted(false);
      }
    };

    registerUser();
  }, [accessToken, form, initialRole, navigate, submitted, useCurrentUserCredentials]);

  const checkboxItems = [
    {
      key: "termsAccepted",
      label: (
        <>
          Tôi đã đọc và đồng ý với{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTerms(true);
            }}
            className="font-medium text-[#f97316] underline underline-offset-2 transition hover:text-orange-600"
          >
            điều khoản
          </button>{" "}
          hợp tác
        </>
      ),
    },
  ];

  const inputClass =
    "flex h-12 w-full items-center rounded-xl border border-gray-200 bg-[#f8fafc] px-4 text-[#0f172a] outline-none transition-colors focus:border-[#f97316] focus:bg-white";
  const uploadClass =
    "flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-orange-200 bg-[#f8fafc] px-4 text-sm text-slate-600 outline-none transition hover:border-orange-300 focus:border-[#f97316] focus:bg-white";
  const getInputClass = (field) =>
    fieldErrors[field]
      ? `${inputClass} border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-100`
      : inputClass;
  const getUploadClass = (field) =>
    fieldErrors[field]
      ? `${uploadClass} border-rose-500 text-rose-600`
      : uploadClass;
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-2 px-1 text-left text-sm leading-5 text-rose-500">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#f8fafc] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 mt-8 text-center">
          <h1
            className="mb-2 text-[#0f172a]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            Đăng ký
          </h1>
          <p className="mt-2 text-slate-500" style={{ fontSize: 15 }}>
            {useCurrentUserCredentials
              ? "Hoàn tất thông tin đối tác để chờ admin duyệt"
              : "Tạo tài khoản mới để bắt đầu hành trình"}
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"
        >
          {!lockRole ? (
          <div className="flex gap-2 rounded-2xl bg-[#f8fafc] p-2">
            {[
              { value: "user", label: "Khách hàng" },
              { value: "provider", label: "Đối tác / Nhà cung cấp" },
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setField("role", role.value)}
                className={`flex-1 rounded-2xl py-2.5 transition-all ${form.role === role.value
                    ? "bg-[#f97316] text-white shadow-sm"
                    : "text-slate-500"
                  }`}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {role.label}
              </button>
            ))}
          </div>
          ) : null}

          {form.role === "user" ? (
            <div>
              <label
                className="mb-2 block pl-2 text-left text-slate-500"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                <RequiredLabel>Họ tên</RequiredLabel>
              </label>
              <input
                ref={fieldRefs.fullName}
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                required
                className={getInputClass("fullName")}
                style={{ fontSize: 14 }}
              />
              <FieldError name="fullName" />
            </div>
          ) : (
            <div>
              <label
                className="mb-2 block pl-2 text-left text-slate-500"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                <RequiredLabel>Tên doanh nghiệp/hộ kinh doanh/thương nhân</RequiredLabel>
              </label>
              <input
                ref={fieldRefs.businessName}
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                required
                className={getInputClass("businessName")}
                style={{ fontSize: 14 }}
              />
              <FieldError name="businessName" />
            </div>
          )}

          {form.role === "provider" ? (
            <div>
              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Mã số thuế</RequiredLabel>
                </label>
                <input
                  ref={fieldRefs.taxCode}
                  value={form.taxCode}
                  onChange={(e) => setField("taxCode", e.target.value)}
                  className={getInputClass("taxCode")}
                  style={{ fontSize: 14 }}
                />
                <FieldError name="taxCode" />
              </div>

              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Địa chỉ doanh nghiệp</RequiredLabel>
                </label>
                <input
                  ref={fieldRefs.address}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={getInputClass("address")}
                  style={{ fontSize: 14 }}
                />
                <FieldError name="address" />
              </div>

              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Giấy phép kinh doanh</RequiredLabel>
                </label>
                <label className={getUploadClass("businessLicense")}>
                  <span>Upload ảnh</span>
                  <span className="text-xs text-slate-400">
                    {form.businessLicense ? "Đã chọn ảnh" : "Chưa upload"}
                  </span>
                  <input
                    ref={fieldRefs.businessLicense}
                    type="file"
                    accept="image/*"
                    onChange={handleBusinessLicenseChange}
                    className="hidden"
                  />
                </label>
                <FieldError name="businessLicense" />
              </div>

              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Người đại diện pháp luật</RequiredLabel>
                </label>
                <input
                  ref={fieldRefs.legalRepresentative}
                  value={form.legalRepresentative}
                  onChange={(e) =>
                    setField("legalRepresentative", e.target.value)
                  }
                  className={getInputClass("legalRepresentative")}
                  style={{ fontSize: 14 }}
                />
                <FieldError name="legalRepresentative" />
              </div>

              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Số tài khoản ngân hàng</RequiredLabel>
                </label>
                <input
                  ref={fieldRefs.bankAccountNumber}
                  value={form.bankAccountNumber}
                  onChange={(e) =>
                    setField("bankAccountNumber", e.target.value)
                  }
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className={getInputClass("bankAccountNumber")}
                  style={{ fontSize: 14 }}
                />
                <FieldError name="bankAccountNumber" />
              </div>

              <div>
                <label
                  className="mb-2 block pl-2 text-left text-slate-500"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <RequiredLabel>Ngân hàng</RequiredLabel>
                </label>
                <input
                  ref={fieldRefs.bankName}
                  value={form.bankName}
                  onChange={(e) => setField("bankName", e.target.value)}
                  required
                  className={getInputClass("bankName")}
                  style={{ fontSize: 14 }}
                />
                <FieldError name="bankName" />
              </div>
            </div>
          ) : null}

          {!useCurrentUserCredentials ? (
          <>
          <div>
            <label
              className="mb-2 block pl-2 text-left text-slate-500"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <RequiredLabel>Email</RequiredLabel>
            </label>
            <input
              ref={fieldRefs.email}
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
              className={getInputClass("email")}
              style={{ fontSize: 14 }}
            />
            <FieldError name="email" />
          </div>

          <div>
            <label
              className="mb-2 block pl-2 text-left text-slate-500"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <RequiredLabel>Số điện thoại</RequiredLabel>
            </label>
            <input
              ref={fieldRefs.phone}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              inputMode="numeric"
              pattern="0[0-9]{9}"
              required
              className={getInputClass("phone")}
              style={{ fontSize: 14 }}
            />
            <FieldError name="phone" />
          </div>

          <div>
            <label
              className="mb-2 block pl-2 text-left text-slate-500"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <RequiredLabel>Mật khẩu</RequiredLabel>
            </label>
            <input
              ref={fieldRefs.password}
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              className={getInputClass("password")}
              style={{ fontSize: 14 }}
            />
            <FieldError name="password" />
          </div>

          <div className="mb-5 ">
            <label
              className="mb-2 block pl-2 text-left text-slate-500"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <RequiredLabel>Xác nhận mật khẩu</RequiredLabel>
            </label>
            <input
              ref={fieldRefs.confirmPass}
              type="password"
              value={form.confirmPass}
              onChange={(e) => setField("confirmPass", e.target.value)}
              required
              className={getInputClass("confirmPass")}
              style={{ fontSize: 14 }}
            />
            <FieldError name="confirmPass" />
          </div>
          </>
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-left text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Tài khoản đang đăng nhập</p>
              <p className="mt-1">Email: {form.email || "Chưa có email"}</p>
              <p>Số điện thoại: {form.phone || "Chưa có số điện thoại"}</p>
            </div>
          )}

          {form.role === "provider" ? (
            <div className="space-y-3 rounded-2xl border border-white bg-white p-4">
              {checkboxItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 text-left text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.agreements[item.key])}
                    onChange={(e) => setAgreement(item.key, e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <FieldError name="termsAccepted" />
            </div>
          ) : null}

          {error ? (
            <div className="space-y-2">
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] py-3.5 text-white transition-all hover:shadow-lg hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            <CiLogin size={20} />
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>

          {!useCurrentUserCredentials ? (
            <p className="mt-3 text-center text-slate-500" style={{ fontSize: 14 }}>
              Đã có tài khoản?{" "}
              <Link
                to="/signin"
                className="text-[#f97316] transition hover:underline"
                style={{ fontWeight: 600 }}
              >
                Đăng nhập
              </Link>
            </p>
          ) : null}
        </form>
      </div>

      {showTerms ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Điều khoản
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  Điều khoản hợp tác
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
              <TermsContent />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
