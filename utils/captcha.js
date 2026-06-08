
export const cloudinaryResize = (url, width = 400) => {
  if (!url) return null;
  if (!url.includes("cloudinary.com")) return url;

  // Has existing transform — replace it
  if (/\/upload\/[^/]*(?:w_|h_|c_|f_|q_)[^/]*\//.test(url)) {
    return url.replace(
      /\/upload\/[^/]+\//,
      `/upload/w_${width},q_auto,f_auto/`,
    );
  }

  // Has version number only (v1234567) — insert transform before version
  if (/\/upload\/(v\d+\/)/.test(url)) {
    return url.replace(
      /\/upload\/(v\d+\/)/,
      `/upload/w_${width},q_auto,f_auto/$1`,
    );
  }

  // Fallback
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
};