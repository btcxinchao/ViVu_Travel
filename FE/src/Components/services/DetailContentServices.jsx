import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaCamera,
  FaChevronDown,
  FaChevronUp,
  FaCompass,
  FaEye,
  FaHotel,
  FaStar,
  FaUtensils,
} from "react-icons/fa6";
import { LuUtensilsCrossed } from "react-icons/lu";
import { LuBed } from "react-icons/lu";

import { FaCircleCheck, MdOutlineDateRange } from "../../assets/Icons/Icons";
import { formatDate } from "../../utils/formatDate";

const activityMeta = {
  transport: { Icon: FaBus, cls: "bg-blue-100 text-blue-600" },
  sightseeing: { Icon: FaEye, cls: "bg-purple-100 text-purple-600" },
  food: { Icon: FaUtensils, cls: "bg-orange-100 text-[#f97316]" },
  hotel: { Icon: FaHotel, cls: "bg-emerald-100 text-emerald-600" },
  activity: { Icon: FaCompass, cls: "bg-cyan-100 text-cyan-600" },
  photo: { Icon: FaCamera, cls: "bg-pink-100 text-pink-600" },
};

const normalizeText = (value) => String(value || "").trim();

const getReviewDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? normalizeText(value)
    : date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const isTourEndAccommodation = (value) => {
  const text = normalizeText(value).toLowerCase();
  return (
    text === "kết thúc tour" ||
    text === "ket thuc tour" ||
    text === "kết thúc trong ngày" ||
    text === "ket thuc trong ngay"
  );
};

const stripDayPrefix = (value) => {
  const text = normalizeText(value);
  return text.replace(/^(ngày|ngay|day)\s*\d+\s*[:.\-–]?\s*/i, "").trim();
};

const getDayTitle = (day) => {
  const title =
    stripDayPrefix(day?.title) ||
    stripDayPrefix(day?.summary) ||
    stripDayPrefix(day?.shortTitle);

  if (title) return title;

  const firstActivityTitle = normalizeText(day?.activities?.[0]?.title);
  if (firstActivityTitle) return firstActivityTitle;

  return "";
};

const getDayDescription = (day) => {
  const description =
    normalizeText(day?.description) ||
    normalizeText(day?.shortDescription) ||
    normalizeText(day?.note);

  if (description) return description;

  const activityDescription = normalizeText(day?.activities?.[0]?.description);
  if (activityDescription) return activityDescription;

  return "";
};

const getMealEntries = (day) => {
  const rawMeals = day?.meals ?? day?.meal ?? day?.mealPlan ?? [];

  if (Array.isArray(rawMeals)) {
    return rawMeals.map((item) => normalizeText(item)).filter(Boolean);
  }

  if (typeof rawMeals === "string") {
    return rawMeals
      .split(/\r?\n|•|-/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return [];
};

const getAccommodationText = (day) => {
  const text =
    normalizeText(day?.hotelName) ||
    normalizeText(day?.hotel_name) ||
    normalizeText(day?.stayName) ||
    normalizeText(day?.nameHotel) ||
    normalizeText(day?.accommodation) ||
    normalizeText(day?.hotel) ||
    normalizeText(day?.stay);

  return text && !isTourEndAccommodation(text) ? text : "";
};

const getHotelFromActivities = (day) => {
  const hotelActivity = Array.isArray(day?.activities)
    ? day.activities.find(
        (act) => String(act?.type || act?.icon || "").toLowerCase() === "hotel",
      )
    : null;

  const title = normalizeText(hotelActivity?.title);
  return title;
};

function ActivityIcon({ act }) {
  const key = String(act?.icon || act?.type || "sightseeing").toLowerCase();
  const meta = activityMeta[key] || activityMeta.sightseeing;
  const IconComp = meta.Icon;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}
    >
      <IconComp size={17} />
    </div>
  );
}

function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();

  if (key === "open") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Còn chỗ
      </span>
    );
  }

  if (key === "full") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Hết chỗ
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      Đã đóng
    </span>
  );
}

function DetailContentServices({
  view,
  setView,
  description = "",
  highlight = [],
  includes = [],
  itinerary = [],
  schedules = [],
  reviews = [],
  selectedSchedule,
  setSelectedSchedule,
}) {
  const [expandedDays, setExpandedDays] = useState([1]);

  const sortedItinerary = useMemo(() => {
    return Array.isArray(itinerary)
      ? [...itinerary].sort((a, b) => Number(a?.day || 0) - Number(b?.day || 0))
      : [];
  }, [itinerary]);

  const stats = useMemo(() => {
    const allActivities = sortedItinerary.flatMap(
      (day) => day?.activities || [],
    );
    const sightseeingCount = allActivities.filter((act) =>
      ["sightseeing", "photo"].includes(
        String(act?.icon || act?.type || "").toLowerCase(),
      ),
    ).length;

    const mealCount = sortedItinerary.reduce(
      (sum, day) => sum + (day?.meals?.length || 0),
      0,
    );

    const activityCount = allActivities.filter((act) =>
      ["activity", "transport", "hotel", "food"].includes(
        String(act?.icon || act?.type || "").toLowerCase(),
      ),
    ).length;

    return {
      days: sortedItinerary.length,
      sightseeingCount,
      mealCount,
      activityCount,
    };
  }, [sortedItinerary]);

  const toggleDay = (day) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="space-y-6 text-left">
      {view === "overview" && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-[18px] font-semibold text-[#1a1a2e]">
              Mô tả dịch vụ
            </h3>
            <p className="whitespace-pre-line text-[15px] leading-8 text-slate-500">
              {description?.trim() ? description : "Chưa có mô tả."}
            </p>
          </div>

          <div className="space-y-6">
            {highlight.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm border-border">
                <h3 className="mb-4" style={{ fontSize: 18, fontWeight: 600 }}>
                  Điểm nổi bật
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {highlight.map((item, index) => (
                    <motion.div
                      key={`${index}-${item}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-[#f97316]/5 rounded-xl"
                    >
                      <FaCircleCheck
                        size={18}
                        className="text-[#f97316] shrink-0 mt-0.5"
                      />
                      <span style={{ fontSize: 14, lineHeight: 1.5 }}>
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {includes.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm border-border">
                <h3 className="mb-4" style={{ fontSize: 18, fontWeight: 600 }}>
                  Dịch vụ bao gồm
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {includes.map((item, index) => (
                    <p
                      key={`${index}-${item}`}
                      className="flex items-center gap-2 text-muted-foreground"
                      style={{ fontSize: 14 }}
                    >
                      <FaCircleCheck
                        size={15}
                        className="text-green-500 shrink-0"
                      />{" "}
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sortedItinerary.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[18px] font-semibold">
                  Tóm tắt lịch trình
                </h3>
                <button
                  type="button"
                  onClick={() => setView("itinerary")}
                  className="text-[#f97316] hover:underline"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  Xem chi tiết
                </button>
              </div>

              <div className="space-y-0">
                {sortedItinerary.map((day, index) => (
                  <div key={day?.day || index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f97316] to-[#f59e0b] text-white text-[13px] font-bold">
                        N{day.day}
                      </div>
                      {index < sortedItinerary.length - 1 && (
                        <div className="my-1 w-0.5 flex-1 bg-[#f97316]/20" />
                      )}
                    </div>

                    <div className="pb-6 pt-0.5">
                      <h4 className="text-[15px] font-semibold">
                        {getDayTitle(day)}
                      </h4>
                      {getDayDescription(day) ? (
                        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                          {getDayDescription(day)}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {getMealEntries(day).map((meal, mealIndex) => (
                          <div
                            key={`${day?.day}-meal-${mealIndex}`}
                            className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[#f97316]"
                            style={{ fontSize: 12, fontWeight: 500 }}
                          >
                            <LuUtensilsCrossed size={11} />
                            <span className="truncate">{meal}</span>
                          </div>
                        ))}

                        {getAccommodationText(day) ||
                        getHotelFromActivities(day) ? (
                          <div
                            className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700"
                            style={{ fontSize: 12, fontWeight: 500 }}
                          >
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                              <LuBed size={10} />
                            </span>
                            <span className="truncate">
                              {getAccommodationText(day) ||
                                getHotelFromActivities(day)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "itinerary" && (
        <div className="space-y-4">
          {sortedItinerary.length === 0 ? (
            <div className="rounded-lg bg-white p-10 text-center shadow-sm">
              <p className="text-[15px] text-slate-500">
                Chưa có lịch trình chi tiết
              </p>
            </div>
          ) : (
            sortedItinerary.map((day) => {
              const isExpanded = expandedDays.includes(day.day);

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-lg bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(day.day)}
                    className="w-full p-5 text-left transition-colors hover:bg-[#f8fafc]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#f59e0b] text-white">
                        <span className="text-[10px] font-medium leading-none">
                          NGÀY
                        </span>
                        <span className="text-[22px] font-bold leading-none">
                          {day.day}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-semibold text-slate-800">
                          {getDayTitle(day)}
                        </h3>
                        {getDayDescription(day) ? (
                          <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                            {getDayDescription(day)}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-slate-400">
                        {isExpanded ? (
                          <FaChevronUp size={18} />
                        ) : (
                          <FaChevronDown size={18} />
                        )}
                      </div>
                    </div>

                    <div className="ml-[4.5rem] mt-3 flex flex-wrap gap-2">
                      {getMealEntries(day).map((meal, mealIndex) => (
                        <div
                          key={`${day.day}-meal-tag-${mealIndex}`}
                          className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-[12px] font-medium text-[#f97316]"
                        >
                          <LuUtensilsCrossed size={12} />{" "}
                          <span className="truncate">{meal}</span>
                        </div>
                      ))}

                      {getAccommodationText(day) ||
                      getHotelFromActivities(day) ? (
                        <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                            <LuBed size={10} />
                          </span>
                          <span className="truncate">
                            {getAccommodationText(day) ||
                              getHotelFromActivities(day)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-6">
                      <div className="ml-[1.65rem] space-y-0 border-l-2 border-[#f97316]/20 pl-8">
                        {(day.activities || []).map((act, actIndex) => (
                          <motion.div
                            key={`${day.day}-act-${actIndex}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: actIndex * 0.03 }}
                            className="relative pb-6 last:pb-0"
                          >
                            <div className="absolute -left-[2.55rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#f97316] shadow-sm" />

                            <div className="flex gap-3">
                              <ActivityIcon act={act} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {act?.time ? (
                                    <span className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                                      {act.time}
                                    </span>
                                  ) : null}
                                  <h4 className="text-[15px] font-semibold text-slate-800">
                                    {act?.title || "Hoạt động"}
                                  </h4>
                                </div>
                                {act?.description ? (
                                  <p className="mt-1 text-[13px] leading-7 text-slate-500">
                                    {act.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}

          {sortedItinerary.length > 1 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() =>
                  setExpandedDays(
                    expandedDays.length === sortedItinerary.length
                      ? []
                      : sortedItinerary.map((day) => day.day),
                  )
                }
                className="text-[#f97316] hover:underline"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {expandedDays.length === sortedItinerary.length
                  ? "Thu gọn tất cả"
                  : "Mở rộng tất cả"}
              </button>
            </div>
          )}
        </div>
      )}

      {view === "schedules" && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[18px] font-semibold">Lịch khởi hành</h3>

          {schedules.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              Chưa có lịch khởi hành
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => {
                const maxSlots = Number(
                  schedule?.maxSlots || schedule?.maxPeople || 0,
                );
                const bookedSlots = Number(schedule?.bookedSlots || 0);
                const remain = Math.max(maxSlots - bookedSlots, 0);
                const isFull =
                  String(schedule?.status || "").toLowerCase() === "full" ||
                  remain <= 0;
                const isSelected =
                  selectedSchedule?._id === schedule?._id ||
                  selectedSchedule?.id === schedule?.id;

                return (
                  <button
                    key={schedule._id || schedule.id}
                    type="button"
                    disabled={
                      String(schedule?.status || "").toLowerCase() !== "open" ||
                      isFull
                    }
                    onClick={() => {
                      if (
                        String(schedule?.status || "").toLowerCase() ===
                          "open" &&
                        !isFull
                      ) {
                        setSelectedSchedule?.(schedule);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all
                      ${isSelected ? "border-slate-200 bg-white shadow-sm hover:border-slate-200 hover:bg-white" : "border-slate-200 bg-white hover:border-slate-200 hover:bg-white"}
                      ${String(schedule?.status || "").toLowerCase() !== "open" || isFull ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                      focus:outline-none focus:ring-0
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                        <MdOutlineDateRange className="h-[14px] w-[14px]" />
                      </div>

                      <div>
                        <p className="font-medium capitalize text-slate-800">
                          {formatDate(schedule.departureDate)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {isFull
                            ? "Đã hết chỗ"
                            : `Còn ${remain}/${maxSlots} chỗ`}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={schedule?.status} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "reviews" && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[18px] font-semibold">
            Đánh giá ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">
              Chưa có đánh giá
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const reviewerName =
                  review?.userId?.fullName || review?.userName || "Khách hàng";
                const initials = String(reviewerName || "U")
                  .split(" ")
                  .map((part) => part?.[0])
                  .filter(Boolean)
                  .join("")
                  .slice(-2)
                  .toUpperCase();

                return (
                  <div
                    key={review._id || review.id}
                    className="rounded-2xl bg-[#f8fafc] p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f97316] to-[#f59e0b] text-[14px] font-semibold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-slate-900">
                            {reviewerName}
                          </span>
                          <span className="text-[12px] text-muted-foreground">
                            {getReviewDate(review?.createdAt)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const active = index < Number(review?.rating || 0);
                            return (
                              <FaStar
                                key={index}
                                size={12}
                                className={
                                  active
                                    ? "text-[#f59e0b] fill-[#f59e0b]"
                                    : "text-slate-300"
                                }
                              />
                            );
                          })}
                        </div>

                        <p className="mt-3 text-[14px] leading-6 text-slate-600">
                          {review?.comment || "Không có nội dung đánh giá."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DetailContentServices;
