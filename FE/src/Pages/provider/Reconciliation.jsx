import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../../Components/shared/Breadcrumb.jsx";
import { FaSearch } from "react-icons/fa";

const fmtVND = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

const formatVnpayDateTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^\d{14}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(8, 10);
    const minute = raw.slice(10, 12);
    const second = raw.slice(12, 14);

    return {
      date: `${day}/${month}/${year}`,
      time: `${hour}:${minute}:${second}`,
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    date: parsed.toLocaleDateString("vi-VN"),
    time: parsed.toLocaleTimeString("vi-VN", { hour12: false }),
  };
};

const getOrderCode = (order) =>
  order?.orderCode ||
  `OD${String(order?._id || order?.id || "")
    .replace(/\D/g, "")
    .slice(-4)
    .padStart(4, "0")}`;

const getCustomerName = (order) =>
  order?.customerInfo?.name ||
  order?.customerInfo?.fullName ||
  order?.userId?.fullName ||
  "Khách hàng";

const getPaymentStatusMeta = (paymentStatus) => {
  switch (paymentStatus) {
    case "paid":
      return {
        label: "Đã thanh toán",
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "refunded":
      return {
        label: "Đã hoàn tiền",
        cls: "bg-blue-50 text-blue-700 border border-blue-200",
      };
    case "failed":
      return {
        label: "Thất bại",
        cls: "bg-red-50 text-red-600 border border-red-200",
      };
    default:
      return {
        label: "Chờ thanh toán",
        cls: "bg-amber-50 text-amber-700 border border-amber-200",
      };
  }
};

const bankNameMap = {
  VCB: "Vietcombank",
  BIDV: "BIDV",
  CTG: "VietinBank",
  TCB: "Techcombank",
  ACB: "ACB",
  MBB: "MBBank",
  VPB: "VPBank",
  TPB: "TPBank",
  STB: "Sacombank",
  VIB: "VIB",
  SHB: "SHB",
  HDB: "HDBank",
};

function Reconciliation() {
  const [providerOrders, setProviderOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const accessToken = localStorage.getItem("accessToken");

  const fetchProviderOrders = async () => {
    const res = await fetch("/api/orders/provider", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Khong the tai danh sach don hang");
    }
    setProviderOrders(Array.isArray(result.data) ? result.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await fetchProviderOrders();
      } catch (err) {
        setError(err?.message || "Khong the tai du lieu doi soat");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const reconciliationRows = useMemo(
    () =>
      [...providerOrders]
        .sort((a, b) =>
          String(
            b?.paymentInfo?.payDate || b?.paidAt || b?.createdAt || "",
          ).localeCompare(
            String(a?.paymentInfo?.payDate || a?.paidAt || a?.createdAt || ""),
          ),
        )
        .map((order) => ({
          id: getOrderCode(order),
          customerName: getCustomerName(order),
          amount: Number(order?.paymentInfo?.amount || order?.totalPrice || 0),
          paymentStatus: order?.paymentStatus || "unpaid",
          bankName:
            bankNameMap[order?.paymentInfo?.bankCode] ||
            order?.paymentInfo?.bankCode ||
            "Chưa có",
          payTime: formatVnpayDateTime(
            order?.paymentInfo?.payDate || order?.paidAt || "",
          ),
          transactionNo: order?.paymentInfo?.transactionNo || "",
        })),
    [providerOrders],
  );

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return reconciliationRows;

    return reconciliationRows.filter((row) => {
      const orderId = String(row.id || "").toLowerCase();
      const transactionNo = String(row.transactionNo || "").toLowerCase();
      const customerName = String(row.customerName || "").toLowerCase();

      return (
        orderId.includes(keyword) ||
        transactionNo.includes(keyword) ||
        customerName.includes(keyword)
      );
    });
  }, [reconciliationRows, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
          <Breadcrumb />
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px",
              fontWeight: "700",
              color: "rgb(26, 26, 46)",
              textAlign: "left",
            }}
          >
            Đối soát thanh toán
          </h1>
        </div>
        <div className="p-4 sm:p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
            Đang tải dữ liệu đối soát...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <Breadcrumb />
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px",
            fontWeight: "700",
            color: "rgb(26, 26, 46)",
            textAlign: "left",
          }}
        >
          Đối soát thanh toán
        </h1>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-[18px] font-semibold text-gray-900">
                Danh sách giao dịch
              </h3>
            </div>
            <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <FaSearch size={14} className="shrink-0 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên khách hàng, mã đơn, mã VNPay"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3">Mã ĐH</th>
                  <th className="px-5 py-3">Mã GD VNPay</th>
                  <th className="px-5 py-3">Tên KH</th>
                  <th className="px-5 py-3">Ngân hàng</th>
                  <th className="px-5 py-3">Ngày</th>
                  <th className="px-5 py-3">Giờ</th>
                  <th className="px-5 py-3">Số tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Không tìm thấy giao dịch phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const paymentMeta = getPaymentStatusMeta(row.paymentStatus);

                    return (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {row.id}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {row.transactionNo || "Chưa có"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {row.customerName}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {row.bankName}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {row.payTime?.date || "Chưa có"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {row.payTime?.time || "Chưa có"}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#f97316]">
                          {fmtVND(row.amount)}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${paymentMeta.cls}`}
                          >
                            {paymentMeta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Reconciliation;
