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

export const getRatio = ({width, height}: {width: number; height: number}) =>
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

export const computeTranslationX = (
  current: number,
  last: number,
  max: number,
  min: number,
): number => {
  // if (newValue < -allowedPanningSize) {
  //   translationX.setValue(-allowedPanningSize);
  // } else if (newValue > allowedPanningSize) {
  //   translationX.setValue(allowedPanningSize);
  // } else if (Math.abs(newValue) <= allowedPanningSize) {
  //   translationX.setValue(newValue);
  // }

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

export default {
  getAlpha,
  isInRange,
  getRatio,
  computeScale,
  computeTranslationX,
};
