// src/components/AddServiceButton.jsx
import React from "react";
import { Link } from "react-router-dom";

const AddServiceButton = () => {
  return (
    <button
      
      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
    >
      + Thêm dịch vụ
    </button>
  );
};

export default AddServiceButton;