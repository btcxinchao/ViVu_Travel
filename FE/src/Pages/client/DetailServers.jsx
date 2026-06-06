import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import BookingBox from "../../Components/services/BookingBox";
import DetailContentServices from "../../Components/services/DetailContentServices";
import {
  FaArrowRight,
  FaArrowLeftLong,
  FaLocationDot,
  FaStar,
} from "react-icons/fa6";
import {
  FaRegCompass,
  FaClock,
  FaRegEye,
  MdFoodBank,
  MdOutlineDateRange,
} from "../../assets/Icons/Icons";
import { buildTrackingHeaders, getGuestId } from "../../utils/guest.js";

const normalizeHighlights = (raw) => {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 1 && typeof raw[0] === "string" && raw[0].includes("1.")) {
    return raw[0]
      .split(/\d+\./)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return raw.map((item) => String(item || "").trim()).filter(Boolean);
};

const getCategoryLabel = (service) => {
  const raw = service?.category;
  if (Array.isArray(raw)) return raw[0]?.categoryName || raw[0] || "Du lịch";
  if (raw && typeof raw === "object") return raw.categoryName || "Du lịch";
  return raw || "Du lịch";
};

const countItineraryStats = (itinerary) => {
  const days = Array.isArray(itinerary) ? itinerary.length : 0;
  const allActivities = Array.isArray(itinerary)
    ? itinerary.flatMap((day) => day?.activities || [])
    : [];

  const sightseeingCount = allActivities.filter((act) =>
    ["sightseeing", "photo"].includes(
      String(act?.icon || act?.type || "").toLowerCase(),
    ),
  ).length;

  const mealCount = Array.isArray(itinerary)
    ? itinerary.reduce((sum, day) => sum + (day?.meals?.length || 0), 0)
    : 0;

  const activityCount = allActivities.filter((act) =>
    ["activity", "transport", "hotel", "food"].includes(
      String(act?.icon || act?.type || "").toLowerCase(),
    ),
  ).length;

  return { days, sightseeingCount, mealCount, activityCount };
};

const parseImageList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      // Fallback sang tách theo dấu phẩy nếu backend lưu chuỗi thường.
    }

    return text
      .split(/[,;\n]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getServiceImages = (service) => {
  const images = parseImageList(service?.images);

  if (images.length > 0) return images;
  if (service?.imageUrl) return [service.imageUrl];
  if (service?.imageFile) {
    return [`/uploads/${service.imageFile}`];
  }
  return ["/images/service-placeholder.svg"];
};

function DetailServices() {
  const tabs = useMemo(
    () => [
      { id: "overview", label: "Tổng quan" },
      { id: "itinerary", label: "Lịch trình" },
      { id: "schedules", label: "Lịch khởi hành" },
      { id: "reviews", label: "Đánh giá" },
    ],
    [],
  );

  const [view, setView] = useState("overview");
  const [viewPage, setViewPage] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImg, setGalleryImg] = useState(0);
  const navigate = useNavigate();
  const countedViewServiceId = useRef("");
  const accessToken = localStorage.getItem("accessToken");
  const guestId = useMemo(() => getGuestId(), []);

  const { id } = useParams();
  const location = useLocation();
  const { props } = location.state || {};
  const [service, setService] = useState(props || null);

  const highlight = normalizeHighlights(
    service?.highlight || service?.highlights,
  );
  const includes = Array.isArray(service?.includes)
    ? service.includes.map((item) => String(item || "").trim()).filter(Boolean)
    : Array.isArray(service?.serviceIncludes)
      ? service.serviceIncludes
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      : [];
  const itinerary = Array.isArray(service?.itinerary) ? service.itinerary : [];
  const categoryLabel = getCategoryLabel(service);
  const stats = countItineraryStats(itinerary);
  const serviceImages = getServiceImages(service);
  const goGalleryPrev = () =>
    setGalleryImg((prev) => (prev === 0 ? serviceImages.length - 1 : prev - 1));
  const goGalleryNext = () =>
    setGalleryImg((prev) => (prev === serviceImages.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    if (activeImg >= serviceImages.length) {
      setActiveImg(0);
    }
    if (galleryImg >= serviceImages.length) {
      setGalleryImg(0);
    }
  }, [activeImg, galleryImg, serviceImages.length]);

  useEffect(() => {
    if (service?._id) return;
    if (!id) return;

    const fetchServiceDetail = async () => {
      try {
        const res = await axios.get(`/api/services/detail/${id}`);
        setService(res.data?.data || null);
      } catch (err) {
        console.log(err);
      }
    };

    fetchServiceDetail();
  }, [id, service?._id]);

  useEffect(() => {
    if (!service?._id) return;
    if (countedViewServiceId.current === String(service._id)) return;

    countedViewServiceId.current = String(service._id);

    const incrementView = async () => {
      try {
        await axios.patch(`/api/services/${service._id}/view`, {}, {
          headers: buildTrackingHeaders(accessToken),
        });
      } catch (err) {
        console.log(err);
      }
    };

    incrementView();
  }, [accessToken, guestId, service?._id]);

  useEffect(() => {
    if (!service?._id) return;

    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`/api/schedules/service/${service._id}`);
        setSchedules(res.data?.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchSchedules();
  }, [service?._id]);

  useEffect(() => {
    if (!service?._id) return;

    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/reviews/service/${service._id}`);
        setReviews(res.data?.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchReviews();
  }, [service?._id]);

  if (!service) {
    return <div>Không có dữ liệu</div>;
  }

  return (
    <div>
      <div className="relative h-72 overflow-hidden md:h-[440px]">
        <img
          src={serviceImages[activeImg] || serviceImages[0]}
          alt={service.serviceName || service.name || "service-image"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl p-6 md:p-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur-sm"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {categoryLabel}
                </span>
                {service.duration && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur-sm"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    <FaClock size={11} />
                    {service.duration}
                  </span>
                )}
              </div>

              <h1
                className="text-white"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(24px, 4vw, 38px)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {service.serviceName || service.name || "Dịch vụ"}
              </h1>

              <div
                className="mt-3 flex flex-wrap items-center gap-4 text-white/80"
                style={{ fontSize: 14 }}
              >
                <span className="flex items-center gap-1">
                  <FaLocationDot size={14} />
                  {service.location}
                </span>
                <span className="flex items-center gap-1">
                  <FaStar size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                  {service.rating || 0} ({service.reviewCount || 0})
                </span>
                <span>
                  bởi{" "}
                  <span className="text-[#f97316]" style={{ fontWeight: 500 }}>
                    {service.provider_id?.fullName ||
                      service.partnerName ||
                      service.nameProvider ||
                      "VIVU"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {serviceImages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setGalleryImg(activeImg);
              setShowGallery(true);
            }}
            className="absolute bottom-6 right-6 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#1a1a2e]"
          >
            Xem thêm ảnh
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#f0f4f8] p-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
                    view === item.id
                      ? "bg-white shadow-sm text-[#f97316]"
                      : "text-gray-500 hover:text-[#1a1a2e]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <DetailContentServices
              view={view}
              setView={setView}
              description={service.description}
              highlight={highlight}
              includes={includes}
              itinerary={itinerary}
              schedules={schedules}
              reviews={reviews}
              selectedSchedule={selectedSchedule}
              setSelectedSchedule={setSelectedSchedule}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-4">
              <BookingBox
                props={service}
                schedules={schedules}
                viewPage={viewPage}
                setViewPage={setViewPage}
                setView={setView}
                selectedSchedule={selectedSchedule}
                setSelectedSchedule={setSelectedSchedule}
                onCheckout={(bookingData) =>
                  navigate(`/booking/confirm/${service._id}`, {
                    state: {
                      serviceId: service._id,
                      selectedSchedule: bookingData.schedule,
                      scheduleId: bookingData.scheduleId,
                      people: bookingData.people,
                      note: bookingData.note,
                      price: bookingData.price,
                      originalTotal: bookingData.originalTotal,
                      discountAmount: bookingData.discountAmount,
                      finalTotal: bookingData.finalTotal,
                      total: bookingData.total,
                      couponCode: bookingData.couponCode,
                      coupon: bookingData.coupon,
                      couponResult: bookingData.couponResult,
                      appliedCoupon: bookingData.appliedCoupon,
                    },
                  })
                }
              />

              <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm lg:block">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2b55] p-5">
                  <p className="text-xs text-white/60">TOUR OVERVIEW</p>
                  <p className="text-sm font-semibold text-white">
                    Tổng quan hành trình
                  </p>
                </div>

                <div className="bg-white p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-orange-50 p-3 text-center">
                      <MdOutlineDateRange className="mx-auto mb-1 text-lg text-orange-500" />
                      <p className="text-xs text-gray-500">Ngày</p>
                      <p className="text-lg font-bold">{stats.days || "-"}</p>
                    </div>

                    <div className="rounded-xl bg-purple-50 p-3 text-center">
                      <FaRegEye className="mx-auto mb-1 text-lg text-purple-600" />
                      <p className="text-xs text-gray-500">Tham quan</p>
                      <p className="text-lg font-bold">
                        {stats.sightseeingCount || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow-50 p-3 text-center">
                      <MdFoodBank className="mx-auto mb-1 text-lg text-yellow-600" />
                      <p className="text-xs text-gray-500">Bữa ăn</p>
                      <p className="text-lg font-bold">
                        {stats.mealCount || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-cyan-50 p-3 text-center">
                      <FaRegCompass className="mx-auto mb-1 text-lg text-cyan-600" />
                      <p className="text-xs text-gray-500">Hoạt động</p>
                      <p className="text-lg font-bold">
                        {stats.activityCount || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-xl bg-gray-100 py-2 text-sm text-gray-700 hover:bg-gray-200 transition">
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </div>
      </div>

      {showGallery && serviceImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowGallery(false)}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Thư viện ảnh{" "}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_0.9fr]">
              <div className="relative overflow-hidden rounded-3xl bg-slate-100">
                <img
                  src={serviceImages[galleryImg] || serviceImages[0]}
                  alt={service.serviceName || service.name || "service-gallery"}
                  className="h-[420px] w-full object-cover"
                />
                {serviceImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goGalleryPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm transition hover:bg-black/55"
                      aria-label="Ảnh trước"
                    >
                      <FaArrowLeftLong size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={goGalleryNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm transition hover:bg-black/55"
                      aria-label="Ảnh tiếp theo"
                    >
                      <FaArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {serviceImages.map((img, index) => (
                  <button
                    key={img || index}
                    type="button"
                    onClick={() => setGalleryImg(index)}
                    className={`overflow-hidden rounded-2xl border-2 transition ${
                      galleryImg === index
                        ? "border-[#f97316] shadow-md"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailServices;
