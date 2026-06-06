import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaClock,
  FaHeart,
  FaEye,
  FaPenToSquare,
  FaTicket,
  FaTrash,
  FaUser,
  FaStar,
  FaShieldHalved,
} from "react-icons/fa6";
import { jwt } from "../../utils/jwt";
import { formatVND } from "../../utils/money";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const tabs = [
  { id: "orders", label: "Đơn hàng", icon: FaTicket },
  { id: "history", label: "Lịch sử", icon: FaClock },
  { id: "favorites", label: "Yêu thích", icon: FaHeart },
  { id: "profile", label: "Thông tin cá nhân", icon: FaUser },
  { id: "reviews", label: "Đánh giá", icon: FaStar },
];

const bookingStatusMap = {
  awaiting_payment: {
    label: "Chờ thanh toán",
    cls: "bg-yellow-100 text-yellow-700",
  },
  awaiting_confirm: { label: "Chờ xác nhận", cls: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Đã xác nhận", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Bị từ chối", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-600" },
  completed: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
};

const paymentStatusMap = {
  unpaid: { label: "Chưa thanh toán", cls: "text-yellow-600" },
  paid: { label: "Đã thanh toán", cls: "text-green-600" },
  failed: { label: "Thất bại", cls: "text-red-600" },
  refunded: { label: "Đã hoàn tiền", cls: "text-blue-600" },
};

const getOrderId = (order) => order?._id || order?.id || "";

const getOrderCode = (order) =>
  order?.orderCode ||
  `OD${String(order?._id || order?.id || "")
    .replace(/\D/g, "")
    .slice(-4)
    .padStart(4, "0")}`;

const getBillCode = (order) => {
  const billCode =
    order?.paymentInfo?.transactionNo ||
    order?.paymentInfo?.billCode ||
    order?.paymentInfo?.paymentCode ||
    order?.billCode ||
    order?.billNo ||
    order?.paymentNo;
  return billCode || "Chưa có";
};

const getServiceName = (order) =>
  order?.tourSnapshot?.name ||
  order?.serviceId?.serviceName ||
  order?.serviceId?.name ||
  "Chưa có tên tour";

const getDepartureDate = (order) =>
  order?.scheduleId?.departureDate ||
  order?.tourSnapshot?.departureDate ||
  null;

function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = jwt();
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [tab, setTab] = useState("orders");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [detailId, setDetailId] = useState("");
  const [reviewForm, setReviewForm] = useState({
    orderId: "",
    serviceId: "",
    serviceName: "",
    rating: 5,
    comment: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [payingOrderId, setPayingOrderId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fullNameRef = useRef(null);
  const phoneRef = useRef(null);

  if (!user || String(user.role).toLowerCase() !== "user") {
    return <Navigate to="/signin" replace />;
  }

  const accessToken = localStorage.getItem("accessToken");
  const currentUserId = String(
    user.userId || user.id || currentUser?._id || currentUser?.id || "",
  );
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const vnpayStatus = searchParams.get("vnpayStatus");
  const callbackOrderId = searchParams.get("orderId");
  const callbackOrderCode = searchParams.get("orderCode");
  const callbackUpdated = searchParams.get("updated");
  const displayOrderCode = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "OD0000";
    if (/^OD\d{4}$/i.test(raw)) return raw.toUpperCase();

    const digits = raw.replace(/\D/g, "").slice(-4).padStart(4, "0");
    return `OD${digits}`;
  };
  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;
  const profileInputClass = (field) =>
    `w-full rounded-xl border bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#f97316] ${
      profileErrors[field]
        ? "border-red-500 focus:border-red-500"
        : "border-slate-200"
    }`;
  const clearProfileError = (field) => {
    setProfileErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const validateProfileForm = () => {
    const nextErrors = {};
    const fullName = String(profile.fullName || "").trim();
    const phone = String(profile.phone || "").trim();

    if (!fullName) nextErrors.fullName = "Vui lòng nhập họ tên.";
    else if (fullName.length < 3 || fullName.length > 30) {
      nextErrors.fullName = "Họ tên phải từ 3 đến 30 ký tự.";
    } else if (!/^[\p{L}\s]+$/u.test(fullName)) {
      nextErrors.fullName = "Họ tên không được chứa số hoặc ký tự đặc biệt.";
    }
    if (!phone) nextErrors.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^0\d{9}$/.test(phone)) {
      nextErrors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    }

    setProfileErrors(nextErrors);

    if (nextErrors.fullName) fullNameRef.current?.focus();
    else if (nextErrors.phone) phoneRef.current?.focus();

    return Object.keys(nextErrors).length === 0;
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {};

      const [profileRes, ordersRes] = await Promise.all([
        axios.get("/api/users/profile", { headers }),
        axios.get("/api/orders/my-orders", { headers }),
      ]);

      const profileData = profileRes.data?.data || {};
      const ordersData = Array.isArray(ordersRes.data?.data)
        ? ordersRes.data.data
        : [];

      setProfile({
        fullName: profileData.fullName || currentUser?.fullName || "",
        email: profileData.email || currentUser?.email || "",
        phone: profileData.phone || currentUser?.phone || "",
      });
      setOrders(ordersData);
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError.message ||
          "Không thể tải dữ liệu dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setError("Bạn cần đăng nhập để xem dashboard.");
      setLoading(false);
      return;
    }

    fetchDashboard();
    fetchFavorites();
  }, [accessToken]);

  useEffect(() => {
    if (!vnpayStatus) return;

    if (vnpayStatus === "success") {
      const orderCode = callbackOrderCode || displayOrderCode(callbackOrderId);
      const message =
        callbackUpdated === "1"
          ? `Thanh toán VNPAY thành công. Đơn ${orderCode} đã được cập nhật.`
          : "Thanh toán VNPAY thành công. Đang tải lại dữ liệu đơn hàng.";
      setTab("orders");
      setNotice(message);
      toast.success(message);
      fetchDashboard();
    } else if (vnpayStatus === "failed") {
      const message =
        "Thanh toán VNPAY chưa thành công hoặc chữ ký xác thực không hợp lệ.";
      setNotice(message);
      toast.error(message);
    }

    const timer = window.setTimeout(() => {
      navigate("/user/dashboard", { replace: true });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [
    vnpayStatus,
    callbackOrderId,
    callbackOrderCode,
    callbackUpdated,
    navigate,
  ]);

  const activeOrders = orders.filter(
    (order) => !["completed", "cancelled", "rejected"].includes(order.status),
  );
  const historyOrders = orders.filter((order) =>
    ["completed", "cancelled", "rejected"].includes(order.status),
  );

  const serviceIds = useMemo(() => {
    const ids = new Set();
    orders.forEach((order) => {
      const serviceId =
        order?.serviceId?._id || order?.serviceId?.id || order?.serviceId || "";
      if (serviceId) ids.add(String(serviceId));
    });
    return Array.from(ids);
  }, [orders]);

  useEffect(() => {
    if (serviceIds.length === 0) {
      setReviews([]);
      return;
    }

    let cancelled = false;

    const fetchReviews = async () => {
      try {
        const results = await Promise.all(
          serviceIds.map((id) => axios.get(`/api/reviews/service/${id}`)),
        );

        if (cancelled) return;

        const allReviews = results.flatMap((res) =>
          Array.isArray(res.data?.data) ? res.data.data : [],
        );

        const myReviews = allReviews.filter((review) => {
          const reviewerId = review?.userId?._id || review?.userId || "";
          return String(reviewerId) === currentUserId;
        });

        setReviews(myReviews);
      } catch {
        if (!cancelled) setReviews([]);
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [serviceIds, currentUserId]);

  const updateProfile = async () => {
    if (!validateProfileForm()) return;

    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để cập nhật hồ sơ.");
      return;
    }

    const toastId = toast.loading("Đang cập nhật hồ sơ...");
    try {
      setSavingProfile(true);
      setNotice("");
      const res = await axios.put(
        "/api/users/profile",
        {
          fullName: String(profile.fullName || "").trim(),
          phone: String(profile.phone || "").trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const updated = res.data?.data || {};
      setProfile((prev) => ({
        ...prev,
        fullName: updated.fullName || prev.fullName,
        phone: updated.phone || prev.phone,
      }));
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          ...(currentUser || {}),
          ...updated,
        }),
      );
      setNotice("Cập nhật thông tin thành công!");
      toast.success("Cập nhật thông tin thành công!", { id: toastId });
    } catch (updateError) {
      const message = getErrorMessage(updateError, "Không thể cập nhật hồ sơ.");
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSavingProfile(false);
    }
  };

  const openReview = (order) => {
    setReviewForm({
      orderId: getOrderId(order),
      serviceId:
        order?.serviceId?._id || order?.serviceId?.id || order?.serviceId || "",
      serviceName: getServiceName(order),
      rating: 5,
      comment: "",
    });
    setShowReviewForm(true);
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) {
      const message = "Vui lòng nhập bình luận";
      setError(message);
      toast.error(message);
      return;
    }

    const toastId = toast.loading("Đang gửi đánh giá...");
    try {
      setSubmittingReview(true);
      setNotice("");
      await axios.post(
        "/api/reviews",
        {
          orderId: reviewForm.orderId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setNotice("Đánh giá thành công!");
      toast.success("Đánh giá thành công!", { id: toastId });
      setShowReviewForm(false);
      fetchDashboard();
    } catch (reviewError) {
      const message = getErrorMessage(reviewError, "Không thể gửi đánh giá.");
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSubmittingReview(false);
    }
  };

  const canCancel = (order) =>
    ["awaiting_payment", "awaiting_confirm", "confirmed"].includes(
      order?.status,
    );
  const canPay = (order) =>
    order?.paymentStatus === "unpaid" && order?.status !== "cancelled";
  const canReview = (order) =>
    order.status === "completed" &&
    !reviews.find(
      (review) => String(review.orderId) === String(getOrderId(order)),
    );

  const handleUserCancel = async (order) => {
    const orderId = getOrderId(order);
    const orderCode = displayOrderCode(orderId);

    if (!accessToken) {
      const message = "Bạn cần đăng nhập để hủy đơn.";
      setError(message);
      toast.error(message);
      return;
    }

    if (
      !["awaiting_payment", "awaiting_confirm", "confirmed"].includes(
        order.status,
      )
    ) {
      const message = "Đơn này hiện không thể hủy ở trạng thái hiện tại.";
      setError(message);
      toast.error(message);
      setNotice("");
      return;
    }

    const confirmed = window.confirm(
      `Ban chac chan muon huy don ${orderCode}?`,
    );
    if (!confirmed) return;

    const toastId = toast.loading(`Đang hủy đơn ${orderCode}...`);
    try {
      setCancellingOrderId(String(orderId));
      setError("");
      setNotice("");

      const res = await axios.patch(
        `/api/orders/cancel/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setDetailId((prev) => (prev === orderId ? "" : prev));
      const message = res.data?.message || `Đã hủy đơn ${orderCode} thành công.`;
      setNotice(message);
      toast.success(message, { id: toastId });
      await fetchDashboard();
    } catch (cancelError) {
      const message = getErrorMessage(
        cancelError,
        "Không thể hủy đơn này vào lúc này.",
      );
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setCancellingOrderId("");
    }
  };

  const fetchFavorites = async () => {
    try {
      const headers = accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {};

      const res = await axios.get("/api/users/favorites", { headers });
      setFavoriteServices(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      setFavoriteServices([]);
    }
  };

  const handleRemoveFavorite = async (serviceId) => {
    if (!serviceId || !accessToken) {
      toast.error("Bạn cần đăng nhập để cập nhật danh sách yêu thích.");
      return;
    }

    const toastId = toast.loading("Đang xóa khỏi danh sách đã lưu...");
    try {
      setError("");
      setNotice("");

      await axios.patch(
        `/api/users/favorites/${serviceId}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setFavoriteServices((prev) =>
        prev.filter(
          (item) => String(item?._id || item?.id) !== String(serviceId),
        ),
      );
      setNotice("Đã xóa khỏi danh sách đã lưu.");
      toast.success("Đã xóa khỏi danh sách đã lưu.", { id: toastId });
    } catch (removeError) {
      const message = getErrorMessage(
        removeError,
        "Không thể xóa khỏi danh sách đã lưu.",
      );
      setError(message);
      toast.error(message, { id: toastId });
    }
  };

  const handleCancel = (orderId) => {
    setNotice(
      `Đơn ${displayOrderCode(orderId)}: hiện backend chưa có endpoint hủy từ user.`,
    );
    console.log("cancel order", orderId);
  };

  const handleOrderPay = async (order) => {
    const orderId = getOrderId(order);
    const orderCode = getOrderCode(order);

    if (!accessToken) {
      const message = "Bạn cần đăng nhập để thanh toán.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!canPay(order)) {
      const message = "Đơn này không còn ở trạng thái có thể thanh toán.";
      setError(message);
      toast.error(message);
      setNotice("");
      return;
    }

    const toastId = toast.loading(`Đang tạo link thanh toán cho đơn ${orderCode}...`);
    try {
      setPayingOrderId(String(orderId));
      setError("");
      setNotice("");

      const departureDate = getDepartureDate(order);
      const orderInfo = [
        getServiceName(order),
        `${Number(order?.numPeople || 0)} nguoi`,
        departureDate
          ? `KH ${new Date(departureDate).toLocaleDateString("vi-VN")}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const res = await axios.post("/api/create-qr", {
        amount: String(order.totalPrice || 0),
        orderInfo,
        txnRef: String(orderId),
      });

      const paymentUrl = res.data?.vnpayRespone;
      if (!paymentUrl) {
        const message = "Không tạo được link thanh toán.";
        setError(message);
        toast.error(message, { id: toastId });
        return;
      }

      toast.success("Đã tạo link thanh toán. Đang chuyển sang VNPAY...", {
        id: toastId,
      });
      window.location.href = paymentUrl;
    } catch (payError) {
      const message = getErrorMessage(
        payError,
        "Không thể kết nối đến cổng thanh toán.",
      );
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setPayingOrderId("");
    }
  };

  const handlePay = (orderId) => {
    setNotice(
      `Đơn ${displayOrderCode(orderId)}: hiện dashboard chưa nối VNPAY.`,
    );
    console.log("pay order", orderId);
  };

  const BookingTable = ({
    list,
    allowActions = true,
    allowReviewAction = false,
  }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]" style={{ fontSize: 14 }}>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Mã đơn
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Dịch vụ
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Ngày KH
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Tổng tiền
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Thanh toán
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-medium text-slate-500">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((order) => {
            const orderId = getOrderId(order);
            const orderCode = getOrderCode(order);
            const bookingStatus =
              bookingStatusMap[order.status] ||
              bookingStatusMap.awaiting_confirm;
            const paymentStatus =
              paymentStatusMap[order.paymentStatus] || paymentStatusMap.unpaid;
            const departureDate = getDepartureDate(order);

            return (
              <tr
                key={orderId}
                className="border-b border-slate-100 hover:bg-[#f8fafc]"
              >
                <td className="px-4 py-4 align-top text-slate-700">
                  {orderCode}
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="max-w-[260px] truncate text-left font-medium text-slate-900">
                    {getServiceName(order)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.numPeople} người
                  </p>
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  {departureDate
                    ? new Date(departureDate).toLocaleDateString("vi-VN")
                    : "Chưa có"}
                </td>
                <td className="px-4 py-4 align-top font-semibold text-[#f97316]">
                  {formatVND(order.totalPrice)}
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${bookingStatus.cls}`}
                  >
                    {bookingStatus.label}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className={`text-xs font-medium ${paymentStatus.cls}`}>
                    {paymentStatus.label}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(orderId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#f97316] hover:text-[#f97316]"
                    >
                      <FaEye size={12} />
                      Chi tiết
                    </button>
                    {allowActions && canPay(order) ? (
                      <button
                        type="button"
                        onClick={() => handleOrderPay(order)}
                        disabled={payingOrderId === String(orderId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Thanh toán
                      </button>
                    ) : null}
                    {allowActions && canCancel(order) ? (
                      <button
                        type="button"
                        onClick={() => handleUserCancel(order)}
                        disabled={cancellingOrderId === String(orderId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaTrash size={12} />
                        Hủy
                      </button>
                    ) : null}
                    {(allowActions || allowReviewAction) && canReview(order) ? (
                      <button
                        type="button"
                        onClick={() => openReview(order)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#ea5f0c]"
                      >
                        <FaPenToSquare size={12} />
                        Đánh giá
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {list.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Không có đơn hàng nào
        </div>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-white p-8 text-slate-500 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          Đang tải dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6 text-left">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">Dashboard khách hàng</p>
          <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1
                className="text-3xl font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Xin chào{" "}
                <span className="text-[#f97316]">
                  {profile.fullName || currentUser?.fullName || "Khách hàng"}
                </span>
              </h1>
              {/* <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
                Đây là nơi bạn xem tổng quan tài khoản, các đơn đã đặt và thông
                tin cá nhân.
              </p> */}
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[#f0f4f8] p-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-[#f97316] shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          {tab === "history" ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Lịch sử đơn hàng
                  </h2>
                  <p className="text-sm text-slate-500">
                    Các đơn đã hoàn tất, đã hủy hoặc bị từ chối
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  {historyOrders.length} đơn
                </p>
              </div>

              {historyOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center text-slate-500">
                  Chưa có lịch sử đơn hàng
                </div>
              ) : (
                <BookingTable
                  list={historyOrders}
                  allowActions={false}
                  allowReviewAction
                />
              )}
            </div>
          ) : null}

          {tab === "orders" ? (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Đơn hàng đang xử lý
              </h2>
              <BookingTable list={activeOrders} allowActions />
            </div>
          ) : null}

          {tab === "profile" ? (
            <div className="space-y-4">
              <div className="space-y-4">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">
                  Thông tin cá nhân
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <RequiredLabel className="ml-1 text-sm text-slate-500">Họ tên</RequiredLabel>
                    <input
                      ref={fullNameRef}
                      value={profile.fullName}
                      onChange={(e) => {
                        setProfile((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }));
                        clearProfileError("fullName");
                      }}
                      className={profileInputClass("fullName")}
                    />
                    {profileErrors.fullName ? (
                      <p className="ml-1 text-sm text-red-500">
                        {profileErrors.fullName}
                      </p>
                    ) : null}
                  </label>

                  <label className="space-y-2">
                    <RequiredLabel className="ml-1 text-sm text-slate-500">Số điện thoại</RequiredLabel>
                    <input
                      ref={phoneRef}
                      value={profile.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setProfile((prev) => ({
                          ...prev,
                          phone: value,
                        }));
                        clearProfileError("phone");
                      }}
                      className={profileInputClass("phone")}
                    />
                    {profileErrors.phone ? (
                      <p className="ml-1 text-sm text-red-500">
                        {profileErrors.phone}
                      </p>
                    ) : null}
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm ml-1 pb-3 text-slate-500">Email</span>
                  <input
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                  />
                </label>

                <button
                  type="button"
                  onClick={updateProfile}
                  disabled={savingProfile}
                  className="mt-4 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingProfile ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </div>
          ) : null}

          {tab === "favorites" ? (
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Địa điểm / dịch vụ đã lưu
                </h2>
                <p className="text-sm text-slate-500">
                  {favoriteServices.length} mục
                </p>
              </div>

              {favoriteServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center text-slate-500">
                  Bạn chưa lưu địa điểm nào
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {favoriteServices.map((service) => {
                    const serviceId = service?._id || service?.id;
                    const serviceName = service?.serviceName || "Chưa có tên";
                    const serviceLocation =
                      service?.location || "Chưa có địa điểm";
                    const serviceImage =
                      service?.images?.[0] ||
                      service?.imageUrl ||
                      "/images/service-placeholder.svg";
                    const serviceRating = Number(service?.rating || 0);
                    const reviewCount = Number(service?.reviewCount || 0);

                    return (
                      <div
                        key={serviceId}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                      >
                        <img
                          src={serviceImage}
                          alt={serviceName}
                          className="h-44 w-full object-cover"
                        />
                        <div className="space-y-3 p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                              Đã lưu
                            </p>
                            <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-slate-900">
                              {serviceName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {serviceLocation}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {serviceRating.toFixed(1)} sao
                            </span>
                            <span className="text-slate-400">
                              {reviewCount} đánh giá
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  serviceId
                                    ? `/services/${serviceId}`
                                    : "/destination",
                                )
                              }
                              className="flex-1 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-200"
                            >
                              Xem chi tiết
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFavorite(serviceId)}
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition hover:bg-rose-50"
                              title="Xóa khỏi danh sách"
                              aria-label="Xóa khỏi danh sách"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Đánh giá của tôi
                </h2>
                <p className="text-sm text-slate-500">
                  {reviews.length} đánh giá
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center text-slate-500">
                  Bạn chưa có đánh giá nào
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id || review.id}
                      className="rounded-2xl bg-[#f8fafc] p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {review?.serviceId?.serviceName || "Dịch vụ"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {review?.userId?.fullName ||
                              currentUser?.fullName ||
                              "Khách hàng"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[#f59e0b]">
                          {Array.from({
                            length: Number(review.rating || 0),
                          }).map((_, index) => (
                            <FaStar
                              key={index}
                              size={14}
                              className="fill-current"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {review.comment || "Không có nội dung đánh giá."}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleString("vi-VN")
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {detailId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailId("")}
        >
          {(() => {
            const order = orders.find((item) => getOrderId(item) === detailId);
            if (!order) return null;
            const bookingStatus =
              bookingStatusMap[order.status] ||
              bookingStatusMap.awaiting_confirm;
            const paymentStatus =
              paymentStatusMap[order.paymentStatus] || paymentStatusMap.unpaid;

            return (
              <div
                className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Chi tiết đơn hàng
                </h3>

                <div className="space-y-3 text-sm text-slate-700">
                  {[
                    ["Dịch vụ", getServiceName(order)],
                    [
                      "Đối tác",
                      order?.provider_id?.fullName ||
                        order?.serviceId?.providerName ||
                        "Chưa có",
                    ],
                    [
                      "Ngày khởi hành",
                      getDepartureDate(order)
                        ? new Date(getDepartureDate(order)).toLocaleDateString(
                            "vi-VN",
                          )
                        : "Chưa có",
                    ],
                    ["Số người", `${order.numPeople || 0} người`],
                    ["Tổng tiền", formatVND(order.totalPrice)],
                    ["Trạng thái", bookingStatus.label],
                    ["Thanh toán", paymentStatus.label],
                    ["Mã đơn hàng", getOrderCode(order)],
                    [
                      "Mã bill",
                      getBillCode(order),
                    ],
                    [
                      "Phương thức thanh toán",
                      order?.paymentInfo?.paymentMethod ||
                        order?.paymentInfo?.method ||
                        "Chưa có",
                    ],
                    [
                      "Ngày đặt",
                      order.createdAt
                        ? new Date(order.createdAt).toLocaleString("vi-VN")
                        : "",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b border-slate-100 pb-2"
                    >
                      <span className="text-slate-500">{label}</span>
                      <span className="text-right font-medium text-slate-900">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setDetailId("")}
                  className="mt-6 w-full rounded-xl bg-[#f0f4f8] py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Đóng
                </button>
              </div>
            );
          })()}
        </div>
      ) : null}

      {showReviewForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowReviewForm(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              Đánh giá dịch vụ
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              {reviewForm.serviceName}
            </p>

            <div className="mb-5">
              <label className="mb-2 block text-sm text-slate-500">
                Số sao
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewForm((prev) => ({
                        ...prev,
                        rating: star,
                      }))
                    }
                  >
                    <FaStar
                      size={28}
                      className={
                        star <= reviewForm.rating
                          ? "text-[#f59e0b] fill-[#f59e0b]"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm text-slate-500">
                <RequiredLabel>Bình luận</RequiredLabel>
              </span>
              <textarea
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="flex-1 rounded-xl bg-[#f0f4f8] py-2.5 text-sm font-medium text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={submittingReview}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UserDashboard;
