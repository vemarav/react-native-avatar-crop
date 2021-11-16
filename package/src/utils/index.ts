import ImageSize from 'react-native-image-size';

export type Size = {
  width: number;
  height: number;
  rotation?: number;
};

export type Range = {
  max: number;
  min: number;
};

enum Orientation {
  landscape,
  portrait,
  even,
}

enum Fit {
  width,
  height,
}

export const log = (obj: any) => {
  console.info(JSON.stringify(obj, null, 2));
};

export const assert = (failsTest: boolean, message: string): Error | void => {
  if (failsTest) throw new Error(message);
};

export const round = (num: number, precision: number) => {
  try {
    return Number(num.toFixed(precision));
  } catch (e) {
    return num;
  }
};

export const isInRange = (value: number, max: number, min: number): boolean => min <= value && value <= max;

export const getAlpha = (opacity: number): string => {
  // #12345678 78 is the alpha value and the range is (0 < alpha < 100)
  if (opacity === 1) {
    return '';
  } else {
    return `${Math.ceil(opacity * 100)}`.padStart(2, '0').slice(-2);
  }
};

export const getRatio = (imageSize: Size) => {
  const {width, height} = imageSize;
  return Math.max(width, height) / Math.min(width, height);
};

export const getValue = (animated: any): any => Number.parseFloat(JSON.stringify(animated));

export const getOrientation = (size: Size) => {
  if (size.width > size.height) {
    return Orientation.landscape;
  } else if (size.width < size.height) {
    return Orientation.portrait;
  } else {
    return Orientation.even;
  }
};

export const getAspectRatio = (size: Size) => {
  return size.height / size.width;
};

export const computeImageSize = async (uri: string): Promise<Size> => {
  const {width, height, rotation} = await ImageSize.getSize(uri);
  if (rotation === 90 || rotation === 270) {
    return {width: height, height: width, rotation};
  } else {
    return {width, height, rotation};
  }
};

export const computeScale = (current: number, last: number, max: number, min: number) => {
  const next = current + last - 1;
  if (isInRange(next, max, min)) {
    return next;
  }

  if (next > max) {
    return max;
  }

  return min;
};

export const computeContain = (imageSize: Size, cropArea: Size) => {
  const scale = imageSize.height / cropArea.height / (imageSize.width / cropArea.width);
  return scale > 1 ? scale : 1 / scale;
};

export const computeCover = (scale: number, imageSize: Size, size: Size, cropArea: Size) => {
  const imageOrientation = getOrientation(imageSize);

  if (imageOrientation === Orientation.portrait) {
    return scale * (size.width / cropArea.width);
  } else {
    return scale * (size.height / cropArea.height);
  }
};

export const translateRangeX = (scale: number, imageSize: Size, cropArea: Size, minZoom: number) => {
  const cropARatio = getAspectRatio(cropArea);
  const imageARatio = getAspectRatio(imageSize);
  const initialFit = cropARatio > imageARatio ? Fit.height : Fit.width;

  if (initialFit === Fit.width) {
    const imageOutsideBoxSize = (cropArea.width * scale) / minZoom - cropArea.width;
    return {max: imageOutsideBoxSize / 2, min: -imageOutsideBoxSize / 2};
  } else {
    const imageOutsideBoxSize = cropArea.width * scale - cropArea.width;
    return {max: imageOutsideBoxSize / 2, min: -imageOutsideBoxSize / 2};
  }
};

export const translateRangeY = (scale: number, imageSize: Size, cropArea: Size, minZoom: number) => {
  const cropARatio = getAspectRatio(cropArea);
  const imageARatio = getAspectRatio(imageSize);
  const initialFit = cropARatio < imageARatio ? Fit.width : Fit.height;

  if (initialFit === Fit.height) {
    const imageOutsideBoxSize = (cropArea.height * scale) / minZoom - cropArea.height;
    return {max: imageOutsideBoxSize / 2, min: -imageOutsideBoxSize / 2};
  } else {
    const imageOutsideBoxSize = cropArea.height * scale - cropArea.height;
    return {max: imageOutsideBoxSize / 2, min: -imageOutsideBoxSize / 2};
  }
};

export const computeTranslation = (current: number, last: number, max: number, min: number) => {
  const next = current + last;

  if (isInRange(next, max, min)) {
    return next;
  }

  if (next > max) {
    return max;
  }

  return min;
};

export const computeScaledWidth = (scale: number, imageSize: Size, cropArea: Size, minZoom: number): number => {
  const {max: maxTranslateX} = translateRangeX(minZoom, imageSize, cropArea, minZoom);
  return maxTranslateX > 0 ? cropArea.width * scale : (cropArea.width * scale) / minZoom;
};

export const computeScaledHeight = (scale: number, imageSize: Size, cropArea: Size, minZoom: number): number => {
  const {max: maxTranslateY} = translateRangeY(minZoom, imageSize, cropArea, minZoom);
  return maxTranslateY > 0 ? cropArea.height * scale : (cropArea.height * scale) / minZoom;
};

export const computeScaledMultiplier = (imageSize: Size, width: number) => {
  return imageSize.width / width;
};

export const computeTranslate = (imageSize: Size, x: number, y: number) => {
  if (imageSize.rotation === 90) return {x: -x, y: y};
  if (imageSize.rotation === 180) return {x: -x, y: -y};
  if (imageSize.rotation === 270) return {x: x, y: -y};
  return {x, y};
};

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
  const finalOffsetX = imageSize.width - (initialOffsetX + translate.x) * multiplier;
  const finalOffsetY = imageSize.height - (initialOffsetY + translate.y) * multiplier;
  const offset = {x: round(finalOffsetX, 3), y: round(finalOffsetY, 3)};
  if (imageSize.rotation == 90 || imageSize.rotation === 270) {
    return {x: offset.y, y: offset.x};
  }
  return offset;
};

export const computeSize = (size: Size, multiplier: number): Size => {
  return {
    width: round(size.width * multiplier, 3),
    height: round(size.height * multiplier, 3),
  };
};

export default {
  log,
  Fit,
  Orientation,
  assert,
  getValue,
  getAlpha,
  getRatio,
  getOrientation,
  isInRange,
  computeScale,
  computeCover,
  computeImageSize,
  translateRangeX,
  translateRangeY,
  computeTranslate,
  computeScaledWidth,
  computeScaledHeight,
  computeScaledMultiplier,
};
