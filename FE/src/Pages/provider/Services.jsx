import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoSearch } from "react-icons/io5";
import toast from "react-hot-toast";
import ServicesCard from "../../Components/services/ServicesCard";
import AddServices from "./AddServices.jsx";
import EditServices from "./EditServices.jsx";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";

const STATUS_META = {
  all: "Tất cả",
  approval: "Hoạt động",
  pending: "Chờ duyệt",
  reject: "Không hoạt động",
};

const FALLBACK_IMAGE = "/images/service-placeholder.svg";

const isObjectIdLike = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const getServiceImages = (service) => {
  if (Array.isArray(service?.images) && service.images.length > 0) return service.images;
  if (service?.imageUrl) return [service.imageUrl];
  if (service?.imageFile) return [`/uploads/${service.imageFile}`];
  return [];
};

const getCategoryLabel = (service) => {
  const category = service?.category;
  if (Array.isArray(category)) {
    const names = category
      .map((item) =>
        typeof item === "object" && item ? item.categoryName || item.name : item,
      )
      .filter((item) => !isObjectIdLike(item))
      .filter(Boolean)
      .join(", ");

    return names || "Du lịch";
  }

  if (typeof category === "object" && category) {
    return category.categoryName || category.name || "Du lịch";
  }

  return category && !isObjectIdLike(category) ? category : "Du lịch";
};

const formatListText = (value) => {
  if (!Array.isArray(value) || value.length === 0) return "Chưa có";
  return value.filter(Boolean).join(", ");
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
};

function ServiceDetailModal({ service, onClose }) {
  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onClick={onClose}
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
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Tên dịch vụ" value={service.serviceName || "--"} />
                <InfoCard
                  label="Nhà cung cấp"
                  value={service.provider_id?.fullName || service.providerName || "--"}
                />
                <InfoCard
                  label="Địa điểm"
                  value={service.location || service.destination || service.region || "--"}
                />
                <InfoCard label="Danh mục" value={getCategoryLabel(service)} />
                <InfoCard
                  label="Giá"
                  value={`${Number(service.prices ?? service.price ?? 0).toLocaleString("vi-VN")} VNĐ`}
                />
                <InfoCard label="Trạng thái" value={service.status || "--"} />
                <InfoCard label="Thời lượng" value={service.duration || "--"} />
                <InfoCard
                  label="Đánh giá"
                  value={`${Number(service.rating || 0).toFixed(1)} sao`}
                />
                <InfoCard
                  label="Lượt đánh giá"
                  value={String(Number(service.reviewCount || 0))}
                />
                <InfoCard label="Mùa phù hợp" value={formatListText(service.seasonTags)} />
                <InfoCard label="Ngày tạo" value={formatDateTime(service.createdAt)} />
                <InfoCard label="Cập nhật" value={formatDateTime(service.updatedAt)} />
              </div>

              <SectionBlock title="Mô tả" value={service.description || "Chưa có mô tả"} />
              <SectionBlock
                title="Điểm nổi bật"
                value={formatListText(service.highlight)}
              />
              <SectionBlock title="Bao gồm" value={formatListText(service.includes)} />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ảnh dịch vụ</p>
                {getServiceImages(service).length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {getServiceImages(service)
                      .slice(0, 4)
                      .map((img, index) => (
                        <img
                          key={`${img}-${index}`}
                          src={img}
                          alt={service.serviceName || "service"}
                          className="h-36 w-full rounded-2xl object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
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
                {Array.isArray(service.itinerary) && service.itinerary.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {service.itinerary.map((dayItem, index) => (
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
  );
}

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

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [status, setStatus] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Bạn chưa đăng nhập hoặc token đã hết hạn");
        return;
      }

      const res = await fetch("/api/services/my-services", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await res.json();

      if (res.ok) {
        setServices(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || "Không thể tải dịch vụ");
      }
    } catch (err) {
      setError("Lỗi kết nối tới server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const normalizedServices = useMemo(() => {
    return services.map((service) => {
      const rawStatus = String(service.status || "pending").toLowerCase();

      return {
        ...service,
        uiName:
          service.serviceName ||
          service.servicesName ||
          service.ServiceName ||
          "",
        uiLocation:
          service.location || service.destination || service.region || "",
        uiCategory: Array.isArray(service.category)
          ? service.category[0] || "Khác"
          : service.category || "Khác",
        uiStatus:
          rawStatus === "active"
            ? "approval"
            : rawStatus === "rejected"
              ? "reject"
              : ["approval", "pending", "reject"].includes(rawStatus)
                ? rawStatus
                : "pending",
      };
    });
  }, [services]);

  const counts = useMemo(
    () =>
      normalizedServices.reduce(
        (acc, item) => {
          acc.all += 1;
          if (acc[item.uiStatus] !== undefined) acc[item.uiStatus] += 1;
          return acc;
        },
        {
          all: 0,
          approval: 0,
          pending: 0,
          reject: 0,
        },
      ),
    [normalizedServices],
  );

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedServices.filter((item) => {
      const matchSearch =
        !keyword ||
        item.uiName.toLowerCase().includes(keyword) ||
        item.uiLocation.toLowerCase().includes(keyword);

      return (
        matchSearch &&
        (category === "Tất cả" || item.uiCategory === category) &&
        (status === "all" || item.uiStatus === status)
      );
    });
  }, [normalizedServices, search, category, status]);

  const handleEdit = (service) => {
    setEditingService(service);
  };

  const handleView = async (service) => {
    const id = service?._id || service?.id;
    if (!id) {
      setSelectedService(service);
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    try {
      setDetailLoadingId(id);
      setError("");

      const res = await fetch(`/api/services/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Không thể tải chi tiết dịch vụ");
        return;
      }

      setSelectedService(result?.data || service);
    } catch {
      toast.error("Không thể tải chi tiết dịch vụ");
    } finally {
      setDetailLoadingId("");
    }
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa dịch vụ "${service.uiName || service.serviceName || ""}" không?`,
    );
    if (!confirmed) {
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    try {
      setActionLoadingId(service._id);
      setError("");

      const res = await fetch(`/api/services/${service._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Không thể xóa dịch vụ");
        return;
      }

      setServices((prev) => prev.filter((item) => item._id !== service._id));
      toast.success("Xóa dịch vụ thành công");
    } catch (deleteError) {
      toast.error(`Lỗi xóa dịch vụ: ${deleteError.message}`);
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) return <p className="p-6">Đang tải dịch vụ ...</p>;
  if (error && services.length === 0)
    return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div>
            <Breadcrumb />

            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "20px",
                fontWeight: "700",
                color: "rgb(26, 26, 46)",
              }}
            >
              Quản lý dịch vụ
            </h1>
          </div>
        </div>

      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, địa điểm"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {actionLoadingId && (
          <p className="text-sm text-slate-500">Đang xử lý dịch vụ ...</p>
        )}
        {detailLoadingId && (
          <p className="text-sm text-slate-500">Đang tải chi tiết dịch vụ ...</p>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_META).map(([key, label]) => {
              const count = counts[key] ?? counts.all;
              const active = status === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-500"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-200"
          >
            + Thêm dịch vụ
          </button>
        </div>

        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((service) => (
              <ServicesCard
                key={service._id}
                service={service}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
            Không có dịch vụ phù hợp.
          </div>
        )}

      </div>

      {showAddModal ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-6"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AddServices
              isModal
              onClose={() => setShowAddModal(false)}
              onCreated={fetchServices}
            />
          </div>
        </div>
      ) : null}

      {editingService ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-6"
          onClick={() => setEditingService(null)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <EditServices
              isModal
              serviceId={editingService._id}
              onClose={() => setEditingService(null)}
              onUpdated={fetchServices}
            />
          </div>
        </div>
      ) : null}

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
};

export default Services;
