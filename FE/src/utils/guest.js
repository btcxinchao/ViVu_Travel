const GUEST_ID_STORAGE_KEY = "guestId";

const createGuestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest_${crypto.randomUUID()}`;
  }

  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateGuestId = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return "";
  }

  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const guestId = createGuestId();
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
  return guestId;
};

export const buildTrackingHeaders = (accessToken = "") => {
  const guestId = getOrCreateGuestId();
  const headers = {
    "x-guest-id": guestId,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

export const getGuestId = () => getOrCreateGuestId();
