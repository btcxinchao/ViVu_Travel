import { Navigate, Outlet } from "react-router-dom";
import { useAuthStorage } from "../utils/authStorage.js";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuthStorage();

  if (!user) return <Navigate to="/signin" replace />;

  if (
    roles &&
    !roles.some((role) => role.toLowerCase() === String(user.role).toLowerCase())
  ) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}
