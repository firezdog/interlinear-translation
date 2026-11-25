/**
 * Normalize a public base path so it is absolute and ends with `/`.
 * Mirrors webpack.config.js normalizePublicPath.
 */
export function normalizePublicPath(raw: string | undefined | null): string {
    const value = (raw && String(raw).trim()) || "/";
    if (value === "/") return "/";
    const withLeading = value.startsWith("/") ? value : `/${value}`;
    return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/**
 * Site base path (webpack `output.publicPath`).
 * Webpack DefinePlugin replaces `process.env.PUBLIC_PATH` with a string literal
 * at build time (so the browser never needs a real `process`). Jest keeps the
 * real env lookup.
 */
export function getPublicPath(): string {
    return normalizePublicPath(process.env.PUBLIC_PATH);
}

/** Join a root-relative asset path with the public base (no double slashes). */
export function publicAssetUrl(pathFromRoot: string): string {
    const base = getPublicPath();
    const rel = pathFromRoot.replace(/^\/+/, "");
    return `${base}${rel}`;
}
