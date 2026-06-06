function CustomBtnDestination({ title, icon, active, onClick, size = "medium" }) {

    // 🎯 size config
    const sizeClass = size === "large"
        ? "px-5 py-3 text-[14px] rounded-2xl"
        : "px-3 py-1.5 text-[12px] rounded-full";

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 font-medium whitespace-nowrap transition-all border
            ${sizeClass}
            ${active
                    ? "bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white border-transparent shadow-md"
                    : "text-gray-600 border-gray-200 hover:border-[#f97316]/50 hover:text-[#f97316]"
                }`}
        >
            <span className={`transition ${active ? "scale-110" : "group-hover:scale-110"}`}>
                {icon ? icon : ""}
            </span>
            {title}
        </button>
    );
}

export default CustomBtnDestination;