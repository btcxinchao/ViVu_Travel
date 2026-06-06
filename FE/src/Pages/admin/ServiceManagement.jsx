import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoSearch, IoTrashOutline } from "react-icons/io5";
import { FaEye } from "react-icons/fa6";
import { TiTickOutline } from "react-icons/ti";
import { AiOutlineCloseCircle } from "react-icons/ai";

const getServiceRating = (item) => {
  const ratingValue = Number(
    item?.rating ?? item?.avgRating ?? item?.averageRating ?? item?.score ?? 0,
  );
  return Number.isFinite(ratingValue) ? ratingValue : 0;
};

const getServiceReviewCount = (item) => {
  const reviewCountValue = Number(
    item?.reviewCount ??
      item?.totalReviews ??
      item?.reviewsCount ??
      item?.reviewTotal ??
      0,
  );
  return Number.isFinite(reviewCountValue) ? reviewCountValue : 0;
};

const getServiceImages = (service) => {
  if (Array.isArray(service?.images) && service.images.length > 0) return service.images;
  if (service?.imageUrl) return [service.imageUrl];
  if (service?.imageFile) return [`/uploads/${service.imageFile}`];
  return [];
};

const getCategoryLabel = (service) => {
  const category = service?.category;
  if (Array.isArray(category)) {
    return category[0]?.categoryName || category[0] || "Chưa có";
  }
  if (typeof category === "object" && category) {
    return category.categoryName || "Chưa có";
  }
  return category || "Chưa có";
};

const formatListText = (value) => {
  if (!Array.isArray(value) || value.length === 0) return "Chưa có";
  return value.filter(Boolean).join(", ");
};

const formatMonthsText = (value) => {
  if (!Array.isArray(value) || value.length === 0) return "Chưa có";
  return value.filter(Number.isFinite).join(", ");
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
};

const formatCancellationPolicy = (policy) => {
  if (!policy || typeof policy !== "object") return "Chưa có";
  const fullRefundDays = policy.fullRefundDays ?? "--";
  const partialRefundDays = policy.partialRefundDays ?? "--";
  const partialRefundRate =
    typeof policy.partialRefundRate === "number"
      ? `${Math.round(policy.partialRefundRate * 100)}%`
      : "--";
  const lowRefundRate =
    typeof policy.lowRefundRate === "number"
      ? `${Math.round(policy.lowRefundRate * 100)}%`
      : "--";

  return `${fullRefundDays} ngày hoàn 100% | ${partialRefundDays} ngày hoàn ${partialRefundRate} | Mức thấp ${lowRefundRate}`;
};

const ServiceManagement = () => {
  const [serviceSearch, setServiceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [detailLoadingId, setDetailLoadingId] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setError("");
        const accessToken = localStorage.getItem("accessToken");
        const result = await axios.get("/api/admin/getAllService?limit=1000", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setServices(result.data.data || []);
      } catch (err) {
        console.log(err);
        setError(err?.response?.data?.message || "Không thể tải dịch vụ");
      }
    };

    fetchServices();
  }, []);

  const statusLabel = (rawStatus) => {
    const status = String(rawStatus || "").toLowerCase();
    if (status === "active") return { text: "Đang hiển thị", cls: "bg-emerald-50 text-emerald-600" };
    if (status === "pending") return { text: "Chờ duyệt", cls: "bg-orange-50 text-[#f97316]" };
    if (status === "rejected") return { text: "Bị từ chối", cls: "bg-red-50 text-red-600" };
    return { text: rawStatus || "--", cls: "bg-slate-100 text-slate-600" };
  };

  const filtered = services
    .filter((item) => {
      const keyword = serviceSearch.trim().toLowerCase();
      if (!keyword) return true;

      const name = String(item.serviceName || "").toLowerCase();
      const provider = String(item.providerName || item.nameProvider || "").toLowerCase();
      return name.includes(keyword) || provider.includes(keyword);
    })
    .filter((item) => {
      if (statusFilter === "all") return true;
      return String(item.status || "").toLowerCase() === statusFilter;
    });

  const callAction = async (id, action) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    try {
      setActionLoadingId(id);
      setError("");

      if (action === "approve") {
        const result = await axios.patch(
          `/api/admin/changeServiceStatus/${id}`,
          { status: "active" },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const nextStatus = result.data?.data?.status || "active";
        setServices((prev) => prev.map((s) => (s._id === id ? { ...s, status: nextStatus } : s)));
        return;
      }

      if (action === "reject") {
        const serviceName = services.find((s) => s._id === id)?.serviceName || "";
        const confirmed = window.confirm(`Bạn có chắc muốn từ chối dịch vụ "${serviceName}" không?`);
        if (!confirmed) return;

        const result = await axios.patch(
          `/api/admin/changeServiceStatus/${id}`,
          { status: "rejected" },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const nextStatus = result.data?.data?.status || "rejected";

        if (nextStatus === "rejected") {
          setServices((prev) => prev.filter((s) => s._id !== id));
        } else {
          setServices((prev) => prev.map((s) => (s._id === id ? { ...s, status: nextStatus } : s)));
        }
        return;
      }

      if (action === "delete") {
        const serviceName = services.find((s) => s._id === id)?.serviceName || "";
        const confirmed = window.confirm(`Bạn có chắc muốn xóa dịch vụ "${serviceName}" không?`);
        if (!confirmed) return;

        await axios.delete(`/api/admin/deleteService/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setServices((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Xử lý thất bại");
    } finally {
      setActionLoadingId("");
    }
  };

  const openServiceDetail = async (id) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    try {
      setDetailLoadingId(id);
      setError("");
      const result = await axios.get(`/api/services/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSelectedService(result.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải chi tiết dịch vụ");
    } finally {
      setDetailLoadingId("");
    }
  };

  const closeDetail = () => setSelectedService(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-left text-xl font-semibold text-slate-900">Quản lí dịch vụ</h2>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Tìm theo tên, nhà cung cấp..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hiển thị</option>
          <option value="rejected">Bị từ chối</option>
        </select>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {actionLoadingId && <p className="text-sm text-slate-400">Đang xử lý...</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">STT</th>
              <th className="px-4 py-3 text-left font-medium">Tên dịch vụ</th>
              <th className="px-4 py-3 text-left font-medium">Tên nhà cung cấp</th>
              <th className="px-4 py-3 text-left font-medium">Giá</th>
              <th className="px-4 py-3 text-left font-medium">Đánh giá</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item, index) => {
                const st = statusLabel(item.status);
                const rating = getServiceRating(item);
                const reviewCount = getServiceReviewCount(item);
                const hasReviewInfo = rating > 0 || reviewCount > 0;
                const reviewLabel =
                  rating > 0 && reviewCount > 0
                    ? `${rating.toFixed(1)} (${reviewCount})`
                    : rating > 0
                      ? `${rating.toFixed(1)}`
                      : "--";

                return (
                  <tr key={item._id}>
                    <td className="px-4 py-3 text-left">{index + 1}</td>
                    <td className="px-4 py-3 text-left">{item.serviceName}</td>
                    <td className="px-4 py-3 text-left">{item.providerName || item.nameProvider}</td>
                    <td className="px-4 py-3 text-left">
                      {Number(item.price ?? item.prices ?? 0).toLocaleString("vi-VN")} VNĐ
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className="text-slate-500">{hasReviewInfo ? reviewLabel : "--"}</span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                        {st.text}
                      </span>
                    </td>
                    <td className="flex gap-2 px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => openServiceDetail(item._id)}
                        disabled={detailLoadingId === item._id}
                        className="text-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Xem chi tiết"
                      >
                        <FaEye className="text-lg" />
                      </button>

                      {item.status !== "active" && (
                        <button
                          type="button"
                          onClick={() => callAction(item._id, "approve")}
                          className="text-green-600 hover:text-green-700"
                          title="Duyệt"
                        >
                          <TiTickOutline className="text-xl" />
                        </button>
                      )}

                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => callAction(item._id, "reject")}
                          className="text-red-600 hover:text-red-700"
                          title="Từ chối"
                        >
                          <AiOutlineCloseCircle className="text-xl" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => callAction(item._id, "delete")}
                        className="text-slate-500 hover:text-red-600"
                        title="Xóa"
                      >
                        <IoTrashOutline className="text-xl" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-16 text-center text-slate-400">
                  Chưa có dữ liệu dịch vụ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={closeDetail}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Chi tiết dịch vụ</h3>
                <p className="text-sm text-slate-500">Xem đầy đủ thông tin trước khi duyệt</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCard label="Tên dịch vụ" value={selectedService.serviceName || "--"} />
                    <InfoCard
                      label="Nhà cung cấp"
                      value={selectedService.provider_id?.fullName || selectedService.providerName || "--"}
                    />
                    <InfoCard
                      label="Email"
                      value={selectedService.provider_id?.email || selectedService.email || "--"}
                    />
                    <InfoCard
                      label="SĐT"
                      value={selectedService.provider_id?.phone || selectedService.phone || "--"}
                    />
                    <InfoCard
                      label="Địa điểm"
                      value={selectedService.location || selectedService.destination || selectedService.region || "--"}
                    />
                    <InfoCard label="Danh mục" value={getCategoryLabel(selectedService)} />
                    <InfoCard
                      label="Giá"
                      value={`${Number(selectedService.prices ?? selectedService.price ?? 0).toLocaleString("vi-VN")} VNĐ`}
                    />
                    <InfoCard label="Trạng thái" value={selectedService.status || "--"} />
                    <InfoCard label="Thời lượng" value={selectedService.duration || "--"} />
                    <InfoCard
                      label="Nổi bật"
                      value={selectedService.featured ? "Có" : "Không"}
                    />
                    <InfoCard
                      label="Lượt xem"
                      value={String(Number(selectedService.viewCount || 0))}
                    />
                    <InfoCard
                      label="Đánh giá"
                      value={`${Number(selectedService.rating || 0).toFixed(1)} sao`}
                    />
                    <InfoCard
                      label="Lượt đánh giá"
                      value={String(Number(selectedService.reviewCount || 0))}
                    />
                    <InfoCard label="Mùa phù hợp" value={formatListText(selectedService.seasonTags)} />
                    <InfoCard label="Thời tiết" value={formatListText(selectedService.weatherTags)} />
                    <InfoCard label="Tháng đẹp" value={formatMonthsText(selectedService.bestMonths)} />
                    <InfoCard label="Ngày tạo" value={formatDateTime(selectedService.createdAt)} />
                    <InfoCard label="Cập nhật" value={formatDateTime(selectedService.updatedAt)} />
                  </div>

                  <SectionBlock title="Mô tả" value={selectedService.description || "Chưa có mô tả"} />
                  <SectionBlock
                    title="Điểm nổi bật"
                    value={formatListText(selectedService.highlight)}
                  />
                  <SectionBlock title="Bao gồm" value={formatListText(selectedService.includes)} />
                  <SectionBlock
                    title="Chính sách hủy"
                    value={formatCancellationPolicy(selectedService.cancellationPolicy)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ảnh dịch vụ</p>
                    {getServiceImages(selectedService).length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {getServiceImages(selectedService)
                          .slice(0, 4)
                          .map((img, index) => (
                            <img
                              key={`${img}-${index}`}
                              src={img}
                              alt={selectedService.serviceName || "service"}
                              className="h-36 w-full rounded-2xl object-cover"
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Lịch trình</p>
                    {Array.isArray(selectedService.itinerary) && selectedService.itinerary.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {selectedService.itinerary.map((dayItem, index) => (
                          <div key={`${dayItem.day || index}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">
                                Ngày {dayItem.day || index + 1}: {dayItem.title || "Chưa có tiêu đề"}
                              </p>
                              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                                {Array.isArray(dayItem.activities) ? dayItem.activities.length : 0} hoạt động
                              </span>
                            </div>
                            {dayItem.accommodation ? (
                              <p className="mt-2 text-sm text-slate-600">
                                Lưu trú: {dayItem.accommodation}
                              </p>
                            ) : null}
                            {Array.isArray(dayItem.meals) && dayItem.meals.length > 0 ? (
                              <p className="mt-2 text-sm text-slate-600">
                                Bữa ăn: {dayItem.meals.join(", ")}
                              </p>
                            ) : null}
                            {Array.isArray(dayItem.activities) && dayItem.activities.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {dayItem.activities.map((activity, actIndex) => (
                                  <div key={`${activity.title || actIndex}-${actIndex}`} className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-sm font-medium text-slate-800">
                                      {activity.time ? `${activity.time} - ` : ""}
                                      {activity.title || "Hoạt động"}
                                    </p>
                                    {activity.description ? (
                                      <p className="mt-1 text-sm text-slate-600">
                                        {activity.description}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-400">Chưa có hoạt động</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                        Chưa có lịch trình
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const SectionBlock = ({ title, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{value}</p>
  </div>
);

export default ServiceManagement;
