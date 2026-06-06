import { jwtDecode } from "jwt-decode";

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
};

export const jwt = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    localStorage.removeItem("currentUser");
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    // check expire
    if (decoded.exp * 1000 < Date.now()) {
      clearAuthStorage();
      return null;
    }

    return decoded;
  } catch {
    clearAuthStorage();
    return null;
  }
};
