import { IoLocationOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { FaHeart, FaChevronRight, FaStar } from "react-icons/fa6";
import { RiCalendarScheduleLine } from "react-icons/ri";

import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/images/service-placeholder.svg";

const getName = (service) =>
  service.uiName ||
  service.serviceName ||
  service.servicesName ||
  service.ServiceName ||
  "Chờ cập nhật";

const getLocation = (service) =>
  service.uiLocation ||
  service.destination ||
  service.location ||
  service.region ||
  "Chờ cập nhật";

const getPrice = (service) =>
  Number(service.uiPrice ?? service.prices ?? service.price ?? 0);

const getStatus = (service) => service.uiStatus || service.status || "pending";

const getDuration = (service) => {
  const value = service.duration || service.tourDuration || "";
  const normalized = String(value).trim();

  return !normalized || normalized.toLowerCase() === "nan"
    ? "Chờ cập nhật"
    : normalized;
};

const getDescription = (service) =>
  service.description || service.descriptionDetail || "Chưa có mô tả";

const getCategory = (service) =>
  Array.isArray(service.category)
    ? service.category[0]?.categoryName || service.category[0] || "Du lịch"
    : typeof service.category === "object" && service.category
      ? service.category.categoryName || "Du lịch"
      : service.category || "Du lịch";

const getCategoryColor = (service) =>
  Array.isArray(service.category)
    ? service.category[0]?.color || "#f97316"
    : typeof service.category === "object" && service.category
      ? service.category.color || "#f97316"
      : "#f97316";

const getRating = (service) => {
  const value = Number(service.rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const getReviewCount = (service) => {
  const value = Number(service.reviewCount ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " VNĐ";

const getImage = (service) =>
  service.images?.[0] ||
  service.imageUrl ||
  (service.imageFile ? `/uploads/${service.imageFile}` : "") ||
  FALLBACK_IMAGE;

const statusClass = {
  approval: "bg-green-100 text-green-600",
  pending: "bg-yellow-100 text-amber-600",
  reject: "bg-red-100 text-red-500",
};

const statusLabel = {
  approval: "Hoạt động",
  pending: "Chờ duyệt",
  reject: "Từ chối",
};

const ServicesCard = ({
  service,
  viewMode = "grid",
  variant = "provider",
  onEdit,
  onDelete,
  showFavorite = false,
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite,
  onView,
}) => {
  const serviceName = getName(service);
  const destination = getLocation(service);
  const price = getPrice(service);
  const status = getStatus(service);
  const duration = getDuration(service);
  const description = getDescription(service);
  const category = getCategory(service);
  const categoryColor = getCategoryColor(service);
  const rating = getRating(service);
  const reviewCount = getReviewCount(service);
  const image = getImage(service);
  const [favoriteToast, setFavoriteToast] = useState("");
  const hasRating = reviewCount > 0 && rating > 0;

  const handleView = () => {
    onView?.(service);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(service);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(service);
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await onToggleFavorite?.(service);
    const nextFavorite =
      typeof result === "boolean" ? result : Boolean(result?.isFavorited);

    if (nextFavorite) {
      setFavoriteToast("Đã lưu vào yêu thích");
    }
  };

  useEffect(() => {
    if (!favoriteToast) return undefined;

    const timer = window.setTimeout(() => {
      setFavoriteToast("");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [favoriteToast]);

  const actionButtons = (
    <div className="flex gap-3 text-gray-600">
      <button type="button" onClick={handleEdit}>
        <FaEdit className="cursor-pointer text-lg hover:text-blue-500" />
      </button>
      <button type="button" onClick={handleDelete}>
        <MdDelete className="cursor-pointer text-lg hover:text-red-500" />
      </button>
    </div>
  );

  if (variant === "destination") {
    return (
      <div className="group w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-52 overflow-hidden">
          <img
            src={image}
            alt={serviceName}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {favoriteToast ? (
            <div className="absolute right-3 top-12 z-20 rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm">
              {favoriteToast}
            </div>
          ) : null}

          {showFavorite ? (
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"
              }
              className={`absolute right-3 top-3 z-10 flex h-[25px] w-[25px] items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
                isFavorite
                  ? "text-rose-500 hover:bg-white"
                  : "text-gray-500 hover:bg-white hover:text-rose-500"
              }`}
            >
              <FaHeart
                className={`text-[15px] transition ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
            </button>
          ) : null}

          <span
            className="absolute left-3 top-3 px-2.5 py--3 rounded-full text-[11px] font-semibold text-white w-fit"
            style={{ background: categoryColor }}
          >
            {category}
          </span>

          <span className="absolute bottom-3 left-3 inline-flex w-fit max-w-max items-center gap-1 rounded-full bg-black/50 px-2.5 py--3 text-[11px] text-white backdrop-blur-sm">
            <RiCalendarScheduleLine className="text-[10px]" />
            {duration}
          </span>
        </div>

        <div className="p-4">
          <h2 className="mb-1 line-clamp-1 text-left text-[15px] font-semibold text-gray-900 transition group-hover:text-[#f97316]">
            {serviceName}
          </h2>

          <div className="mb-2 flex items-center gap-1 text-[12px] text-gray-400">
            <IoLocationOutline className="text-[11px]" />
            <p className="line-clamp-1 text-left text-[12px] text-gray-500">
              {destination}
            </p>
          </div>

          <div className="mb-3 flex items-center gap-1.5">
            {reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FaStar
                      key={index}
                      size={13}
                      className="text-[#f59e0b] fill-[#f59e0b]"
                    />
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-gray-700">
                  {rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({reviewCount} đánh giá)
                </span>
              </>
            ) : (
              <span className="text-[12px] text-gray-400">
                Chưa có đánh giá
              </span>
            )}
          </div>

          <div className="my-3 border-t border-gray-50" />

          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="mb-0.5 text-[10px] text-gray-400">Từ</p>
              <p className="text-[18px] font-bold text-[#f97316]">
                {price > 0 ? formatPrice(price) : "Liên hệ"}
              </p>
              <p className="text-[10px] text-gray-400">/ người</p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-4 py-2 text-[12px] font-semibold text-white transition-all group-hover:shadow-lg group-hover:shadow-orange-200"
            >
              Đặt ngay
              <FaChevronRight className="text-[13px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "customer") {
    return (
      <div className="overflow-hidden rounded-[30px] bg-white shadow transition hover:-translate-y-1 hover:shadow-lg">
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={serviceName}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="h-60 w-full object-cover transition duration-300 hover:scale-105"
          />
        </div>

        <div className="space-y-2 p-4">
          <h2 className="line-clamp-1 text-left text-[16px] font-semibold text-gray-800">
            {serviceName}
          </h2>

          <div className="flex items-center gap-1 text-[13px] text-gray-400">
            <IoLocationOutline />
            <p className="line-clamp-1 text-left text-sm text-gray-500">
              {destination}
            </p>
          </div>

          <p className="line-clamp-2 text-left text-sm leading-6 text-slate-500">
            {description}
          </p>

          <div className="pt-1">
            <span className="text-[16px] font-bold text-[#f97316]">
              {price > 0 ? `${formatPrice(price)} / người` : "Liên hệ"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div
        role={onView ? "button" : undefined}
        tabIndex={onView ? 0 : undefined}
        onClick={handleView}
        onKeyDown={(event) => {
          if (!onView) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleView();
          }
        }}
        className={`flex overflow-hidden rounded-[28px] bg-white shadow transition hover:shadow-lg ${onView ? "cursor-pointer" : ""}`}
      >
        <img
          src={image}
          alt={serviceName}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-44 w-52 object-cover"
        />

        <div className="flex flex-1 items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass[status] || statusClass.pending}`}
            >
              {statusLabel[status] || status}
            </span>
            <h3 className="mt-3 line-clamp-1 text-lg font-semibold text-slate-800">
              {serviceName}
            </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <IoLocationOutline />
              {destination}
            </span>
            <span>{getCategory(service) || "Khac"}</span>
            <span>{duration}</span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            {hasRating ? (
              <>
                <div className="flex items-center gap-0.5 text-[#f59e0b]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FaStar
                      key={index}
                      size={12}
                      className={index < Math.round(rating) ? "fill-current" : "text-slate-200"}
                    />
                  ))}
                </div>
                <span className="font-medium text-slate-700">
                  {rating.toFixed(1)}
                </span>
                <span className="text-slate-400">
                  ({reviewCount} đánh giá)
                </span>
              </>
            ) : (
              <span className="text-slate-400">Chưa có đánh giá</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-orange-500">
              {price > 0 ? formatPrice(price) : "Liên hệ"}
            </p>
            <div className="mt-3 flex justify-end gap-2 text-gray-500">
              {actionButtons}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={handleView}
      onKeyDown={(event) => {
        if (!onView) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleView();
        }
      }}
      className={`overflow-hidden rounded-[30px] bg-white shadow transition hover:-translate-y-1 hover:shadow-lg ${onView ? "cursor-pointer" : ""}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={serviceName}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-60 w-full object-cover transition duration-300 hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[13px] font-medium ${statusClass[status] || statusClass.pending}`}
        >
          {statusLabel[status] || status}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h2 className="line-clamp-1 text-left text-[15px] font-semibold text-gray-800">
          {serviceName}
        </h2>
        <div className="flex items-center gap-1 text-[13px] text-gray-400">
          <IoLocationOutline />
          <p className="line-clamp-1 text-left text-sm text-gray-500">
            {destination}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {hasRating ? (
            <>
              <div className="flex items-center gap-0.5 text-[#f59e0b]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <FaStar
                    key={index}
                    size={12}
                    className={index < Math.round(rating) ? "fill-current" : "text-slate-200"}
                  />
                ))}
              </div>
              <span className="font-medium text-slate-700">
                {rating.toFixed(1)}
              </span>
              <span className="text-slate-400">
                ({reviewCount} đánh giá)
              </span>
            </>
          ) : (
            <span className="text-slate-400">Chưa có đánh giá</span>
          )}
        </div>
        <p className="line-clamp-1 text-left text-[13px] text-slate-400">
          {duration}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[16px] font-bold text-[#f97316]">
            {price > 0 ? formatPrice(price) : "Liên hệ"}
          </span>
          {actionButtons}
        </div>
      </div>
    </div>
  );
};

export default ServicesCard;
