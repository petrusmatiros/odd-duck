
export function unsplashAdjustURL(
  url: string,
  options: {
    dimensions: {
      width: number;
      height?: number;
    }
    quality: number;
    format: "webp" | "jpg";
    fit: "fill" | "crop";
    auto: "compress" | "format";
  }
) {
  if (!url) {
    return null;
  }
  // remove all query parameters from the url
  // then add the new query parameters
  const urlWithoutParams = url.split("?")[0];

  if (!urlWithoutParams) {
    return null;
  }

  const params = {
    w: options.dimensions.width,
    h: options.dimensions.height,
    q: options.quality,
    fit: options.fit,
    auto: options.auto,
    fm: options.format,
  };

  try {
    const newUrlWithParams = new URL(urlWithoutParams);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        newUrlWithParams.searchParams.append(key, value.toString());
      }
    }
    return newUrlWithParams.toString();
  } catch (e) {
    console.error("Error creating URL params:", e);
    return null;
  }
}