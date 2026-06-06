import axios from "axios";
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

async function CustomApi({ Url, method = 'GET', data = {}, params = {}, headers = {} }) {
    try {
        const res = await axios({
            url: `${API_BASE}${Url}`,
            method,
            data,
            params,
            headers,
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error.response?.data || error;
    }
}

export default CustomApi;
