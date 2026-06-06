import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { splitLines, isValidImageUrl } from "../../utils/stringHelpers.js";
import { fileToDataUrl } from "../../utils/fileToDataUrl.js";
import RequiredLabel from "../../Components/shared/RequiredLabel.jsx";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  location: "",
  category: "",
  seasons: [],
  duration: "",
  images: "",
  highlights: "",
  includes: "",
  itinerary: "",
};

const SEASON_OPTIONS = [
  { value: "spring", label: "Xuân" },
  { value: "summer", label: "Hạ" },
  { value: "autumn", label: "Thu" },
  { value: "winter", label: "Đông" },
];

const CATEGORY_ORDER = [
  "bien-dao",
  "nui",
  "thanh-pho",
  "van-hoa",
  "mao-hiem",
  "kham-pha",
  "am-thuc",
];

const CATEGORY_LABELS = {
  "bien-dao": "Biển đảo",
  nui: "Núi",
  "thanh-pho": "Thành phố",
  "van-hoa": "Văn hóa",
  "mao-hiem": "Mạo hiểm",
  "kham-pha": "Khám phá",
  "am-thuc": "Ẩm thực",
};

const getDigitsOnly = (value) => String(value || "").replace(/\D/g, "");

const formatPriceInput = (value) => {
  const digits = getDigitsOnly(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const isEmbeddedImage = (value) =>
  /^data:image\//i.test(String(value || "").trim());

const EditServices = ({ isModal = false, serviceId, onClose, onUpdated } = {}) => {
  const { id: routeId } = useParams();
  const id = serviceId || routeId;
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [itineraryFile, setItineraryFile] = useState(null);
  const imageFile = imageFiles[0] || null;
  const seasonDropdownRef = useRef(null);
  const fieldRefs = useRef({});
  const imageInputRef = useRef(null);
  const itineraryInputRef = useRef(null);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const result = await res.json();
        const allowedCategories = Array.isArray(result.data)
          ? result.data.filter((item) =>
              CATEGORY_ORDER.includes(String(item?.slug || "").trim()),
            )
          : [];
        allowedCategories.sort(
          (a, b) =>
            CATEGORY_ORDER.indexOf(String(a?.slug || "")) -
            CATEGORY_ORDER.indexOf(String(b?.slug || "")),
        );
        setCategories(allowedCategories);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        seasonDropdownRef.current &&
        !seasonDropdownRef.current.contains(event.target)
      ) {
        setSeasonOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`/api/services/detail/${id}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const result = await res.json();

        if (!res.ok) {
          toast.error(result?.message || "Không tải được thông tin dịch vụ");
          return;
        }

        const service = result?.data || result;
        const serviceImages = Array.isArray(service.images)
          ? service.images.filter(Boolean)
          : service.imageUrl
            ? [service.imageUrl]
            : [];

        setExistingImages(serviceImages);

        setFormData({
          name: service.serviceName || service.servicesName || service.ServiceName || "",
          description: service.description || service.descriptionDetail || "",
          price: formatPriceInput(service.prices ?? service.price ?? ""),
          location: service.location || service.destination || "",
          category:
            (typeof service.category === "object" && service.category?._id) ||
            (Array.isArray(service.category)
              ? service.category[0]?._id || service.category[0] || ""
              : service.category || ""),
          seasons: Array.isArray(service.seasonTags)
            ? service.seasonTags
                .map((item) => String(item || "").trim())
                .filter(Boolean)
            : [],
          duration: String(service.duration || ""),
          images: serviceImages
            .filter((image) => !isEmbeddedImage(image))
            .join("\n"),
          highlights: Array.isArray(service.highlights)
            ? service.highlights.join("\n")
            : Array.isArray(service.highlight)
              ? service.highlight.join("\n")
              : service.highlight || "",
          includes: Array.isArray(service.includes)
            ? service.includes.join("\n")
            : Array.isArray(service.serviceIncludes)
              ? service.serviceIncludes.join("\n")
              : "",
          itinerary: Array.isArray(service.itinerary)
            ? JSON.stringify(service.itinerary, null, 2)
            : service.itinerary || "",
        });
      } catch {
        toast.error("Không tải được thông tin dịch vụ");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetail();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? formatPriceInput(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImagesChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, images: value }));
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    setErrors((prev) => ({ ...prev, images: "" }));
    e.target.value = "";
  };

  const removeImageFile = (index) => {
    setImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleItineraryFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setItineraryFile(file);
    setErrors((prev) => ({ ...prev, itineraryFile: "" }));
    if (!file) return;
    setSuccess(false);
    setMessage("");
  };

  const removeItineraryFile = () => {
    setItineraryFile(null);
    if (itineraryInputRef.current) itineraryInputRef.current.value = "";
  };

  const toggleSeason = (seasonValue) => {
    setFormData((prev) => {
      const exists = prev.seasons.includes(seasonValue);
      return {
        ...prev,
        seasons: exists
          ? prev.seasons.filter((item) => item !== seasonValue)
          : [...prev.seasons, seasonValue],
      };
    });
    setErrors((prev) => ({ ...prev, seasons: "" }));
  };

  const setFieldRef = (name) => (element) => {
    fieldRefs.current[name] = element;
  };

  const focusFirstError = (nextErrors) => {
    const firstField = Object.keys(nextErrors)[0];
    if (!firstField) return;
    const target = fieldRefs.current[firstField];
    if (target?.focus) {
      target.focus();
      target.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
  };

  const validateFields = () => {
    const nextErrors = {};
    const rawPrice = getDigitsOnly(formData.price);
    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên dịch vụ";
    if (!formData.location.trim()) nextErrors.location = "Vui lòng nhập địa điểm";
    if (!rawPrice || Number(rawPrice) <= 0) nextErrors.price = "Giá phải lớn hơn 0";
    if (!formData.category) nextErrors.category = "Vui lòng chọn danh mục";
    if (formData.seasons.length === 0) nextErrors.seasons = "Vui lòng chọn ít nhất 1 mùa";
    if (!formData.duration.trim()) nextErrors.duration = "Vui lòng nhập thời lượng";
    if (!formData.description.trim()) nextErrors.description = "Vui lòng nhập mô tả";

    const linkImages = splitLines(formData.images);
    if (
      linkImages.length === 0 &&
      imageFiles.length === 0 &&
      existingImages.length === 0
    ) {
      nextErrors.images = "Vui lòng chọn ảnh upload hoặc nhập link ảnh";
    }

    const invalidImage = linkImages.find((item) => !isValidImageUrl(item));
    if (invalidImage) {
      nextErrors.images = "Link ảnh không đúng định dạng";
    }

    if (!formData.highlights.trim()) nextErrors.highlights = "Vui lòng nhập điểm nổi bật";
    if (!formData.includes.trim()) nextErrors.includes = "Vui lòng nhập nội dung bao gồm";

    setErrors(nextErrors);
    focusFirstError(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng kiểm tra các ô bị lỗi");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    const payload = new FormData();
    const rawPrice = getDigitsOnly(formData.price);
    payload.append("serviceName", formData.name.trim());
    payload.append("nameProvider", currentUser?.fullName || currentUser?.email || "Provider");
    payload.append("description", formData.description.trim());
    payload.append("prices", String(Number(rawPrice)));
    payload.append("location", formData.location.trim());
    payload.append("category", formData.category);
    payload.append("seasonTags", JSON.stringify(formData.seasons));
    payload.append("duration", formData.duration.trim());
    payload.append("highlight", JSON.stringify(splitLines(formData.highlights)));
    payload.append("includes", JSON.stringify(splitLines(formData.includes)));

    const linkImages = splitLines(formData.images);
    const uploadedImages = await Promise.all(imageFiles.map((file) => fileToDataUrl(file)));
    const embeddedImages = existingImages.filter(isEmbeddedImage);
    const imageList = [
      ...uploadedImages.filter(Boolean),
      ...embeddedImages,
      ...linkImages,
    ];

    payload.append("images", JSON.stringify(imageList));
    payload.append("imageUrl", imageList[0] || "");

    if (itineraryFile) {
      payload.append("itineraryFile", itineraryFile);
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success("Cập nhật dịch vụ thành công");
        if (isModal) {
          await onUpdated?.();
          onClose?.();
        } else {
          navigate("/provider/services");
        }
      } else {
        toast.error(result.message || "Không thể cập nhật dịch vụ");
      }
    } catch (error) {
      toast.error(`Lỗi kết nối server: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100";
  const labelClass = "mb-1.5 block pl-1 text-sm font-semibold text-gray-700";

  if (loading) return <p className="p-6">Đang tải dữ liệu...</p>;

  return (
    <div className={isModal ? "" : "min-h-screen bg-[#f8fafc] px-4 py-6 md:px-6 md:py-10"}>
      <div className={isModal ? "w-full" : "mx-auto max-w-4xl"}>
        <div className={isModal ? "mb-5" : "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"}>
          
        </div>
        <div className="flex justify-center">
          <div className={`relative w-full border border-orange-100 bg-white p-6 shadow-sm md:p-8 ${
            isModal ? "rounded-3xl" : "rounded-[28px]"
          }`}>
            {isModal ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500 shadow-sm transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Đóng"
              >
                ×
              </button>
            ) : null}
            {message && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
                  success
                    ? "border-green-200 bg-green-50 text-green-600"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <div className="mb-7 ">
            <h1 className="text-3xl font-bold text-gray-900">Sửa dịch vụ</h1>
          </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelClass}><RequiredLabel>Tên dịch vụ</RequiredLabel></label>
                    <input
                      type="text"
                      name="name"
                      ref={setFieldRef("name")}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Tên dịch vụ"
                      className={`${inputClass} ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    />
                    {errors.name && <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}><RequiredLabel>Địa điểm</RequiredLabel></label>
                    <input
                      type="text"
                      name="location"
                      ref={setFieldRef("location")}
                      value={formData.location}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.location ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    />
                    {errors.location && <p className="mt-1 text-xs font-medium text-red-500">{errors.location}</p>}
                  </div>
                </div>
              </div>

              <div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className={labelClass}><RequiredLabel>Giá</RequiredLabel></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="price"
                      ref={setFieldRef("price")}
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="VNĐ"
                      className={`${inputClass} ${errors.price ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    />
                    {errors.price && <p className="mt-1 text-xs font-medium text-red-500">{errors.price}</p>}
                  </div>
                  <div>
                    <label className={labelClass}><RequiredLabel>Danh mục</RequiredLabel></label>
                    <select
                      name="category"
                      ref={setFieldRef("category")}
                      value={formData.category}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.category ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {CATEGORY_LABELS[item.slug] ||
                            item.categoryName ||
                            item.name ||
                            item.slug}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-xs font-medium text-red-500">{errors.category}</p>}
                  </div>
                  <div ref={seasonDropdownRef} className="relative">
                    <label className={labelClass}>Mùa phù hợp</label>
                    <button
                      type="button"
                      ref={setFieldRef("seasons")}
                      onClick={() => setSeasonOpen((prev) => !prev)}
                      className={`${inputClass} flex items-center justify-between text-left ${errors.seasons ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    >
                      <span className={formData.seasons.length ? "text-gray-700" : "text-gray-400"}>
                        {formData.seasons.length > 0
                          ? SEASON_OPTIONS.filter((item) =>
                              formData.seasons.includes(item.value),
                            )
                              .map((item) => item.label)
                              .join(", ")
                          : "Chọn mùa"}
                      </span>
                      <span className="ml-3 text-gray-400">▾</span>
                    </button>
                    {seasonOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                        {SEASON_OPTIONS.map((item) => {
                          const checked = formData.seasons.includes(item.value);
                          return (
                            <label
                              key={item.value}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSeason(item.value)}
                                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-200"
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {errors.seasons && <p className="mt-1 text-xs font-medium text-red-500">{errors.seasons}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Thời lượng</label>
                    <input
                      type="text"
                      name="duration"
                      ref={setFieldRef("duration")}
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="VD: 5 ngày 4 đêm"
                      className={`${inputClass} ${errors.duration ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    />
                    {errors.duration && <p className="mt-1 text-xs font-medium text-red-500">{errors.duration}</p>}
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}><RequiredLabel>Mô tả</RequiredLabel></label>
                    <textarea
                      name="description"
                      ref={setFieldRef("description")}
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Mô tả dịch vụ..."
                      className={`${inputClass} ${errors.description ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                    />
                    {errors.description && <p className="mt-1 text-xs font-medium text-red-500">{errors.description}</p>}
                  </div>
                  <div>
                    <label className={labelClass}><RequiredLabel>Ảnh</RequiredLabel></label>
                    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Ảnh từ máy</p>
                          <input
                            id="service-image-upload-edit"
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="service-image-upload-edit"
                            ref={setFieldRef("images")}
                            tabIndex={-1}
                            className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-md"
                          >
                            Upload file
                          </label>
                          {imageFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {imageFiles.map((file, index) => (
                                <div
                                  key={`${file.name}-${file.lastModified}-${index}`}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm text-gray-600"
                                >
                                  <span className="min-w-0 truncate">
                                    {index === 0 ? " " : ""}{file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeImageFile(index)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                    aria-label="Xóa ảnh"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* <p className="mt-3 text-sm text-gray-500">
                            {imageFile ? imageFile.name : "Giữ ảnh hiện tại nếu không chọn ảnh mới"}
                          </p> */}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">Ảnh từ link</p>
                          <textarea
                            name="images"
                            ref={setFieldRef("images")}
                            value={formData.images}
                            onChange={handleImagesChange}
                            rows="3"
                            placeholder="URL_IMAGE"
                            className={`${inputClass} mt-3 ${errors.images ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                          />
                          {errors.images && <p className="mt-1 text-xs font-medium text-red-500">{errors.images}</p>}
                          {/* <p className="mt-2 text-xs text-gray-500">
                            Ảnh đầu tiên sẽ là thumbnail của dịch vụ, các ảnh còn lại sẽ hiện khi bấm xem thêm ảnh.
                          </p> */}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Điểm nổi bật</label>
                      <textarea
                        name="highlights"
                        ref={setFieldRef("highlights")}
                        value={formData.highlights}
                        onChange={handleChange}
                        rows="4"
                        className={`${inputClass} ${errors.highlights ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                      />
                      {errors.highlights && <p className="mt-1 text-xs font-medium text-red-500">{errors.highlights}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Bao gồm</label>
                      <textarea
                        name="includes"
                        ref={setFieldRef("includes")}
                        value={formData.includes}
                        onChange={handleChange}
                        rows="4"
                        className={`${inputClass} ${errors.includes ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                      />
                      {errors.includes && <p className="mt-1 text-xs font-medium text-red-500">{errors.includes}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Lịch trình Excel</label>
                    <input
                      type="file"
                      ref={(element) => {
                        itineraryInputRef.current = element;
                        setFieldRef("itineraryFile")(element);
                      }}
                      accept=".xlsx,.xls,.csv"
                      onChange={handleItineraryFileChange}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-600 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                    {itineraryFile && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm text-gray-600">
                        <span className="min-w-0 truncate">{itineraryFile.name}</span>
                        <button
                          type="button"
                          onClick={removeItineraryFile}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Xóa file Excel"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Chọn file Excel nếu muốn cập nhật lại lịch trình, nếu không thì giữ nguyên lịch trình cũ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => (isModal ? onClose?.() : navigate("/provider/services"))}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 font-semibold text-white transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServices;
