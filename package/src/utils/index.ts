export type Size = {
  width: number;
  height: number;
};

export type Range = {
  max: number;
  min: number;
};

export enum Orientation {
  landscape,
  portrait,
}

const round = (num: number, precision: number) => {
  try {
    return Number(num.toFixed(precision));
  } catch (e) {
    return num;
  }
};

export const getAlpha = (opacity: number): string => {
  // #12345678 78 is the alpha value and the range is (0 < alpha < 100)
  if (opacity === 1) {
    return '';
  } else {
    return `${Math.ceil(opacity * 100)}`.padStart(2, '0').slice(-2);
  }
};

export const isInRange = (value: number, max: number, min: number): boolean =>
  min <= value && value <= max;

export const getRatio = ({width, height}: Size) =>
  Math.max(width, height) / Math.min(width, height);

export const computeScale = (
  current: number,
  last: number,
  maxZoom: number,
  minZoom: number,
): number => {
  const next = last + current - 1;

  if (isInRange(next, maxZoom, minZoom)) {
    return next;
  }

  if (next > maxZoom) {
    return maxZoom;
  }

  return minZoom;
};

export const computeTranslation = (
  current: number,
  last: number,
  max: number,
  min: number,
): number => {
  const next = current + last;

  if (isInRange(next, max, min)) {
    return next;
  }

  if (next > max) {
    return max;
  }

  return min;
};

export const getValue = (animated: any): any => animated._value;

export const translateRangeX = (
  imageSize: Size,
  cropArea: Size,
  width: number,
  scale: number,
  minZoom: number,
): Range => {
  // returns the range in which user can pan image horizontally
  const _imageOrientation =
    imageSize.width > imageSize.height
      ? Orientation.landscape
      : Orientation.portrait;
  const _imageWidth =
    _imageOrientation === Orientation.landscape ? width : cropArea.width;
  const _imageScale =
    _imageOrientation === Orientation.landscape ? scale : scale / minZoom;

  // finding the current width of the image (after scaling down or up)
  const _scaledWidth = _imageWidth * _imageScale;

  // need half the size as translation happens from -ve to +ve range,
  // and -ve and +ve widths are always equal
  const _imageOutOfCropArea = (_scaledWidth - cropArea.width) / 2;

  return {max: _imageOutOfCropArea, min: -_imageOutOfCropArea};
};

export const translateRangeY = (
  imageSize: Size,
  cropArea: Size,
  height: number,
  scale: number,
  minZoom: number,
): Range => {
  // returns the range in which user can pan image horizontally
  const _imageOrientation =
    imageSize.width < imageSize.height
      ? Orientation.landscape
      : Orientation.portrait;
  const _imageHeight =
    _imageOrientation === Orientation.landscape ? height : cropArea.height;
  const _imageScale =
    _imageOrientation === Orientation.landscape ? scale : scale / minZoom;

  // finding the current width of the image (after scaling down or up)
  const _scaledHeight = _imageHeight * _imageScale;

  // need half the size as translation happens from -ve to +ve range,
  // and -ve and +ve widths are always equal
  const _imageOutOfCropArea = (_scaledHeight - cropArea.height) / 2;

  return {max: _imageOutOfCropArea, min: -_imageOutOfCropArea};
};

export const assert = (failsTest: boolean, message: string): Error | void => {
  if (failsTest) throw new Error(message);
};

export const computeScaledWidth = (
  width: number,
  imageSize: Size,
  cropArea: Size,
  scale: number,
  minZoom: number,
): number => {
  return imageSize.width > imageSize.height
    ? width * scale
    : (cropArea.width * scale) / minZoom;
};

export const computeScaledHeight = (
  height: number,
  imageSize: Size,
  cropArea: Size,
  scale: number,
  minZoom: number,
): number => {
  return imageSize.width < imageSize.height
    ? height * scale
    : (cropArea.height * scale) / minZoom;
};

// computeOffset(
//  {width: scaledWidth, height: scaledHeight},
//  maxTranslateX,
//  translate: {x: translateXValue, y: translateYValue}
//  imageSize,
// scaleMultiplier
// );

export const computeOffset = (
  scaled: Size,
  imageSize: Size,
  translate: {x: number; y: number},
  maxTranslateX: number,
  maxTranslateY: number,
  multiplier: number,
): {x: number; y: number} => {
  const initialOffsetX = scaled.width - maxTranslateX;
  const initialOffsetY = scaled.height - maxTranslateY;

  const finalOffsetX =
    imageSize.width - (initialOffsetX + translate.x) * multiplier;
  const finalOffsetY =
    imageSize.height - (initialOffsetY + translate.y) * multiplier;
  return {x: round(finalOffsetX, 3), y: round(finalOffsetY, 3)};
};

export const computeSize = (cropArea: Size, multiplier: number): Size => {
  return {
    width: round(cropArea.width * multiplier, 3),
    height: round(cropArea.height * multiplier, 3),
  };
};

export default {
  assert,
  getAlpha,
  isInRange,
  getRatio,
  computeScale,
  computeOffset,
  translateRangeX,
  translateRangeY,
  computeTranslation,
  computeScaledWidth,
  computeScaledHeight,
};
