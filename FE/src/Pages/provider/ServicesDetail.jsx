import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ButtonBack from "../../Components/shared/ButtonBack";

const FALLBACK_IMAGE = "/images/service-placeholder.svg";

const ServicesDetail = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`/api/services/detail/${id}`, {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {},
        });
        const result = await res.json();
        setService(res.ok ? result.data : null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <p className="p-6">Đang tải chi tiết...</p>;
  if (!service) return <p className="p-6 text-red-600">không tìm thấy dịch vụ</p>;

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-8">
      <div className="mx-auto w-full max-w-6xl rounded-xl border border-orange-100 bg-white p-12 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h1 className="text-center text-3xl font-bold text-orange-600">Chi tiết dịch vụ</h1>
          <ButtonBack />
        </div>

        <form className="space-y-6">
          <div>
            <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Nhà cung cấp</label>
            <input type="text" value={service.nameProvider || service.provider_id?.fullName || service.supplier || ""} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Tên dịch vụ</label>
              <input type="text" value={service.serviceName || service.servicesName || ""} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
            </div>
            <div>
              <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Giá</label>
              <input type="text" value={`${service.prices} VNĐ`} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Địa điểm</label>
              <input type="text" value={service.location || service.destination || service.region || ""} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
            </div>
            <div>
              <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Danh mục</label>
              <input type="text" value={Array.isArray(service.category) ? service.category.join(", ") : service.category || ""} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
            </div>
          </div>

          <div>
            <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Mô tả</label>
            <textarea value={service.description || service.descriptionDetail || ""} readOnly rows="4" className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3" />
          </div>

          <div>
            <label className="block pl-1.5 text-left text-sm font-semibold text-orange-600">Hình ảnh</label>
            <img
              src={service.imageUrl || (service.imageFile ? `/uploads/${service.imageFile}` : FALLBACK_IMAGE)}
              alt={service.serviceName || service.servicesName || "service-image"}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="mx-auto h-64 w-full max-w-md rounded border-2 border-orange-200 object-cover"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesDetail;
