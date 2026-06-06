import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout.jsx";
import LayoutAdmin from "../layout/LayoutAdmin.jsx";
import HomePage from "../Pages/client/HomePage.jsx";
import SignIn from "../Pages/Auth/SignIn.jsx";
import Register from "../Pages/Auth/Register.jsx";
import RegisterProvider from "../Pages/Auth/RegisterProvider.jsx";
import ForgotPassword from "../Pages/Auth/ForgotPassword.jsx";
import ResetPassword from "../Pages/Auth/ResetPassword.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Services from "../Pages/provider/Services.jsx";
import DashboardAdmin from "../Pages/admin/DashboardAdmin.jsx";
import AddServices from "../Pages/provider/AddServices.jsx";
import EditServices from "../Pages/provider/EditServices.jsx";
import ServicesDetail from "../Pages/provider/ServicesDetail.jsx";
import Destination from "../Pages/client/Destination.jsx";
import About from "../Pages/client/About.jsx";
import Contact from "../Pages/client/Contact.jsx";
import UserDashboard from "../Pages/client/UserDashboard.jsx";
import ProviderSchedule from "../Pages/provider/ProviderSchedule.jsx";
import Booking from "../Pages/provider/Booking.jsx";
import Revenue from "../Pages/provider/Revenue.jsx";
import Reconciliation from "../Pages/provider/Reconciliation.jsx";
import Coupons from "../Pages/provider/Coupons.jsx";
import BookingConfirm from "../Pages/client/BookingConfirm.jsx";
import ServiceManagement from "../Pages/admin/ServiceManagement.jsx";
import AccountManagement from "../Pages/admin/AccountManagement.jsx";
import BookingManagement from "../Pages/admin/BookingManagement.jsx";
import DetailServices from "../Pages/client/DetailServers.jsx";
import Error404 from "../Pages/client/Error404.jsx";
import ProviderLayout from "../layout/ProviderLayout.jsx";
import { useAuthStorage } from "../utils/authStorage.js";

function Routers() {
  const { user } = useAuthStorage();
  const isStaff = user?.role === "admin" || user?.role === "provider";
  const homePath = user?.role === "admin" ? "/admin" : user?.role === "provider" ? "/provider" : "/";

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={isStaff ? <Navigate to={homePath} replace /> : <HomePage />} />
        <Route path="/signin" element={user ? <Navigate to={homePath} replace /> : <SignIn />} />
        <Route path="/register" element={user ? <Navigate to={homePath} replace /> : <Register />} />
        <Route
          path="/provider-register"
          element={
            !user ? (
              <Navigate to="/signin" replace />
            ) : user.role === "user" ? (
              <RegisterProvider />
            ) : (
              <Navigate to={homePath} replace />
            )
          }
        />
        <Route path="/forgot-password" element={user ? <Navigate to={homePath} replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={user ? <Navigate to={homePath} replace /> : <ResetPassword />} />
        <Route path="/destination" element={isStaff ? <Navigate to={homePath} replace /> : <Destination />} />
        <Route path="/about" element={isStaff ? <Navigate to={homePath} replace /> : <About />} />
        <Route path="/contact" element={isStaff ? <Navigate to={homePath} replace /> : <Contact />} />
        <Route path="/404" element={isStaff ? <Navigate to={homePath} replace /> : <Error404 />} />
        <Route path="/services/:id" element={isStaff ? <Navigate to={homePath} replace /> : <DetailServices />} />
        <Route path="/DetailServices" element={isStaff ? <Navigate to={homePath} replace /> : <DetailServices />} />
      </Route>

      <Route element={<ProtectedRoute roles={["user"]} />}>
        <Route path="/user" element={<PublicLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
        </Route>
        <Route path="/booking" element={<PublicLayout />}>
          <Route path="confirm/:serviceId" element={<BookingConfirm />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<LayoutAdmin />}>
          <Route index element={<DashboardAdmin />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="revenue" element={<DashboardAdmin initialTab="revenue" />} />
          <Route path="Revenue" element={<Navigate to="revenue" replace />} />
          <Route path="servicemanager" element={<ServiceManagement />} />
          <Route path="ServiceManager" element={<Navigate to="servicemanager" replace />} />
          <Route path="accountmanager" element={<AccountManagement />} />
          <Route path="AccountManager" element={<Navigate to="accountmanager" replace />} />
          <Route path="bookingmanager" element={<BookingManagement />} />
          <Route path="BookingManager" element={<Navigate to="bookingmanager" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["provider"]} />}>
        <Route path="/provider" element={<ProviderLayout />}>
          <Route index element={<Revenue />} />
          <Route path="dashboard" element={<Navigate to="/provider/revenue" replace />} />
          <Route path="services" element={<Services />} />
          <Route path="Services" element={<Navigate to="services" replace />} />
          <Route path="addservices" element={<AddServices />} />
          <Route path="AddServices" element={<Navigate to="addservices" replace />} />
          <Route path="editservices/:id" element={<EditServices />} />
          <Route path="EditServices/:id" element={<EditServices />} />
          <Route path="detailservices/:id" element={<ServicesDetail />} />
          <Route path="DetailServices/:id" element={<ServicesDetail />} />
          <Route path="schedule" element={<ProviderSchedule />} />
          <Route path="Schedule" element={<Navigate to="schedule" replace />} />
          <Route path="booking" element={<Booking />} />
          <Route path="Booking" element={<Navigate to="booking" replace />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="Revenue" element={<Navigate to="revenue" replace />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="Reconciliation" element={<Navigate to="reconciliation" replace />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="Coupons" element={<Navigate to="coupons" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default Routers;
