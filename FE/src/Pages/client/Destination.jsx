import { useEffect, useMemo, useState } from "react";
import CustomBtnDestination from "../../Components/destination/ButtonDestination";
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaUmbrellaBeach,
  FaMountain,
  FaLandmark,
  FaUtensils,
  FaCity,
  FaCompass,
  FaChevronRight,
  FaFire,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { IoLocationOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import ServicesCard from "../../Components/services/ServicesCard";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildTrackingHeaders, getGuestId } from "../../utils/guest.js";
import toast from "react-hot-toast";

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const budgetLabelMap = {
  under2: "Dưới 2 triệu",
  "2to5": "2 - 5 triệu",
  over5: "Trên 5 triệu",
};

const seasonLabelMap = {
  spring: "Mùa xuân",
  summer: "Mùa hè",
  autumn: "Mùa thu",
  winter: "Mùa đông",
};

const seasonOptions = [
  { value: "all", label: "Tất cả mùa" },
  { value: "spring", label: "Mùa xuân" },
  { value: "summer", label: "Mùa hè" },
  { value: "autumn", label: "Mùa thu" },
  { value: "winter", label: "Mùa đông" },
];

const MONTH_SEASON_MAP = {
  1: "spring",
  2: "spring",
  3: "spring",
  4: "summer",
  5: "summer",
  6: "summer",
  7: "autumn",
  8: "autumn",
  9: "autumn",
  10: "winter",
  11: "winter",
  12: "winter",
};

const getCategoryText = (category) => {
  if (Array.isArray(category)) {
    return category[0]?.categoryName || category[0] || "";
  }
  if (category && typeof category === "object") {
    return category.categoryName || "";
  }
  return category || "";
};

const getCategoryIcon = (categoryName) => {
  const key = normalizeText(categoryName);
  if (!key) return <FaCompass size={14} />;
  if (key.includes("bien") || key.includes("dao"))
    return <FaUmbrellaBeach size={14} />;
  if (key.includes("nui") || key.includes("trek"))
    return <FaMountain size={14} />;
  if (key.includes("van hoa") || key.includes("vanhoa"))
    return <FaLandmark size={14} />;
  if (key.includes("am thuc") || key.includes("amthuc"))
    return <FaUtensils size={14} />;
  if (key.includes("thanh pho") || key.includes("thanhpho"))
    return <FaCity size={14} />;
  if (key.includes("mao hiem") || key.includes("maohiem"))
    return <FaCompass size={14} />;
  return <FaCompass size={14} />;
};

const getSeasonTags = (service) => {
  const seasonTags = Array.isArray(service?.seasonTags)
    ? service.seasonTags.map((item) => normalizeText(item)).filter(Boolean)
    : [];

  const bestMonths = Array.isArray(service?.bestMonths)
    ? service.bestMonths
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item >= 1 && item <= 12)
    : [];

  const monthMappedSeasons = bestMonths
    .map((month) => MONTH_SEASON_MAP[month])
    .filter(Boolean);

  return [...new Set([...seasonTags, ...monthMappedSeasons])];
};

const matchesSeasonFilter = (service, seasonFilter) => {
  if (seasonFilter === "all") return true;

  const seasonTags = getSeasonTags(service);
  return seasonTags.includes(normalizeText(seasonFilter));
};

const Destination = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [Data, setData] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [favoriteServiceIds, setFavoriteServiceIds] = useState([]);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState("");
  const servicesSectionRef = useRef(null);
  const accessToken = localStorage.getItem("accessToken");
  const guestId = useMemo(() => getGuestId(), []);
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, []);
  const canManageFavorites = Boolean(
    currentUser &&
    String(currentUser.role || "").toLowerCase() === "user" &&
    accessToken,
  );
  const recordSearchBehavior = async () => {
    try {
      await axios.post(
        "/api/users/behavior",
        {
          actionType: "search",
          keyword: searchText.trim(),
          category: activeCategory === "Tất cả" ? "" : activeCategory,
          budgetRange:
            budgetFilter === "all"
              ? ""
              : budgetFilter === "under2"
                ? "low"
                : budgetFilter === "2to5"
                  ? "mid"
                  : "high",
          location: searchText.trim(),
          season: seasonFilter === "all" ? "" : seasonFilter,
          source: "destination_search",
        },
        {
          headers: buildTrackingHeaders(accessToken),
        },
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/services?limit=1000");
        const data = await res.json();
        setData(data.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!canManageFavorites) {
      setFavoriteServiceIds([]);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await axios.get("/api/users/favorites", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const favoriteIds = Array.isArray(res.data?.data)
          ? res.data.data
              .map((item) => String(item?._id || item?.id))
              .filter(Boolean)
          : [];

        setFavoriteServiceIds(favoriteIds);
      } catch (error) {
        setFavoriteServiceIds([]);
      }
    };

    fetchFavorites();
  }, [accessToken, canManageFavorites, guestId]);

  const categories = useMemo(() => {
    const categorySet = new Set();

    Data.forEach((service) => {
      const rawCategory = service?.category;
      if (Array.isArray(rawCategory)) {
        rawCategory
          .map(getCategoryText)
          .filter(Boolean)
          .forEach((item) => categorySet.add(item));
        return;
      }
      const categoryText = getCategoryText(rawCategory);
      if (categoryText) categorySet.add(categoryText);
    });

    return ["Tất cả", ...Array.from(categorySet)];
  }, [Data]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("q") || "";
    const categoryParam = params.get("category") || "";
    const budgetParam = params.get("budget") || "all";
    const seasonParam = params.get("season") || "all";

    setSearchText(keyword);
    setBudgetFilter(budgetParam);
    setSeasonFilter(seasonParam);

    if (categoryParam) {
      const matchedCategory =
        categories.find(
          (item) => normalizeText(item) === normalizeText(categoryParam),
        ) || "";

      if (matchedCategory) {
        setActiveCategory(matchedCategory);
      }
    }
  }, [categories, location.search]);

  useEffect(() => {
    if (location.hash !== "#services") return;

    const scrollTimer = window.setTimeout(() => {
      servicesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [location.hash, location.search]);

  const uniqueLocations = [
    ...new Set(Data.map((item) => item?.location).filter(Boolean)),
  ];

  const visibleServices = useMemo(() => {
    if (activeCategory === "Tất cả") return Data;

    return Data.filter((service) => {
      const rawCategory = service?.category;
      if (Array.isArray(rawCategory)) {
        return rawCategory.some(
          (item) =>
            normalizeText(getCategoryText(item)) ===
            normalizeText(activeCategory),
        );
      }
      return (
        normalizeText(getCategoryText(rawCategory)) ===
        normalizeText(activeCategory)
      );
    });
  }, [Data, activeCategory]);

  const searchedServices = useMemo(() => {
    const keyword = normalizeText(searchText);
    return visibleServices.filter((service) => {
      const serviceNameText = normalizeText(
        service?.serviceName || service?.servicesName || service?.name || "",
      );
      const locationText = normalizeText(
        service?.location || service?.destination || service?.region || "",
      );
      const terrainText = normalizeText(
        getCategoryText(service?.category) || service?.region || "",
      );
      const price = Number(service?.prices || service?.price || 0);
      const matchKeyword =
        !keyword ||
        serviceNameText.includes(keyword) ||
        locationText.includes(keyword) ||
        terrainText.includes(keyword);
      const matchBudget =
        budgetFilter === "all" ||
        (budgetFilter === "under2" && price > 0 && price < 2000000) ||
        (budgetFilter === "2to5" && price >= 2000000 && price <= 5000000) ||
        (budgetFilter === "over5" && price > 5000000);
      const matchSeason = matchesSeasonFilter(service, seasonFilter);

      return matchKeyword && matchBudget && matchSeason;
    });
  }, [budgetFilter, searchText, seasonFilter, visibleServices]);

  const handleToggleFavorite = async (service) => {
    const serviceId = String(service?._id || service?.id || "");
    if (!serviceId) return;

    if (!canManageFavorites) {
      toast.error(
        "Bạn cần đăng nhập bằng tài khoản khách hàng để lưu yêu thích.",
      );
      navigate("/signin");
      return;
    }

    try {
      setFavoriteLoadingId(serviceId);
      const res = await axios.patch(
        `/api/users/favorites/${serviceId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const nextFavorite = Boolean(res.data?.data?.isFavorited);
      setFavoriteServiceIds((prev) => {
        if (nextFavorite) {
          return prev.includes(serviceId) ? prev : [...prev, serviceId];
        }

        return prev.filter((item) => item !== serviceId);
      });
      toast.success(
        res.data?.message ||
          (nextFavorite ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích"),
      );
      return { isFavorited: nextFavorite };
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Không thể cập nhật danh sách yêu thích.",
      );
      return { isFavorited: favoriteServiceIds.includes(serviceId) };
    } finally {
      setFavoriteLoadingId("");
    }
  };

  const handleSearch = () => {
    recordSearchBehavior();
    const params = new URLSearchParams();
    if (searchText.trim()) params.set("q", searchText.trim());
    if (activeCategory !== "Tất cả") params.set("category", activeCategory);
    if (budgetFilter !== "all") params.set("budget", budgetFilter);
    if (seasonFilter !== "all") params.set("season", seasonFilter);
    navigate(
      `/destination${params.toString() ? `?${params.toString()}` : ""}#services`,
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden text-center">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1772333389046-857fa5f9f9a5"
            alt=""
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/45" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-center px-6">
          <div className="flex max-w-2xl flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-[13px] font-medium mb-5">
              <FaMapMarkerAlt className="text-[#f59e0b]" size={12} />
              Việt Nam Travel
            </div>

            <h1
              className="text-white mb-4"
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(28px, 5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Khám phá <span className="text-[#f59e0b]">điểm đến</span>
              <br />
              tuyệt vời nhất Việt Nam
            </h1>

            <p className="text-white/75 max-w-xl mb-8 text-[16px] leading-7">
              Dịch vụ du lịch · Giá tốt · Đảm bảo hoàn tiền
            </p>

            <div className="mt-4 grid  max-w-[2000px] grid-cols-1 gap-2.5 rounded-[22px] bg-white px-3.5 py-4 shadow-2xl md:grid-cols-2 lg:grid-cols-[minmax(250px,1.8fr)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(170px,1fr)_auto] lg:items-center lg:gap-3 lg:px-3.5 lg:py-3">
              <div className="flex min-w-0 items-center gap-2 min-h-[60px] px-1.5 lg:border-r border-gray-100">
                <div>
                  <IoLocationOutline className="ml-1 text-lg text-[#F78F10]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-left text-[12px] leading-none">
                    Tên địa điểm
                  </p>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="VD: Hạ Long, Đà Nẵng..."
                    className="w-full bg-transparent text-[14px] leading-tight text-[#1a1a2e] outline-none"
                  />
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 min-h-[60px] px-1.5 lg:border-r border-gray-100">
                <div>
                  <RiCalendarScheduleLine className="ml-1 text-lg text-[#F78F10]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 ml-1 text-left text-[12px] leading-none">
                    Loại tour
                  </p>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full bg-transparent text-[14px] leading-tight text-[#1a1a2e] outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category} value={getCategoryText(category)}>
                        {getCategoryText(category)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 min-h-[60px] px-1.5 lg:border-r border-gray-100">
                <div>
                  <RiCalendarScheduleLine className="ml-1 text-lg text-[#F78F10]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 ml-1 text-left text-[12px] leading-none">
                    Ngân sách
                  </p>
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="w-full bg-transparent text-[14px] leading-tight text-[#1a1a2e] outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="under2">Dưới 2 triệu</option>
                    <option value="2to5">2 - 5 triệu</option>
                    <option value="over5">Trên 5 triệu</option>
                  </select>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 min-h-[60px] px-1.5 lg:border-r border-gray-100">
                <div>
                  <RiCalendarScheduleLine className="ml-1 text-lg text-[#F78F10]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-left text-[12px] ml-1 leading-none">Mùa</p>
                  <select
                    value={seasonFilter}
                    onChange={(e) => setSeasonFilter(e.target.value)}
                    className="w-full bg-transparent text-[14px] leading-tight text-[#1a1a2e] outline-none"
                  >
                    {seasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex min-h-[60px] items-center rounded-xl bg-white lg:justify-self-end lg:pl-0">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-[60px] w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#F78F10] px-5 text-white transition-all lg:min-w-[140px] lg:w-auto"
                >
                  <div className="flex items-center gap-2">
                    <CiSearch className="text-lg font-bold" />
                    <p className="rounded-xl bg-[#F78F10] px-6 py-3.5 text-white">
                      Tìm kiếm
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        id="services"
        ref={servicesSectionRef}
        className="max-w-7xl mx-auto px-6 py-8 scroll-mt-24"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((category) => (
            <CustomBtnDestination
              key={category}
              title={getCategoryText(category)}
              icon={
                category === "Tất cả" ? (
                  <FaCompass size={14} />
                ) : (
                  getCategoryIcon(getCategoryText(category))
                )
              }
              active={activeCategory === getCategoryText(category)}
              onClick={() => setActiveCategory(getCategoryText(category))}
              size="large"
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {searchedServices.map((service, index) => {
              const serviceId = service?._id || service?.id;

              return (
                <motion.div
                  key={serviceId || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={serviceId ? `/services/${serviceId}` : "/destination"}
                    state={{ props: service }}
                    className="block"
                  >
                    <ServicesCard
                      service={service}
                      variant="destination"
                      showFavorite
                      isFavorite={favoriteServiceIds.includes(
                        String(serviceId),
                      )}
                      favoriteLoading={favoriteLoadingId === String(serviceId)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Destination;
