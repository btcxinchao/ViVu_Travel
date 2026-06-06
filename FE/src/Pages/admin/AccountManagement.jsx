import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { IoSearch } from "react-icons/io5";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const ACCOUNTS_PER_PAGE = 10;
const PERSON_NAME_REGEX = /^[\p{L}\s]+$/u;

const AccountManagement = () => {
  const [accountSearch, setAccountSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const addAccountRefs = {
    fullName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100";
  const getInputClass = (field) =>
    fieldErrors[field]
      ? `${inputClass} border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-100`
      : inputClass;
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-2 text-left text-sm leading-5 text-rose-500">
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

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setError("");
        const accessToken = localStorage.getItem("accessToken");

        const result = await axios.get("/api/admin/allAccounts", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setAccounts((result.data.data || []).filter((item) => item?.role !== "provider"));
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải danh sách tài khoản");
      }
    };

    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((item) => {
    if (item?.role === "provider") return false;
    const keyword = accountSearch.trim().toLowerCase();
    if (!keyword) return true;

    const fullName = String(item.fullName || "").toLowerCase();
    const email = String(item.email || "").toLowerCase();
    return fullName.includes(keyword) || email.includes(keyword);
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    const aIsPendingProvider = a?.role === "provider" && a?.status === "pending";
    const bIsPendingProvider = b?.role === "provider" && b?.status === "pending";

    if (aIsPendingProvider !== bIsPendingProvider) {
      return aIsPendingProvider ? -1 : 1;
    }

    const aCreatedAt = new Date(a?.createdAt || 0).getTime();
    const bCreatedAt = new Date(b?.createdAt || 0).getTime();
    return bCreatedAt - aCreatedAt;
  });

  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / ACCOUNTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ACCOUNTS_PER_PAGE;
  const paginatedAccounts = sortedAccounts.slice(startIndex, startIndex + ACCOUNTS_PER_PAGE);
  const showingFrom = sortedAccounts.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + paginatedAccounts.length, sortedAccounts.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [accountSearch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateAccountStatus = (id, status) => {
    setAccounts((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
  };

  const approveProvider = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/admin/approve-provider/${id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      updateAccountStatus(id, "active");
    } catch (err) {
      setError(err?.response?.data?.message || "Duyệt provider thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const rejectProvider = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/admin/reject-provider/${id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      updateAccountStatus(id, "rejected");
    } catch (err) {
      setError(err?.response?.data?.message || "Từ chối provider thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const blockAccount = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/admin/lock-account/${id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      updateAccountStatus(id, "locked");
    } catch (err) {
      setError(err?.response?.data?.message || "Khóa tài khoản thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const unblockAccount = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/admin/unlock-account/${id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      updateAccountStatus(id, "active");
    } catch (err) {
      setError(err?.response?.data?.message || "Mở khóa tài khoản thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const deleteAccount = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa tài khoản này không?");
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(id);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(`/api/admin/delete-account/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAccounts((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || "Xóa tài khoản thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const addAccount = async () => {
    try {
      setError("");
      setActionLoadingId("create");
      const accessToken = localStorage.getItem("accessToken");

      const fullName = newFullName.trim();
      const email = newEmail.trim();
      const phone = newPhone.trim();
      const nextErrors = {};

      if (!fullName) {
        nextErrors.fullName = "Vui lòng nhập họ và tên";
      } else if (!PERSON_NAME_REGEX.test(fullName)) {
        setError("Họ và tên chỉ được chứa chữ cái");
        return;
      }

      if (fullName.length < 5 || fullName.length > 30) {
        setError("Họ và tên phải từ 5 đến 30 ký tự");
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        setError("Số điện thoại phải đúng 10 số");
        return;
      }

      const payload = {
        fullName,
        email,
        phone,
        password: newPassword,
        role: newRole,
        status: "active",
      };

      const result = await axios.post("/api/admin/add-account", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const created = result.data?.data;
      const createdId = created?.id || created?._id;
      if (createdId) {
        setAccounts((prev) => [
          {
            _id: createdId,
            fullName: created.fullName,
            email: created.email,
            phone: created.phone,
            role: created.role,
            status: created.status,
          },
          ...prev,
        ]);
      }

      setShowAddUser(false);
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole("user");
      setNewPassword("");
    } catch (err) {
      setError(err?.response?.data?.message || "Thêm tài khoản thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-left text-xl font-semibold text-slate-900">Quản lý tài khoản</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAddUser((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <HiOutlineUserPlus className="text-base" />
          Thêm tài khoản
        </button>
      </div>

      {showAddUser && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
          <label className="space-y-2">
            <RequiredLabel className="text-sm text-slate-500">Họ và tên</RequiredLabel>
            <input placeholder="Họ và tên" className={inputClass} value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
          </label>
          <label className="space-y-2">
            <RequiredLabel className="text-sm text-slate-500">Email</RequiredLabel>
            <input placeholder="Email" className={inputClass} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </label>
          <label className="space-y-2">
            <RequiredLabel className="text-sm text-slate-500">Số điện thoại</RequiredLabel>
            <input placeholder="Số điện thoại" className={inputClass} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </label>
          <label className="space-y-2">
            <RequiredLabel className="text-sm text-slate-500">Mật khẩu</RequiredLabel>
            <input placeholder="Mật khẩu" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>
          <label className="space-y-2">
            <RequiredLabel className="text-sm text-slate-500">Vai trò</RequiredLabel>
            <select className={inputClass} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">user</option>
              <option value="provider">provider</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button type="button" onClick={() => setShowAddUser(false)} className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-medium text-slate-700">
              Hủy
            </button>
            <button type="button" onClick={addAccount} disabled={actionLoadingId === "create"} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white">
              Thêm
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {actionLoadingId && <p className="text-sm text-slate-400">Đang xử lý...</p>}

      <div className="relative">
        <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} placeholder="Tìm theo tên, email..." className={`${inputClass} pl-11`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">STT</th>
              <th className="px-4 py-3 text-left font-medium">Tên</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">SDT</th>
              <th className="px-4 py-3 text-left font-medium">Vai trò</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccounts.map((item, index) => (
              <tr key={item._id}>
                <td className="px-4 py-3 text-left">{startIndex + index + 1}</td>
                <td className="px-4 py-3 text-left">{item.fullName}</td>
                <td className="px-4 py-3 text-left">{item.email}</td>
                <td className="px-4 py-3 text-left">{item.phone || "--"}</td>
                <td className="px-4 py-3 text-left">{item.role}</td>
                <td className="px-4 py-3 text-left">{item.status}</td>
                <td className="px-4 py-3 text-left flex gap-2">
                  {item.role === "provider" && item.status === "pending" && (
                    <>
                      <button type="button" onClick={() => approveProvider(item._id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100">
                        Duyệt
                      </button>
                      <button type="button" onClick={() => rejectProvider(item._id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                        Từ chối
                      </button>
                    </>
                  )}

                  {item.status === "locked" ? (
                    <button type="button" onClick={() => unblockAccount(item._id)} className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-100">
                      Mở khóa
                    </button>
                  ) : (
                    <button type="button" onClick={() => blockAccount(item._id)} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      Khóa
                    </button>
                  )}

                  <button type="button" onClick={() => deleteAccount(item._id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}

            {sortedAccounts.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-16 text-center text-slate-400">
                  Chưa có dữ liệu tài khoản
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AccountManagement;
