import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IoSearch } from "react-icons/io5";
import {
  FaCircleCheck,
  FaCircleXmark,
  FaEye,
  FaLockOpen,
  FaTrashCan,
} from "react-icons/fa6";

function LockIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const statusMeta = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  },
  locked: {
    label: "Đã khóa",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  },
  default: {
    label: "Không rõ",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
};

const ProviderManagement = () => {
  const [keyword, setKeyword] = useState("");
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setError("");
        const accessToken = localStorage.getItem("accessToken");
        const result = await axios.get("/api/admin/providers", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProviders(Array.isArray(result.data?.data) ? result.data.data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách nhà cung cấp",
        );
      }
    };

    fetchProviders();
  }, []);

  const getRowState = (item) => {
    const profileStatus = String(item?.status || "").toLowerCase();
    const userStatus = String(item?.providerID?.status || "").toLowerCase();

    if (userStatus === "locked") return "locked";
    if (profileStatus === "approved") return "approved";
    if (profileStatus === "rejected" || userStatus === "rejected")
      return "rejected";
    if (profileStatus === "pending" || userStatus === "pending")
      return "pending";

    return profileStatus || "default";
  };

  const filteredProviders = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const sorted = [...providers].sort((a, b) => {
      const weight = {
        pending: 0,
        approved: 1,
        locked: 2,
        rejected: 3,
        default: 4,
      };
      const aState = getRowState(a);
      const bState = getRowState(b);

      if (weight[aState] !== weight[bState]) {
        return weight[aState] - weight[bState];
      }

      const aTime = new Date(
        a?.createdAt || a?.providerID?.createdAt || 0,
      ).getTime();
      const bTime = new Date(
        b?.createdAt || b?.providerID?.createdAt || 0,
      ).getTime();
      return bTime - aTime;
    });

    if (!q) return sorted;

    return sorted.filter((item) => {
      const businessName = String(item?.businessName || "").toLowerCase();
      const fullName = String(item?.providerID?.fullName || "").toLowerCase();
      const email = String(item?.providerID?.email || "").toLowerCase();
      const taxCode = String(item?.taxCode || "").toLowerCase();
      const address = String(item?.address || "").toLowerCase();
      const legalRepresentative = String(
        item?.legalRepresentative || "",
      ).toLowerCase();

      return (
        businessName.includes(q) ||
        fullName.includes(q) ||
        email.includes(q) ||
        taxCode.includes(q) ||
        address.includes(q) ||
        legalRepresentative.includes(q)
      );
    });
  }, [keyword, providers]);

  const syncProviderItem = (userId, nextUserStatus, nextProviderStatus) => {
    setProviders((prev) =>
      prev.map((item) =>
        String(item?.providerID?._id) === String(userId)
          ? {
              ...item,
              status: nextProviderStatus || item.status,
              providerID: {
                ...item.providerID,
                status: nextUserStatus || item?.providerID?.status,
              },
            }
          : item,
      ),
    );
  };

  const callProtectedPatch = async (
    url,
    userId,
    nextUserStatus,
    nextProviderStatus,
  ) => {
    try {
      setActionLoadingId(userId);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      syncProviderItem(userId, nextUserStatus, nextProviderStatus);
    } catch (err) {
      setError(err?.response?.data?.message || "Xu ly provider that bai");
    } finally {
      setActionLoadingId("");
    }
  };

  const deleteProvider = async (userId) => {
    const confirmed = window.confirm(
      "Ban co chac muon xoa provider nay khong?",
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(userId);
      setError("");
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(`/api/admin/delete-account/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProviders((prev) =>
        prev.filter((item) => String(item?.providerID?._id) !== String(userId)),
      );
      if (String(selectedProvider?.providerID?._id) === String(userId)) {
        setSelectedProvider(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Xoa provider that bai");
    } finally {
      setActionLoadingId("");
    }
  };

  const renderActions = (item) => {
    const userId = String(item?.providerID?._id || "");
    const userStatus = String(item?.providerID?.status || "").toLowerCase();
    const rowState = getRowState(item);
    const disabled = actionLoadingId === userId;
    const iconButtonClass =
      "inline-flex h-11 w-11 shrink-0 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60";

    if (rowState === "pending") {
      return (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setSelectedProvider(item)}
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
            className={`${iconButtonClass} text-sky-600`}
          >
            <FaEye size={14} />
          </button>
          <button
            type="button"
            disabled={disabled}
            title="Duyệt"
            aria-label="Duyệt"
            onClick={() =>
              callProtectedPatch(
                `/api/admin/approve-provider/${userId}`,
                userId,
                "active",
                "approved",
              )
            }
            className={`${iconButtonClass} text-emerald-600`}
          >
            <FaCircleCheck size={14} />
          </button>
          <button
            type="button"
            disabled={disabled}
            title="Từ chối"
            aria-label="Từ chối"
            onClick={() =>
              callProtectedPatch(
                `/api/admin/reject-provider/${userId}`,
                userId,
                "rejected",
                "rejected",
              )
            }
            className={`${iconButtonClass} text-rose-600`}
          >
            <FaCircleXmark size={14} />
          </button>
        </>
      );
    }

    if (rowState === "approved" || rowState === "locked") {
      return (
        <>
          <button
            type="button"
            disabled={disabled}
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
            onClick={() => setSelectedProvider(item)}
            className={`${iconButtonClass} text-sky-600`}
          >
            <FaEye size={14} />
          </button>
          {userStatus === "locked" ? (
            <button
              type="button"
              disabled={disabled}
              title="Mở khóa"
              aria-label="Mở khóa"
              onClick={() =>
                callProtectedPatch(
                  `/api/admin/unlock-account/${userId}`,
                  userId,
                  "active",
                )
              }
              className={`${iconButtonClass} text-sky-600`}
            >
              <FaLockOpen size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              title="Khóa"
              aria-label="Khóa"
              onClick={() =>
                callProtectedPatch(
                  `/api/admin/lock-account/${userId}`,
                  userId,
                  "locked",
                )
              }
              className={`${iconButtonClass} text-slate-600`}
            >
              <LockIcon />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            title="Xóa"
            aria-label="Xóa"
            onClick={() => deleteProvider(userId)}
            className={`${iconButtonClass} text-rose-600`}
          >
            <FaTrashCan size={14} />
          </button>
        </>
      );
    }

    if (rowState === "rejected") {
      return (
        <>
          <button
            type="button"
            disabled={disabled}
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
            onClick={() => setSelectedProvider(item)}
            className={`${iconButtonClass} text-sky-600`}
          >
            <FaEye size={14} />
          </button>
          <button
            type="button"
            disabled={disabled}
            title="Xóa"
            aria-label="Xóa"
            onClick={() => deleteProvider(userId)}
            className={`${iconButtonClass} text-rose-600`}
          >
            <FaTrashCan size={14} />
          </button>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          disabled={disabled}
          title="Xem chi tiết"
          aria-label="Xem chi tiết"
          onClick={() => setSelectedProvider(item)}
          className={`${iconButtonClass} text-sky-600`}
        >
          <FaEye size={14} />
        </button>
        <button
          type="button"
          disabled={disabled}
          title="Xóa"
          aria-label="Xóa"
          onClick={() => deleteProvider(userId)}
          className={`${iconButtonClass} text-rose-600`}
        >
          <FaTrashCan size={14} />
        </button>
      </>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-left text-xl font-semibold text-slate-900">
          Quản lý nhà cung cấp
        </h2>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
      {actionLoadingId ? (
        <p className="text-sm text-slate-400">Đang xử lý...</p>
      ) : null}

      <div className="relative">
        <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm theo tên doanh nghiệp, email, sdt, mã số thuế, địa chỉ, người đại diện..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">STT</th>
              <th className="px-4 py-3 text-left font-medium">
                Tên doanh nghiệp
              </th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">SDT</th>
              <th className="px-4 py-3 text-left font-medium">Mã số thuế</th>
              <th className="px-4 py-3 text-left font-medium">
                Người đại diện
              </th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.length > 0 ? (
              filteredProviders.map((item, index) => {
                const rowState = getRowState(item);
                const meta = statusMeta[rowState] || statusMeta.default;

                return (
                  <tr key={item._id}>
                    <td className="px-4 py-3 text-left">{index + 1}</td>
                    <td className="px-4 py-3 text-left">
                      {item?.businessName || item?.providerID?.fullName || "--"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {item?.providerID?.email || "--"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {item?.providerID?.phone || "--"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {item?.taxCode || "--"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {item?.legalRepresentative || "--"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex flex-nowrap gap-2">
                        {renderActions(item)}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-16 text-center text-slate-400"
                >
                  Chưa có nhà cung cấp nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedProvider ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Chi tiết Provider
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedProvider?.businessName ||
                    selectedProvider?.providerID?.fullName ||
                    "--"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Thông tin cơ bản
                  </h4>
                  <div className="grid gap-3 text-sm">
                    <p>
                      <span className="font-medium text-slate-500">
                        Tên doanh nghiệp:
                      </span>{" "}
                      {selectedProvider?.businessName || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Mã số thuế:
                      </span>{" "}
                      {selectedProvider?.taxCode || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Địa chỉ:
                      </span>{" "}
                      {selectedProvider?.address || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Người đại diện:
                      </span>{" "}
                      {selectedProvider?.legalRepresentative || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Số tài khoản ngân hàng:
                      </span>{" "}
                      {selectedProvider?.bankAccountNumber || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Ngân hàng:
                      </span>{" "}
                      {selectedProvider?.bankName || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">Email:</span>{" "}
                      {selectedProvider?.providerID?.email || "--"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">
                        Số điện thoại:
                      </span>{" "}
                      {selectedProvider?.providerID?.phone || "--"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Giấy phép kinh doanh
                  </h4>
                  {selectedProvider?.businessLicense ? (
                    <a
                      href={selectedProvider.businessLicense}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <img
                        src={selectedProvider.businessLicense}
                        alt="Business license"
                        className="h-72 w-full object-contain"
                      />
                    </a>
                  ) : (
                    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                      Chưa có giấy phép kinh doanh
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProviderManagement;
