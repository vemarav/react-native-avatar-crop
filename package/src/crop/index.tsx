import MaskedView from '@react-native-community/masked-view';
import React, {useState} from 'react';
import {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {Animated, View, Dimensions} from 'react-native';
import {
  State,
  PinchGestureHandler,
  PanGestureHandler,
  GestureEvent,
} from 'react-native-gesture-handler';

import {
  computeScale,
  computeTranslationX,
  getAlpha,
  getRatio,
  getValue,
  isInRange,
} from '../utils';

const {width: DEFAULT_WIDTH} = Dimensions.get('window');

enum Orientation {
  landscape,
  portrait,
}

export type CropProps = {
  source: {uri: string};
  cropShape?: 'rect' | 'circle';
  cropArea?: {width: number; height: number};
  borderWidth?: number;
  backgroundColor?: string;
  opacity?: number;
  width?: number;
  height?: number;
  imageSize: {width: number; height: number};
  maxZoom?: number;
  resizeMode?: 'contain' | 'cover';
  onCrop: (params: {callback: () => string}) => void;
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

  if (!isInRange(opacity, 1, 0)) {
    throw new Error('opacity must be between 0 and 1');
  }

  if (maxZoom < 1) {
    throw new Error('maxZoom must be greater than 1');
  }

  if (width < cropArea.width) {
    throw new Error('width must be greater than crop area width');
  }

  if (height < cropArea.height) {
    throw new Error('height must be greater than crop area height');
  }

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
    const _imageRatio = getRatio(imageSize);
    const _widthToCropWidthRatio = width / cropArea.width;
    const _initialScale = _imageRatio / _widthToCropWidthRatio;
    setMinZoom(_initialScale);
    if (resizeMode === 'contain') {
      scale.setValue(minZoom);
    } else {
      scale.setValue(_imageRatio);
    }

    // reset translation
    translateX.setValue(0);
    translateY.setValue(0);

    addScaleListener();
    addTranslationListeners();

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

  const onPinchGestureStateChange = ({nativeEvent}: GestureEvent) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      // user stop pinch gesture by any reason
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

  const maxTranslateX = () => {
    const _imageOrientation =
      imageSize.width > imageSize.height
        ? Orientation.landscape
        : Orientation.portrait;
    const _imageWidth =
      _imageOrientation === Orientation.landscape ? width : cropArea.width;
    const _imageScale =
      _imageOrientation === Orientation.landscape
        ? getValue(scale)
        : getValue(scale) / minZoom;

    // finding the current width of the image (after scaling down or up)
    const _scaledWidth = _imageWidth * _imageScale;

    // need half the size as translation happens from -ve to +ve range,
    // and -ve and +ve widths are always equal
    const _imageOutOfCropArea = (_scaledWidth - cropArea.width) / 2;
    return _imageOutOfCropArea;
  };

  const addTranslationListeners = () => {
    trackTranslationX.addListener(({value}: {value: number}) => {
      const max = maxTranslateX();
      const min = -max;
      const last = _lastTranslate.x;
      translateX.setValue(computeTranslationX(value, last, max, min));
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
                      borderRadius:
                        cropShape === 'circle'
                          ? Math.max(cropArea.height, cropArea.width)
                          : 0,
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
                borderRadius:
                  cropShape === 'circle'
                    ? Math.max(cropArea.height, cropArea.width)
                    : 0,
                borderColor: backgroundColor,
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
