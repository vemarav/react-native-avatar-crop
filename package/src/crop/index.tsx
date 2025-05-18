import ImageEditor from '@react-native-community/image-editor'
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { View, Dimensions, StyleSheet } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import MaskedView from '@react-native-masked-view/masked-view'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import {
  Size,
  round,
  assert,
  getAlpha,
  isInRange,
  computeCover,
  computeContain,
  translateRangeX,
  computeImageSize,
  translateRangeY,
  computeScaledWidth,
  computeScaledHeight,
  computeScaledMultiplier,
  computeTranslate,
  computeOffset,
  computeSize,
} from './utils'

const { width: DEFAULT_WIDTH } = Dimensions.get('window')
const DEFAULT_ANIM_DURATION = 180

export type CropProps = {
  source: { uri: string }
  cropShape?: 'rect' | 'circle'
  cropArea?: Size
  borderWidth?: number
  backgroundColor?: string
  borderColor?: string
  opacity?: number
  width?: number
  height?: number
  maxZoom?: number
  resizeMode?: 'contain' | 'cover'
  onCrop: (
    cropCallback: (quality?: number) => Promise<{
      uri: string
      width: number
      height: number
    }>
  ) => void
  showCornerMarkers?: boolean
  placeholder?: React.ReactNode
}

export const Crop = memo((props: CropProps) => {
  const {
    source,
    cropShape = 'circle',
    cropArea: cropAreaProp = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_WIDTH,
    },
    backgroundColor = '#FFFFFF',
    borderColor,
    opacity = 0.7,
    width = DEFAULT_WIDTH,
    height = DEFAULT_WIDTH,
    borderWidth = 2,
    maxZoom = 5,
    resizeMode = 'contain',
    onCrop,
    showCornerMarkers = false,
    placeholder,
  } = props

  const cropArea = useMemo(
    () => ({
      width: round(cropAreaProp.width, 2),
      height: round(cropAreaProp.height, 2),
    }),
    [cropAreaProp.width, cropAreaProp.height]
  )

  if (opacity < 0 || opacity > 1) {
    throw new Error('opacity must be between 0 and 1')
  }

  assert(maxZoom < 1, 'maxZoom must be equal to or greater than 1')
  assert(width < cropArea.width, 'width must be greater than or equal to crop area width')
  assert(
    height < cropArea.height,
    'height must be greater than or equal to crop area height'
  )

  const scale = useSharedValue(1)
  const initialScale = useSharedValue(1)

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const initialTranslateX = useSharedValue(0)
  const initialTranslateY = useSharedValue(0)

  const imageWidth = useSharedValue(0)
  const imageHeight = useSharedValue(0)
  const imageRotation = useSharedValue(0)

  const [minZoom, setMinZoom] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  const opacityStyle = {
    opacity: isLoaded ? 1 : 0,
  }

  const init = async () => {
    try {
      const _imageSize = await computeImageSize(source.uri)

      imageWidth.value = _imageSize.width
      imageHeight.value = _imageSize.height
      imageRotation.value = _imageSize.rotation ?? 0

      const _initialScale = computeContain(_imageSize, cropArea)

      setMinZoom(_initialScale)
      scale.value = _initialScale
      initialScale.value = _initialScale

      if (resizeMode === 'cover') {
        scale.value = computeCover(
          _initialScale,
          _imageSize,
          { width, height },
          cropArea
        )
      }

      translateX.value = 0
      translateY.value = 0
      setIsLoaded(true)
      onCrop(cropImage)
    } catch (e) {
      console.error('Failed to load image:', e)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    init()
  }, [source.uri])

  const translateStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    }
  })

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const resetTranslate = () => {
    'worklet'
    // after scaling if crop area has blank space then
    // it will reset to fit image inside the crop area
    const scaleValue = scale.value
    const imageSize = {
      width: imageWidth.value,
      height: imageHeight.value,
      rotation: imageRotation.value,
    }
    const image = imageSize
    if (!image || isNaN(image.width)) {
      return
    }

    if (scaleValue < initialScale.value) {
      const translateXValue = translateX.value
      const translateYValue = translateY.value
      const { max: maxTranslateX, min: minTranslateX } = translateRangeX(
        scaleValue,
        image,
        cropArea,
        minZoom
      )

      if (!isInRange(translateXValue, maxTranslateX, minTranslateX)) {
        const toValue = translateXValue > 0 ? maxTranslateX : minTranslateX
        translateX.value = withTiming(toValue, {
          duration: DEFAULT_ANIM_DURATION,
        })
      }

      const { max: maxTranslateY, min: minTranslateY } = translateRangeY(
        scaleValue,
        image,
        cropArea,
        minZoom
      )

      if (!isInRange(translateYValue, maxTranslateY, minTranslateY)) {
        const toValue = translateYValue > 0 ? maxTranslateY : minTranslateY
        translateY.value = withTiming(toValue, {
          duration: DEFAULT_ANIM_DURATION,
        })
      }
    }
  }

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onBegin(() => {
      initialTranslateX.value = translateX.value
      initialTranslateY.value = translateY.value
    })
    .onUpdate((event) => {
      const imageSize = {
        width: imageWidth.value,
        height: imageHeight.value,
        rotation: imageRotation.value,
      }
      const { max: maxX, min: minX } = translateRangeX(
        scale.value,
        imageSize,
        cropArea,
        minZoom
      )
      const { max: maxY, min: minY } = translateRangeY(
        scale.value,
        imageSize,
        cropArea,
        minZoom
      )
      const newTranslateX =
        initialTranslateX.value + event.translationX / scale.value
      const newTranslateY =
        initialTranslateY.value + event.translationY / scale.value
      translateX.value = Math.min(Math.max(newTranslateX, minX), maxX)
      translateY.value = Math.min(Math.max(newTranslateY, minY), maxY)
    })

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      initialScale.value = scale.value
    })
    .onChange((event) => {
      const newScale = initialScale.value * event.scale
      scale.value = Math.min(Math.max(newScale, minZoom), maxZoom)
    })
    .onEnd(() => {
      resetTranslate()
    })

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture)

  const cropImage = useCallback(
    async (
      quality: number = 1
    ): Promise<{ uri: string; height: number; width: number }> => {
      if (quality < 0 || quality > 1) {
        throw new Error('quality must be between 0 and 1')
      }

      const scaleValue = scale.value
      const translateXValue = translateX.value
      const translateYValue = translateY.value

      if (!imageWidth.value || !imageHeight.value) {
        throw new Error('Invalid image dimensions')
      }

      const imageSize = {
        width: imageWidth.value,
        height: imageHeight.value,
        rotation: imageRotation.value,
      }

      const scaledWidth = computeScaledWidth(
        scaleValue,
        imageSize,
        cropArea,
        minZoom
      )
      const scaledHeight = computeScaledHeight(
        scaleValue,
        imageSize,
        cropArea,
        minZoom
      )
      const scaledMultiplier = computeScaledMultiplier(imageSize, scaledWidth)
      const scaledSize = { width: scaledWidth, height: scaledHeight }

      const translate = computeTranslate(
        imageSize,
        translateXValue,
        translateYValue
      )

      const { max: maxTranslateX } = translateRangeX(
        scaleValue,
        imageSize,
        cropArea,
        minZoom
      )
      const { max: maxTranslateY } = translateRangeY(
        scaleValue,
        imageSize,
        cropArea,
        minZoom
      )

      const offset = computeOffset(
        scaledSize,
        imageSize,
        translate,
        maxTranslateX,
        maxTranslateY,
        scaledMultiplier
      )
      const size = computeSize(cropArea, scaledMultiplier)
      const emitSize = computeSize(size, quality)
      const cropData = { offset, size, displaySize: emitSize }

      try {
        const croppedImageUri = await ImageEditor.cropImage(
          source.uri,
          cropData
        )
        return {
          uri: croppedImageUri as unknown as string,
          ...emitSize,
        }
      } catch (e) {
        console.error('Crop failed:', e)
        throw e
      }
    }, [
    imageWidth.value,
    imageHeight.value,
    imageRotation.value,
    cropArea.width,
    cropArea.height,
    translateX.value,
    translateY.value,
    scale.value,
    minZoom,
    maxZoom,
  ])

  const borderRadius =
    cropShape === 'circle' ? Math.max(cropArea.height, cropArea.width) : 0

  return (
    <GestureDetector gesture={composedGestures}>
      <View style={{ width, height, backgroundColor }}>
        <MaskedView
          style={styles.mask}
          maskElement={
            <View
              style={[
                styles.overlay,
                {
                  backgroundColor: `${backgroundColor}${getAlpha(opacity)}`,
                },
              ]}
            >
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
          }
        >
          <Animated.View style={[styles.center, translateStyles]}>
            <Animated.Image
              source={source}
              style={[
                styles.contain,
                {
                  ...cropArea,
                },
                scaleStyle,
                opacityStyle,
              ]}
            />
            {!isLoaded && placeholder && (
              <View style={styles.loading}>
                {placeholder}
              </View>
            )}
          </Animated.View>
        </MaskedView>
        <View
          style={[
            {
              ...StyleSheet.absoluteFillObject,
            },
            styles.cover,
          ]}
        >
          <View
            style={{
              ...cropArea,
              borderWidth: borderWidth,
              borderRadius,
              borderColor: borderColor ?? backgroundColor,
            }}
          >
            {showCornerMarkers && (
              <>
                <View style={[styles.cornerBase, styles.cornerTopLeft]} />
                <View style={[styles.cornerBase, styles.cornerTopRight]} />
                <View style={[styles.cornerBase, styles.cornerBottomLeft]} />
                <View style={[styles.cornerBase, styles.cornerBottomRight]} />
              </>
            )}
          </View>
        </View>
      </View>
    </GestureDetector>
  )
})

Crop.displayName = 'Crop'

const styles = StyleSheet.create({
  mask: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 0,
  },
  transparentMask: { backgroundColor: '#FFFFFF' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contain: { resizeMode: 'contain' },
  cover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBase: {
    width: 22,
    height: 22,
    borderColor: 'white',
    position: 'absolute',
    borderRadius: 2,
  },
  cornerTopLeft: {
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: -4,
    left: -4,
  },
  cornerTopRight: {
    borderTopWidth: 4,
    borderRightWidth: 4,
    top: -4,
    right: -4,
  },
  cornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: -4,
    left: -4,
  },
  cornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: -4,
    right: -4,
  },
})
