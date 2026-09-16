// Cliente compatible con la interfaz mínima de PocketBase que usa esta app
// (pb.collection(name).getFullList/getOne/getList/create/update/delete/authWithPassword,
// pb.authStore.{record,token,isValid,onChange,clear}), pero respaldado por la API en
// C# (apps/api) + SQL Server, no por PocketBase.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';
const STORAGE_KEY = 'cctv_auth';

class AuthStore {
    constructor() {
        this._listeners = [];
        this._token = '';
        this._record = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this._token = parsed.token || '';
                this._record = parsed.record || null;
            }
        } catch (_) { /* ignore corrupted storage */ }
    }

    get token() { return this._token; }
    get record() { return this._record; }
    get isValid() { return !!this._token && !!this._record; }

    save(token, record) {
        this._token = token || '';
        this._record = record || null;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: this._token, record: this._record }));
        } catch (_) { /* ignore */ }
        this._listeners.forEach((cb) => cb(this._token, this._record));
    }

    clear() {
        this._token = '';
        this._record = null;
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
        this._listeners.forEach((cb) => cb(this._token, this._record));
    }

    onChange(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter((cb) => cb !== callback);
        };
    }
}

const authStore = new AuthStore();
const inflight = new Map();

class ApiError extends Error {
    constructor(status, data) {
        super(data?.message || `Request failed with status ${status}`);
        this.status = status;
        this.response = data || {};
    }
}

async function apiFetch(path, { method = 'GET', body, requestKey } = {}) {
    let signal;
    if (requestKey) {
        inflight.get(requestKey)?.abort();
        const controller = new AbortController();
        inflight.set(requestKey, controller);
        signal = controller.signal;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;

    let res;
    try {
        res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal,
        });
    } catch (err) {
        if (err?.name === 'AbortError') {
            const abortErr = new Error('Request cancelled');
            abortErr.status = 0;
            abortErr.isAbort = true;
            throw abortErr;
        }
        throw err;
    } finally {
        if (requestKey) inflight.delete(requestKey);
    }

    const contentType = res.headers.get('Content-Type') || '';
    const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

    if (!res.ok) throw new ApiError(res.status, data);
    return data;
}

function qs(params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') search.set(k, v);
    });
    const s = search.toString();
    return s ? `?${s}` : '';
}

function collection(name) {
    const base = `/api/collections/${name}/records`;

    return {
        async getList(page = 1, perPage = 200, options = {}) {
            return apiFetch(`${base}${qs({ page, perPage, sort: options.sort, filter: options.filter, expand: options.expand })}`, {
                requestKey: options.requestKey,
            });
        },

        async getFullList(options = {}) {
            const perPage = 200;
            let page = 1;
            let items = [];
            for (;;) {
                const res = await this.getList(page, perPage, options);
                items = items.concat(res.items);
                if (page >= res.totalPages || res.items.length === 0) break;
                page += 1;
            }
            return items;
        },

        async getOne(id, options = {}) {
            return apiFetch(`${base}/${id}${qs({ expand: options.expand })}`, { requestKey: options.requestKey });
        },

        async create(data, options = {}) {
            return apiFetch(base, { method: 'POST', body: data, requestKey: options.requestKey });
        },

        async update(id, data, options = {}) {
            return apiFetch(`${base}/${id}`, { method: 'PATCH', body: data, requestKey: options.requestKey });
        },

        async delete(id, options = {}) {
            await apiFetch(`${base}/${id}`, { method: 'DELETE', requestKey: options.requestKey });
            return true;
        },

        async authWithPassword(email, password) {
            const data = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
            authStore.save(data.token, data.record);
            return data;
        },
    };
}

const pb = { collection, authStore };

export default pb;
export { pb };
