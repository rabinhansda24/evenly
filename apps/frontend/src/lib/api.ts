export function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export function apiUrl(path: string) {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const p = path.startsWith('/') ? path : '/' + path;
    return base + p;
}
