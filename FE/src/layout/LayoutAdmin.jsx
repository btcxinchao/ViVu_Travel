import Header from "../Components/shared/Header.jsx";
import Sidebar from "../Components/shared/Sidebar.jsx";
import { Outlet } from "react-router-dom";
import { jwt } from "../utils/jwt.js";

function LayoutAdmin() {
  const user = jwt();
  const showSidebar = user?.role === "provider";

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="dashboard" />

      <main className="flex flex-1 w-full">
        {showSidebar && <Sidebar />}

        <div className="flex-1 bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default LayoutAdmin;
