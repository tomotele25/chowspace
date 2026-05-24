export const cloudinaryResize = (url, width = 400) => {
  if (!url) return null;
  if (!url.includes("cloudinary.com")) return url;
  return url.replace(/\/upload\/[^\/]+\//, `/upload/w_${width},q_auto,f_auto/`);
};
