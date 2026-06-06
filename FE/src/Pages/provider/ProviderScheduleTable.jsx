import React from "react";
import { FiEdit2, FiLock, FiMapPin, FiTrash2, FiUnlock } from "react-icons/fi";

function CapacityCell({ booked, max }) {
  const pct = max > 0 ? Math.round((booked / max) * 100) : 0;

  return (
    <div className="flex min-w-[120px] items-center gap-3">
      <span className="font-semibold text-gray-700">
        {booked}/{max}
      </span>
    </div>
  );
}

export default function ProviderScheduleTable({
  schedules,
  getService,
  fmtDate,
  statusConfig,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontSize: 14 }}>
        <thead>
          <tr className="border-b border-gray-200">
            <th
              className="px-3 py-3 text-left text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Dịch vụ
            </th>
            <th
              className="px-3 py-3 text-left text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Ngày khởi hành
            </th>
            <th
              className="px-3 py-3 text-left text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Ngày kết thúc
            </th>
            <th
              className="px-3 py-3 text-left text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Chỗ đặt
            </th>
            <th
              className="w-[140px] px-3 py-3 text-center text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Trạng thái
            </th>
            <th
              className="w-[120px] px-3 py-3 text-center text-gray-500"
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {schedules.map((schedule) => {
            const service = getService(
              schedule.service_id || schedule.serviceId,
            );
            const st = statusConfig[schedule.status] || statusConfig.open;

            return (
              <tr
                key={schedule._id}
                className="border-b border-gray-100 transition-colors hover:bg-[#f8fafc]"
              >
                <td className="px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-left font-medium">
                      {service?.name || "?"}
                    </p>
                    <p className="flex items-center gap-1 text-[12px] text-gray-400">
                      <FiMapPin size={11} />
                      {service?.location || "?"}
                    </p>
                  </div>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <p className="font-medium text-gray-800">
                    {fmtDate(schedule.departureDate)}
                  </p>
                </td>

                <td className="whitespace-nowrap px-3 py-3">
                  <p className="font-medium text-gray-800">
                    {schedule.endDate ? fmtDate(schedule.endDate) : "—"}
                  </p>
                </td>

                <td className="px-3 py-3">
                  <CapacityCell
                    booked={schedule.bookedSlots || 0}
                    max={schedule.maxSlots || schedule.maxPeople || 0}
                  />
                </td>

                <td className="w-[140px] px-3 py-3 text-center">
                  <span
                    className={`inline-flex min-w-[86px] justify-center rounded-full px-2 py-1 ${st.cls}`}
                    style={{ fontSize: 12, fontWeight: 500 }}
                  >
                    {st.label}
                  </span>
                </td>

                <td className="w-[120px] px-3 py-3">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onEdit(schedule)}
                      className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                      title="Sửa"
                      type="button"
                    >
                      <FiEdit2 size={16} />
                    </button>

                    <button
                      onClick={() => onToggleStatus(schedule)}
                      className={`rounded-lg p-1.5 transition ${
                        schedule.status === "open"
                          ? "text-amber-500 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={schedule.status === "open" ? "Đóng bán" : "Mở bán"}
                      type="button"
                    >
                      {schedule.status === "open" ? (
                        <FiLock size={16} />
                      ) : (
                        <FiUnlock size={16} />
                      )}
                    </button>

                    <button
                      onClick={() => onDelete(schedule)}
                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                      title="Xóa"
                      type="button"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {schedules.length === 0 ? (
        <p className="py-10 text-center text-gray-400">
          Chưa có lịch khởi hành nào
        </p>
      ) : null}
    </div>
  );
}
