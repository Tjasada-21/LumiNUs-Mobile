export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const responsiveWidth = (screenWidth, ratio, min, max) =>
  clamp(screenWidth * ratio, min, max);

export const responsiveHeight = (screenHeight, ratio, min, max) =>
  clamp(screenHeight * ratio, min, max);
