function DetailBannerService({
  imageUrl = "",
  serviceName = "",
  category = "",
  duration = "",
  location = "",
  nameProvider = "",
}) {
  const categoryText = Array.isArray(category)
    ? category[0]?.categoryName || category[0] || ""
    : typeof category === "object" && category
      ? category.categoryName || ""
      : category;

  return (
    <div className="relative h-72 overflow-hidden md:h-[440px]">
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl p-6 md:p-10">
        <a
          href="/destination"
          className="mb-4 block text-white/70 hover:text-white"
        >
          ← Quay lại
        </a>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          {categoryText ? (
            <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
              {categoryText}
            </span>
          ) : null}
          {duration ? (
            <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
              {duration}
            </span>
          ) : null}
        </div>

        <h1 className="text-2xl font-bold text-white">{serviceName}</h1>

        <div className="mt-2 text-white/80">
          {location} • Bởi {nameProvider}
        </div>
      </div>
    </div>
  );
}

export default DetailBannerService;
