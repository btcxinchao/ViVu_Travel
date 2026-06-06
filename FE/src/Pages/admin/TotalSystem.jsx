import React, { useEffect, useState } from "react";
import { FiBox } from "react-icons/fi";
import { IoCheckmarkCircleOutline, IoPeopleOutline, IoTicketOutline } from "react-icons/io5";

const TotalSystem = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch("/api/stats/admin", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await res.json();

        if (res.ok) {
          setStats(result.data || null);
        } else {
          setError(result.message || "Không thể tải thống kê");
        }
      } catch (err) {
        setError("Không thể tải thống kê");
      }
    };

    fetchStats();
  }, []);

  const totalServices = Array.isArray(stats?.serviceStats)
    ? stats.serviceStats.reduce((sum, item) => sum + (item.count || 0), 0)
    : 0;
  const totalAccounts = Array.isArray(stats?.userStats)
    ? stats.userStats.reduce((sum, item) => sum + (item.count || 0), 0)
    : 0;
  const pendingServices = Array.isArray(stats?.serviceStats)
    ? stats.serviceStats.find((item) => item._id === "pending")?.count || 0
    : 0;
  const totalOrders = Number(stats?.totalOrders || 0);
  const totalRevenue = Number(stats?.totalRevenue || 0);
  const totalReviews = Number(stats?.totalReviews || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-left text-xl font-semibold text-slate-900">
          Tổng quan hệ thống
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-sky-50 p-5">
          <FiBox className="text-2xl text-sky-500 mb-3" />
          <p className="text-left mt-4 text-3xl font-bold mb-3 text-slate-900">{totalServices || "--"}</p>
          <p className="text-left text-sm text-slate-500 mb-3">Tổng dịch vụ</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-5 ">
          <IoPeopleOutline className="text-2xl text-emerald-500 mb-3" />
          <p className="text-left mb-3 mt-4 text-3xl font-bold text-slate-900">{totalAccounts || "--"}</p>
          <p className="text-left text-sm text-slate-500">Tổng tài khoản</p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-5">
          <IoTicketOutline className="text-2xl text-orange-500 mb-3" />
          <p className="text-left mb-3 mt-4 text-3xl font-bold text-slate-900">{totalOrders || "--"}</p>
          <p className="text-left mb-3 text-sm text-slate-500">Tổng đơn hàng</p>
        </div>

        <div className="rounded-2xl bg-rose-50 p-5 ">
          <IoCheckmarkCircleOutline className="text-2xl text-rose-500 mb-3" />
          <p className="text-left mb-3 mt-4 text-3xl font-bold text-slate-900">{pendingServices || "--"}</p>
          <p className="text-left mb-3 text-sm text-slate-500">Chờ xử lý</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-left text-sm font-semibold text-slate-900">Doanh thu</h3>
          <p className="text-left mt-3 text-3xl font-bold text-orange-500 p-2">
            {totalRevenue ? totalRevenue.toLocaleString("vi-VN") + "đ" : "--"}
          </p>
          <p className="text-left mt-2 text-sm text-slate-400">Doanh thu trong tháng</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-left text-sm font-semibold text-slate-900">Đánh giá</h3>
          <p className="text-left mt-3 text-3xl font-bold text-orange-500 p-2">{totalReviews || "--"}</p>
          <p className="text-left mt-2 text-sm text-slate-400">Tổng số lượng đánh giá</p>
        </div>
      </div>

      <div className="text-left rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-400">
        Dịch vụ đang chờ được xử lý
      </div>
    </div>
  );
};

export default TotalSystem;
