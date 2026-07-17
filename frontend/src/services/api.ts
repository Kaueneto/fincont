const BASE_URL = "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Erro ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

export const api = {
    get:    <T>(path: string)                  => request<T>(path),
    post:   <T>(path: string, body: unknown)   => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown)   => request<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
    patch:  <T>(path: string, body?: unknown)  => request<T>(path, { method: "PATCH",  body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string)                  => request<T>(path, { method: "DELETE" }),
};
