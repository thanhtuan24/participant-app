import { UNAUTHORIZED } from "@constants";
import { BASE_URL, HTTP_FUNCTION_URL } from "@constants/common";
import { ResData, ResHTTP } from "@dts";
import { useStore as store } from "@store";
import { getToken } from "./zalo";

interface FetchOptions {
    useAuth?: boolean;
    baseUrl?: string;
    customHeader?: Record<string, string>;
}

export async function request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: Record<string, any>,
    options?: FetchOptions,
    retryCount = 0,
): Promise<T> {
    const { useAuth = true, baseUrl = BASE_URL } = options || {};
    const headers = new Headers();
    const { token } = store.getState();

    if (useAuth && token) {
        headers.append("Authorization", `Bearer ${token}`);
    }
    if (options && options.customHeader) {
        const { customHeader } = options;
        Object.entries(customHeader).forEach(([key, value]) => {
            headers.append(key, value);
        });
    }
    const requestUrl = new URL(url, baseUrl);
    const requestOptions: RequestInit = {
        method,
        headers,
    };

    if (method === "GET" && data) {
        requestUrl.search = new URLSearchParams(data).toString();
    } else if (data) {
        headers.append("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(data);
    }
    const response = await fetch(requestUrl.toString(), requestOptions);

    const resData = (await response.json()) as ResData<T>;
    if (resData.err === UNAUTHORIZED && retryCount === 0 && useAuth && token) {
        try {
            const accessToken = await getToken();
            store.setState(state => ({ ...state, token: accessToken }));
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : String(err));
        }
    }
    if (resData.err || !resData.data) {
        const error = new Error(resData.message || "Unknown Error");
        (error as any).code = resData.err;
        throw error;
    }
    return resData.data;
}

export async function requestParticipant<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: Record<string, any>,
    options?: FetchOptions,
): Promise<T> {
    const headers = new Headers();
    if (options && options.customHeader) {
        const { customHeader } = options;
        Object.entries(customHeader).forEach(([key, value]) => {
            headers.append(key, value);
        });
    }
    const requestUrl = new URL(url);
    const requestOptions: RequestInit = {
        method,
        headers,
    };

    if (method === "GET" && data) {
        requestUrl.search = new URLSearchParams(data).toString();
    } else if (data) {
        headers.append("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(requestUrl.toString(), requestOptions);
    let resData: any;
    try {
        resData = await response.json();
    } catch {
        throw new Error(`HTTP ${response.status}: Invalid response`);
    }
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || `HTTP ${response.status}`);
    }
    return resData as unknown as T;
}

export const fetchRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const baseUrl = BASE_URL || HTTP_FUNCTION_URL;
    // Ensure we use a valid base URL. If baseUrl is undefined, new URL() might throw or create an invalid URL depending on environment.
    // Given HTTP_FUNCTION_URL is hardcoded in common.ts, this should be safe.
    const url = new URL(endpoint, baseUrl);

    const response = await fetch(url.toString(), {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};
