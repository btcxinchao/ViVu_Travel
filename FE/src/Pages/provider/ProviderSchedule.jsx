import React, { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";
import ProviderScheduleTable from "./ProviderScheduleTable.jsx";
import ScheduleFormModal from "./ScheduleFormModal.jsx";
import DeleteScheduleModal from "./DeleteScheduleModal.jsx";

const STATUS_CONFIG = {
  open: { label: "Mở đăng ký", cls: "bg-green-50 text-green-700" },
  full: { label: "Hết chỗ", cls: "bg-red-50 text-red-600" },
  closed: { label: "Đã đóng", cls: "bg-gray-100 text-gray-500" },
};

const fmtDate = (date) =>
  new Date(date).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.id || "";
  return "";
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const raw = String(value);
  const rawMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (rawMatch) return rawMatch[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const todayInputValue = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const stripUnsafeText = (value) =>
  String(value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .trim();

const parseTourDays = (service) => {
  if (!service) return null;
  if (Number.isFinite(service.itineraryDays) && service.itineraryDays > 0) {
    return service.itineraryDays;
  }

  const duration = String(service.duration || "").toLowerCase();
  const dayMatch = duration.match(/(\d+)\s*(ngay|ngày|day|days)/i);
  if (dayMatch) return Number(dayMatch[1]);

  const firstNumber = duration.match(/\d+/);
  return firstNumber ? Number(firstNumber[0]) : null;
};

export default function ProviderSchedule() {
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form, setForm] = useState({
    serviceId: "",
    departureDate: "",
    endDate: "",
    maxPeople: "",
    note: "",
  });
  const [touchedFields, setTouchedFields] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : null;
  };

  const mapService = (item) => ({
    id: item._id,
    name:
      item.serviceName ||
      item.servicesName ||
      item.ServiceName ||
      "Chưa có tên",
    location:
      item.location || item.destination || item.region || "Chưa cập nhật",
    duration: item.duration || item.tourDuration || "",
    itineraryDays: Array.isArray(item.itinerary) ? item.itinerary.length : null,
  });

  const loadServices = async () => {
    const headers = getAuthHeaders();
    if (!headers) return false;

    const res = await fetch("/api/services/my-services", {
      headers,
    });
    const result = await res.json();

    if (res.ok) {
      const nextServices = (result.data || []).map(mapService);
      setServices(nextServices);
      return nextServices;
    }

    return false;
  };

  const loadSchedules = async (serviceList) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const scheduleResults = await Promise.all(
      serviceList.map(async (service) => {
        const res = await fetch(`/api/schedules/service/${service.id}`, { headers });
        const result = await res.json();
        return res.ok ? result.data || [] : [];
      }),
    );

    setSchedules(scheduleResults.flat());
  };

  useEffect(() => {
    const run = async () => {
      try {
        const serviceList = await loadServices();

        if (!serviceList) {
          setMessage({
            type: "error",
            text: "Không tải được danh sách dịch vụ, vui lòng thử lại sau",
          });
          setLoading(false);
          return;
        }

        await loadSchedules(serviceList);
      } catch (error) {
        setMessage({
          type: "error",
          text: `Lỗi tải dữ liệu: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const getService = (serviceId) => {
    const id = normalizeId(serviceId);
    return services.find((item) => item.id === id) || null;
  };

  const resetForm = () => {
    setForm({
      serviceId: "",
      departureDate: "",
      endDate: "",
      maxPeople: "",
      note: "",
    });
    setTouchedFields({});
    setEditingSchedule(null);
  };

  const markFieldTouched = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const updateForm = (field, value) => {
    markFieldTouched(field);

    if (field === "maxPeople") {
      setForm((prev) => ({ ...prev, [field]: value.replace(/\D/g, "") }));
      return;
    }

    if (field === "note") {
      setForm((prev) => ({ ...prev, [field]: stripUnsafeText(value).slice(0, 500) }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setMessage({ type: "", text: "" });
    setTouchedFields({});
    setForm({
      serviceId: normalizeId(schedule.service_id || schedule.serviceId),
      departureDate: toDateInputValue(schedule.departureDate),
      endDate: toDateInputValue(schedule.endDate),
      maxPeople: String(schedule.maxSlots || schedule.maxPeople || ""),
      note: schedule.note || "",
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setMessage({ type: "", text: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setMessage((prev) =>
      prev.type === "error" ? { type: "", text: "" } : prev,
    );
  };

  const validateScheduleForm = (targetForm = form) => {
    const nextErrors = {};
    const selectedService = getService(targetForm.serviceId);
    const departureDate = targetForm.departureDate;
    const endDate = targetForm.endDate;
    const today = todayInputValue();

    if (!targetForm.serviceId) {
      nextErrors.serviceId = "Vui lòng chọn dịch vụ";
    }

    if (!departureDate) {
      nextErrors.departureDate = "Vui lòng nhập ngày đi";
    } else if (departureDate < today) {
      nextErrors.departureDate = "Ngày đi không được chọn trong quá khứ";
    }

    if (!endDate) {
      nextErrors.endDate = "Vui lòng nhập ngày về";
    } else if (departureDate) {
      const tourDays = parseTourDays(selectedService);
      if (tourDays === 1 && endDate !== departureDate) {
        nextErrors.endDate = "Tour 1 ngày phải có ngày về trùng ngày đi";
      } else if (tourDays !== 1 && endDate <= departureDate) {
        nextErrors.endDate = "Ngày về phải sau ngày đi";
      }
    }

    if (!targetForm.maxPeople) {
      nextErrors.maxPeople = "Vui lòng nhập số chỗ tối đa";
    } else if (!/^[1-9]\d*$/.test(targetForm.maxPeople)) {
      nextErrors.maxPeople = "Số chỗ chỉ được nhập số và phải lớn hơn 0";
    } else if (Number(targetForm.maxPeople) > 500) {
      nextErrors.maxPeople = "Số chỗ tối đa không được vượt quá 500";
    }

    if (targetForm.note.length > 500) {
      nextErrors.note = "Ghi chú không được vượt quá 500 ký tự";
    }

    const hasDuplicate =
      targetForm.serviceId &&
      departureDate &&
      endDate &&
      schedules.some((schedule) => {
        const sameSchedule = editingSchedule?._id && schedule._id === editingSchedule._id;
        if (sameSchedule) return false;

        return (
          normalizeId(schedule.service_id || schedule.serviceId) === targetForm.serviceId &&
          toDateInputValue(schedule.departureDate) === departureDate &&
          toDateInputValue(schedule.endDate) === endDate
        );
      });

    if (hasDuplicate) {
      nextErrors.duplicate = "Lịch trình đã tồn tại";
    }

    return nextErrors;
  };

  const formErrors = showModal ? validateScheduleForm(form) : {};
  const visibleErrors = Object.fromEntries(
    Object.entries(formErrors).filter(([field]) => {
      if (field === "duplicate") {
        return Boolean(form.serviceId && form.departureDate && form.endDate);
      }

      return Boolean(touchedFields[field]);
    }),
  );
  const isFormValid = showModal && Object.keys(formErrors).length === 0;

  const handleSaveSchedule = async () => {
    const nextErrors = validateScheduleForm();
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.duplicate || Object.values(nextErrors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });

      const isEdit = Boolean(editingSchedule?._id);
      const endpoint = isEdit
        ? `/api/schedules/${editingSchedule._id}`
        : "/api/schedules";

      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          serviceId: form.serviceId,
          service_id: form.serviceId,
          departureDate: form.departureDate,
          endDate: form.endDate,
          maxSlots: Number(form.maxPeople),
          status: editingSchedule?.status || "open",
          note: stripUnsafeText(form.note),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || (isEdit ? "Không thể cập nhật lịch khởi hành" : "Không thể thêm lịch khởi hành"));
        return;
      }

      toast.success(isEdit ? "Cập nhật lịch khởi hành thành công" : "Thêm lịch khởi hành thành công");
      await loadSchedules(services);
      closeModal();
    } catch (error) {
      toast.error(`Lỗi khi lưu lịch: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => handleSaveSchedule();

  const handleToggleStatus = async (schedule) => {
    if (!schedule?._id) {
      setMessage({ type: "error", text: "Không tìm thấy lịch cần cập nhật" });
      return;
    }

      const nextStatus = schedule.status === "open" ? "closed" : "open";

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });

      const res = await fetch(
        `/api/schedules/${schedule._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            serviceId: normalizeId(schedule.service_id || schedule.serviceId),
            service_id: normalizeId(schedule.service_id || schedule.serviceId),
            departureDate: toDateInputValue(schedule.departureDate),
            endDate: toDateInputValue(schedule.endDate),
            maxSlots: Number(schedule.maxSlots || schedule.maxPeople || 0),
            note: schedule.note || "",
            status: nextStatus,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Không thể cập nhật trạng thái lịch");
        return;
      }

      setSchedules((prev) =>
        prev.map((item) =>
          item._id === schedule._id ? { ...item, status: nextStatus } : item,
        ),
      );

      toast.success(
        nextStatus === "open"
          ? "Đã mở lại lịch khởi hành"
          : "Đã đóng lịch khởi hành",
      );
    } catch (error) {
      toast.error(`Lỗi khi cập nhật trạng thái: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteTarget?._id) {
      setMessage({ type: "error", text: "Không tìm thấy lịch cần xóa" });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });

      const res = await fetch(
        `/api/schedules/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Không thể xóa lịch khởi hành");
        return;
      }

      toast.success("Xóa lịch khởi hành thành công");
      setSchedules((prev) =>
        prev.filter((item) => item._id !== deleteTarget._id),
      );
      setDeleteTarget(null);
    } catch (error) {
      toast.error(`Lỗi khi xóa lịch: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteScheduleName = useMemo(() => {
    if (!deleteTarget) return "Lịch khởi hành";
    const service = getService(deleteTarget.service_id || deleteTarget.serviceId);
    return `${service?.name || "Dịch vụ"} - ${new Date(deleteTarget.departureDate).toLocaleDateString("vi-VN")}`;
  }, [deleteTarget, services]);

  if (loading) {
    return <div className="p-4 text-gray-500">Đang tải lịch khởi hành...</div>;
  }

  return (
    <div className="space-y-6">
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
              Quản lý lịch khởi hành
            </h1>
          </div>
        </div>

      </div>

      {message.text ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-[13px] ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-green-200 bg-green-50 text-green-700"
          } mx-4 sm:mx-6`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mx-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mx-6 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[18px] font-semibold text-gray-900">
            Danh sách lịch khởi hành
          </h2>

          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-5 text-sm font-semibold text-[#f97316] transition hover:bg-orange-100"
          >
            <span className="inline-flex items-center gap-2">
              <FiPlus size={16} /> Thêm lịch khởi hành
            </span>
          </button>
        </div>

        <ProviderScheduleTable
          schedules={schedules}
          getService={getService}
          fmtDate={fmtDate}
          statusConfig={STATUS_CONFIG}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
          onDelete={setDeleteTarget}
        />

      </div>

      <ScheduleFormModal
        open={showModal}
        isEdit={!!editingSchedule}
        services={services}
        form={form}
        isSubmitting={isSubmitting}
        errors={visibleErrors}
        canSubmit={isFormValid}
        minDate={todayInputValue()}
        onClose={closeModal}
        onChange={updateForm}
        onBlur={markFieldTouched}
        onSubmit={handleSubmit}
      />

      <DeleteScheduleModal
        open={!!deleteTarget}
        scheduleName={deleteScheduleName}
        isSubmitting={isSubmitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSchedule}
      />
    </div>
  );
}
