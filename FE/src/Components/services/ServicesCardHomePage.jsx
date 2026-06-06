function ServicesCardHomePage({ servers, index }) {
    const price = Number(servers?.prices || servers?.price || 0);

    return (
        <div id={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-6">

            <div className="rounded-2xl overflow-hidden shadow hover:shadow-lg transition">
                <img
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
                    alt=""
                    className="h-48 w-full object-cover"
                />

                <div className="p-4 text-left">
                    <h3 className="font-semibold">{servers?.ServiceName || "Check"}</h3>
                    <p className="text-gray-500 text-sm">Quảng Ninh</p>
                    <p className="text-[#f97316] font-semibold mt-2">
                        {price > 0 ? `${price.toLocaleString("vi-VN")} VNĐ` : "Liên hệ"}
                    </p>
                </div>
            </div>

        </div>
    );
}

export default ServicesCardHomePage;
