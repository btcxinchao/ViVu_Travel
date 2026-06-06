import React from "react";
import { FaLocationDot } from "react-icons/fa6";
import { CiLogin } from "react-icons/ci";
import { Link } from "react-router-dom";
const HeadrAdmin = () => {
    return (
        <div className="bg-black">
            <header className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 justify-between bg-black">
                {/* Logo */}
                <div className="flex h-16 items-center justify-center">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#f59e0b] flex items-center justify-center text-white">
                            <FaLocationDot />
                        </div>

                        <span className="text-xl font-bold">
                            <span className="text-white">ViVu</span>
                            <span className="text-[#f97316]">Travel</span>
                        </span>
                    </Link>
                </div>

                {/* Menu */}

                <div className="flex justify-between items-center gap-3 ">
                    
                    <button

                    className="flex items-center gap-1.5 px-2 py-2 text-muted-foreground hover:text-[#ef4444] transition-colors"
                >
                    <CiLogin />
                    Đăng Xuất
                </button>
                </div>

                
            </header>
        </div>
    );
};

export default HeadrAdmin;
