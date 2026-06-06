import Header from "../Components/shared/Header.jsx";
import Footer from "../Components/shared/Footer.jsx";
import { Outlet } from "react-router-dom";

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
