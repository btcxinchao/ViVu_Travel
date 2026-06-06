import { useEffect, useState } from "react";
import { jwt } from "./jwt.js";

export const AUTH_CHANGED_EVENT = "vivu-auth-changed";

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getStoredAccessToken = () =>
  localStorage.getItem("accessToken") || "";

export const getStoredCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
};

export const saveAuth = (accessToken, user) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("currentUser", JSON.stringify(user));
  notifyAuthChanged();
};

export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
  notifyAuthChanged();
};

const getAuthSnapshot = () => ({
  accessToken: getStoredAccessToken(),
  currentUser: getStoredCurrentUser(),
  user: jwt(),
});

export const useAuthStorage = () => {
  const [auth, setAuth] = useState(getAuthSnapshot);

  useEffect(() => {
    const refreshAuth = () => setAuth(getAuthSnapshot());

    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("storage", refreshAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  return auth;
};
