export const apiCall = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const contentType = response.headers.get("content-type");
        let data = null;

        const text = await response.text();
        if (contentType && contentType.includes("application/json")) {
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("JSON Parse Error:", e, "Text:", text);
                data = { message: "Invalid JSON response from server" };
            }
        } else {
            data = { message: text || response.statusText };
        }

        if (!response.ok) {
            const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error("API Call Error:", error);
        throw error;
    }
};
