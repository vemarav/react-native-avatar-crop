import ImageEditor from '@react-native-community/image-editor';
import MaskedView from '@react-native-community/masked-view';
import React, {useState, useEffect} from 'react';
import {Animated, View, Dimensions, StyleSheet} from 'react-native';
import {State, PinchGestureHandler, PanGestureHandler, GestureEvent} from 'react-native-gesture-handler';

import {
  log,
  Size,
  round,
  assert,
  getValue,
  getAlpha,
  isInRange,
  computeScale,
  computeCover,
  computeContain,
  translateRangeX,
  computeImageSize,
  computeTranslation,
  translateRangeY,
  computeScaledWidth,
  computeScaledHeight,
  computeScaledMultiplier,
  computeTranslate,
  computeOffset,
  computeSize,
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
    maxZoom = 5,
    resizeMode = 'contain',
    onCrop,
  } = props;

  cropArea.width  = round(cropArea.width, 2);
  cropArea.height = round(cropArea.height, 2);

  assert(!isInRange(opacity, 1, 0), 'opacity must be between 0 and 1');
  assert(maxZoom < 1, 'maxZoom must be greater than 1');
  assert(width < cropArea.width, 'width must be greater than crop area width');
  assert(height < cropArea.height, 'height must be greater than crop area height');

  let _lastScale = 1;
  let _lastTranslate = {x: 0, y: 0};

  const trackScale = new Animated.Value(0);
  const [scale] = useState(new Animated.Value(0));

  const [trackTranslationX] = useState(new Animated.Value(0));
  const [trackTranslationY] = useState(new Animated.Value(0));

  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));

  const [minZoom, setMinZoom] = useState(1);

  const imageSize = {width: NaN, height: NaN, rotation: 0};

  const setImageSize = ({width, height, rotation}: {width: number; height: number; rotation?: number}) => {
    imageSize.width = width;
    imageSize.height = height;
    imageSize.rotation = rotation || 0;
  };

  const init = async () => {
    setImageSize(await computeImageSize(source.uri));
    const _initialScale = computeContain(imageSize, cropArea);

    setMinZoom(_initialScale);
    scale.setValue(_initialScale);

    if (resizeMode === 'cover') {
      scale.setValue(computeCover(getValue(scale), imageSize, {width, height}, cropArea));
    }

    _lastScale = getValue(scale);

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

  useEffect(() => {
    init();
  });

  // start: pinch gesture handler

  const onPinchGestureEvent = Animated.event([{nativeEvent: {scale: trackScale}}], {
    useNativeDriver: false,
  });

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
    // after scaling if crop area has blank space then
    // it will reset to fit image inside the crop area
    const scaleValue = getValue(scale);
    if (scaleValue < _lastScale) {
      const translateXValue = getValue(translateX);
      const translateYValue = getValue(translateY);
      const {max: maxTranslateX, min: minTranslateX} = translateRangeX(getValue(scale), imageSize, cropArea, minZoom);

      if (!isInRange(translateXValue, maxTranslateX, minTranslateX)) {
        const toValue = translateXValue > 0 ? maxTranslateX : minTranslateX;
        Animated.timing(translateX, {
          toValue,
          duration: DEFAULT_ANIM_DURATION,
          useNativeDriver: true,
        }).start(() => translateX.setValue(toValue));
      }

      const {max: maxTranslateY, min: minTranslateY} = translateRangeY(getValue(scale), imageSize, cropArea, minZoom);

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
      // resetTranslate depends on _lastScale
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
      const {max, min} = translateRangeX(getValue(scale), imageSize, cropArea, minZoom);
      const last = _lastTranslate.x;
      translateX.setValue(computeTranslation(value, last, max, min));
    });

    trackTranslationY.addListener(({value}: {value: number}) => {
      const {max, min} = translateRangeY(getValue(scale), imageSize, cropArea, minZoom);
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

  const cropImage = async (quality: number = 1): Promise<{uri: string; height: number; width: number}> => {
    assert(!isInRange(quality, 1, 0), 'quality must be between 0 and 1');

    const scaleValue = getValue(scale);
    const translateXValue = getValue(translateX);
    const translateYValue = getValue(translateY);

    const scaledWidth = computeScaledWidth(scaleValue, imageSize, cropArea, minZoom);
    const scaledHeight = computeScaledHeight(scaleValue, imageSize, cropArea, minZoom);
    const scaledMultiplier = computeScaledMultiplier(imageSize, scaledWidth);

    const scaledSize = {width: scaledWidth, height: scaledHeight};
    const translate = computeTranslate(imageSize, translateXValue, translateYValue);

    const {max: maxTranslateX} = translateRangeX(getValue(scale), imageSize, cropArea, minZoom);
    const {max: maxTranslateY} = translateRangeY(getValue(scale), imageSize, cropArea, minZoom);

    const offset = computeOffset(scaledSize, imageSize, translate, maxTranslateX, maxTranslateY, scaledMultiplier);
    const size = computeSize(cropArea, scaledMultiplier);
    const emitSize = computeSize(size, quality);
    const cropData = {offset, size, displaySize: emitSize};

    try {
      const croppedImageUri = await ImageEditor.cropImage(source.uri, cropData);
      return {uri: croppedImageUri, ...emitSize};
    } catch (e) {
      console.error('Failed to crop image!');
      throw e;
    }
  };

  const borderRadius = cropShape === 'circle' ? Math.max(cropArea.height, cropArea.width) : 0;

  return (
    <PanGestureHandler
      minPointers={1}
      maxPointers={1}
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanGestureStateChange}>
      <PinchGestureHandler
        minPointers={2}
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchGestureStateChange}>
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
              style={[
                styles.center,
                {
                  transform: [{translateX}, {translateY}],
                },
              ]}>
              <Animated.Image
                source={source}
                style={[
                  styles.contain,
                  {
                    ...cropArea,
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
                borderColor: backgroundColor,
              }}
            />
          </View>
        </View>
      </PinchGestureHandler>
    </PanGestureHandler>
  );
};

export default Crop;

const styles = StyleSheet.create({
  mask: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  transparentMask: {backgroundColor: '#FFFFFF'},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  contain: {resizeMode: 'contain'},
});
