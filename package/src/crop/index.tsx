import ImageEditor from '@react-native-community/image-editor';
import MaskedView from '@react-native-community/masked-view';
import React, {useState} from 'react';
import {useEffect} from 'react';
import {Animated, View, Dimensions, StyleSheet} from 'react-native';
import {
  State,
  PinchGestureHandler,
  PanGestureHandler,
  GestureEvent,
} from 'react-native-gesture-handler';

import {
  Size,
  assert,
  getAlpha,
  getRatio,
  getValue,
  isInRange,
  computeSize,
  computeScale,
  computeOffset,
  translateRangeX,
  translateRangeY,
  computeScaledWidth,
  computeScaledHeight,
  computeTranslation,
  getOrientation,
  Orientation,
} from '../utils';

const {width: DEFAULT_WIDTH} = Dimensions.get('window');
const DEFAULT_ANIM_DURATION = 180;

export type CropProps = {
  source: {uri: string};
  cropShape?: 'rect' | 'circle';
  cropArea?: Size;
  borderWidth?: number;
  backgroundColor?: string;
  opacity?: number;
  width?: number;
  height?: number;
  imageSize: Size;
  maxZoom?: number;
  resizeMode?: 'contain' | 'cover';
  onCrop: (
    cropCallback: (quality?: number) => Promise<{
      uri: string;
      width: number;
      height: number;
    }>,
  ) => void;
};

const Crop = (props: CropProps): JSX.Element => {
  const {
    source,
    cropShape = 'circle',
    cropArea = {width: DEFAULT_WIDTH, height: DEFAULT_WIDTH},
    backgroundColor = '#FFFFFF',
    opacity = 0.7,
    width = DEFAULT_WIDTH,
    height = DEFAULT_WIDTH,
    borderWidth = 2,
    maxZoom = 3,
    imageSize,
    resizeMode = 'contain',
    onCrop,
  } = props;

  assert(!isInRange(opacity, 1, 0), 'opacity must be between 0 and 1');
  assert(maxZoom < 1, 'maxZoom must be greater than 1');
  assert(width < cropArea.width, 'width must be greater than crop area width');
  assert(
    height < cropArea.height,
    'height must be greater than crop area height',
  );

  let _lastScale = 1;
  let _lastTranslate = {x: 0, y: 0};
  // const trackTranslation = new Animated.ValueXY(_lastTranslation);
  const trackScale = new Animated.Value(_lastScale);
  // const [translation] = useState(new Animated.ValueXY(_lastTranslation));
  const [scale] = useState(new Animated.Value(_lastScale));

  const [trackTranslationX] = useState(new Animated.Value(0));
  const [trackTranslationY] = useState(new Animated.Value(0));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [minZoom, setMinZoom] = useState(1);

  const init = () => {
    let _initialScale = 1;
    const _componentRatio = getRatio({width, height});
    const _componentOrientation = getOrientation({width, height});
    const _imageRatio = getRatio(imageSize); // image aspect ratio
    const _imageOrientation = getOrientation(imageSize);
    const _cropRatio = getRatio(cropArea); // crop aspect ratio
    const _cropOrientation = getOrientation(cropArea);

    if (_cropOrientation === Orientation.landscape) {
      if (_imageOrientation === Orientation.landscape) {
        const widthToCropWidthRatio = width / cropArea.width;
        _initialScale = _imageRatio / widthToCropWidthRatio / _cropRatio;
      } else {
        const heightToCropHeightRatio = height / cropArea.height;
        _initialScale =
          _imageRatio / heightToCropHeightRatio / (1 / _cropRatio);
      }
    } else if (_cropOrientation === Orientation.portrait) {
      if (_imageOrientation === Orientation.portrait) {
        const heightToCropHeightRatio = height / cropArea.height;
        _initialScale = _imageRatio / heightToCropHeightRatio / _cropRatio;
      } else if (_imageOrientation === Orientation.landscape) {
        const widthToCropWidthRatio = width / cropArea.width;
        _initialScale = _imageRatio / widthToCropWidthRatio / (1 / _cropRatio);
      } else {
        const heightToCropHeightRatio = height / cropArea.height;
        _initialScale = _imageRatio / heightToCropHeightRatio;
      }
    } else {
      if (_imageOrientation === Orientation.landscape) {
        const widthToCropWidthRatio = width / cropArea.width;
        _initialScale = _imageRatio / widthToCropWidthRatio;
      } else {
        const heightToCropHeightRatio = height / cropArea.height;
        _initialScale = _imageRatio / heightToCropHeightRatio;
      }
    }

    setMinZoom(_initialScale);

    if (resizeMode === 'contain') {
      _lastScale = minZoom;
      scale.setValue(minZoom);
    } else {
      _lastScale = _imageRatio / (1 / _componentRatio);
      scale.setValue(_lastScale);
    }

    // reset translation
    translateX.setValue(0);
    translateY.setValue(0);
    addScaleListener();
    addTranslationListeners();
    onCrop(cropImage);

    return () => {
      removeScaleListeners();
      removeTranslationListeners();
    };
  };

  useEffect(() => init());

  // start: pinch gesture handler

  const onPinchGestureEvent = Animated.event(
    [{nativeEvent: {scale: trackScale}}],
    {
      useNativeDriver: false,
    },
  );

  const addScaleListener = () => {
    trackScale.addListener(({value}: {value: number}) => {
      // value always starts from 0
      scale.setValue(computeScale(value, _lastScale, maxZoom, minZoom));
    });
  };

  const removeScaleListeners = () => {
    trackScale.removeAllListeners();
  };

  const resetTranslate = () => {
    // after scaling if crop area has black space then
    // it will reset to fit image inside the crop area
    const scaleValue = getValue(scale);
    if (scaleValue < _lastScale) {
      const translateXValue = getValue(translateX);
      const translateYValue = getValue(translateY);
      const {max: maxTranslateX, min: minTranslateX} = translateRangeX(
        imageSize,
        cropArea,
        width,
        scaleValue,
        minZoom,
      );

      if (!isInRange(translateXValue, maxTranslateX, minTranslateX)) {
        const toValue = translateXValue > 0 ? maxTranslateX : minTranslateX;
        Animated.timing(translateX, {
          toValue,
          duration: DEFAULT_ANIM_DURATION,
          useNativeDriver: true,
        }).start(() => translateX.setValue(toValue));
      }

      const {max: maxTranslateY, min: minTranslateY} = translateRangeY(
        imageSize,
        cropArea,
        width,
        scaleValue,
        minZoom,
      );

      if (!isInRange(translateYValue, maxTranslateY, minTranslateY)) {
        const toValue = translateYValue > 0 ? maxTranslateY : minTranslateY;
        Animated.timing(translateY, {
          toValue,
          duration: DEFAULT_ANIM_DURATION,
          useNativeDriver: true,
        }).start(() => translateY.setValue(toValue));
      }
    }
  };

  const onPinchGestureStateChange = ({nativeEvent}: GestureEvent) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      resetTranslate();
      // reset translate compares scale to last scale
      // so updating the scale after resetting translate values
      _lastScale = getValue(scale);
    }
  };

  // end: pinch gesture handler

  // =================================================================

  // start: pan gesture handler

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: trackTranslationX,
          translationY: trackTranslationY,
        },
      },
    ],
    {
      useNativeDriver: false,
    },
  );

  const addTranslationListeners = () => {
    trackTranslationX.addListener(({value}: {value: number}) => {
      const {max, min} = translateRangeX(
        imageSize,
        cropArea,
        width,
        getValue(scale),
        minZoom,
      );
      const last = _lastTranslate.x;
      translateX.setValue(computeTranslation(value, last, max, min));
    });

    trackTranslationY.addListener(({value}: {value: number}) => {
      const {max, min} = translateRangeY(
        imageSize,
        cropArea,
        width,
        getValue(scale),
        minZoom,
      );
      const last = _lastTranslate.y;
      translateY.setValue(computeTranslation(value, last, max, min));
    });
  };

  const removeTranslationListeners = () => {
    translateX.removeAllListeners();
    translateY.removeAllListeners();
  };

  const onPanGestureStateChange = ({nativeEvent}: GestureEvent) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      _lastTranslate = {x: getValue(translateX), y: getValue(translateY)};
    }
  };

  // end: pan gesture handler

  const cropImage = async (
    quality: number = 1,
  ): Promise<{uri: string; height: number; width: number}> => {
    assert(!isInRange(quality, 1, 0), 'quality must be between 0 and 1');

    const scaleValue = getValue(scale);
    const translateXValue = getValue(translateX);
    const translateYValue = getValue(translateY);

    const scaledWidth = computeScaledWidth(
      width,
      imageSize,
      cropArea,
      scaleValue,
      minZoom,
    );

    const scaledHeight = computeScaledHeight(
      height,
      imageSize,
      cropArea,
      scaleValue,
      minZoom,
    );
    const scaleMultiplier = imageSize.width / scaledWidth;

    const {max: maxTranslateX} = translateRangeX(
      imageSize,
      cropArea,
      width,
      scaleValue,
      minZoom,
    );

    const {max: maxTranslateY} = translateRangeY(
      imageSize,
      cropArea,
      width,
      scaleValue,
      minZoom,
    );

    const offset = computeOffset(
      {width: scaledWidth, height: scaledHeight},
      imageSize,
      {x: translateXValue, y: translateYValue},
      maxTranslateX,
      maxTranslateY,
      scaleMultiplier,
    );

    const size = computeSize(cropArea, scaleMultiplier);
    const emitSize = {
      width: size.width * quality,
      height: size.height * quality,
    };

    try {
      const croppedImageUri = await ImageEditor.cropImage(source.uri, {
        offset,
        size,
        displaySize: emitSize,
      });
      return {uri: croppedImageUri, ...emitSize};
    } catch (e) {
      console.error('Failed to crop image!');
      throw e;
    }
  };

  const borderRadius =
    cropShape === 'circle' ? Math.max(cropArea.height, cropArea.width) : 0;

  return (
    <PinchGestureHandler
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchGestureStateChange}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanGestureStateChange}>
        <View style={{width, height, backgroundColor}}>
          <MaskedView
            style={styles.mask}
            maskElement={
              <View
                style={[
                  styles.overlay,
                  {
                    backgroundColor: `${backgroundColor}${getAlpha(opacity)}`,
                  },
                ]}>
                <View
                  style={[
                    styles.transparentMask,
                    {
                      ...cropArea,
                      borderRadius,
                    },
                  ]}
                />
              </View>
            }>
            <Animated.View
              style={{
                transform: [{translateX}, {translateY}],
              }}>
              <Animated.Image
                source={source}
                style={[
                  styles.contain,
                  {
                    width,
                    height,
                    transform: [{scale}],
                  },
                ]}
              />
            </Animated.View>
          </MaskedView>
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                ...cropArea,
                borderWidth: borderWidth,
                borderRadius,
                borderColor: 'red', //backgroundColor,
              }}
            />
          </View>
        </View>
      </PanGestureHandler>
    </PinchGestureHandler>
  );
};

export default Crop;

const styles = StyleSheet.create({
  mask: {flex: 1},
  transparentMask: {backgroundColor: '#FFFFFF'},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  contain: {resizeMode: 'contain'},
});
