import React from 'react';
import {
  View,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';

export const getRatio = ({width, height}: {width: number; height: number}) =>
  Math.max(width, height) / Math.min(width, height);

type CroppedImageProps = {
  route: {params: {uri: string; width: number; height: number}};
  navigation: {
    navigate: (name: string, params?: {[key: string]: any}) => {};
    goBack: () => void;
  };
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const CroppedImage = ({route, navigation}: CroppedImageProps) => {
  const {uri, width, height} = route.params;
  const aspectRatio = getRatio({width, height});
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#454545',
    },
    image: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH * aspectRatio,
      resizeMode: 'contain',
    },
  });

  return (
    <View style={styles.center}>
      <Image source={{uri}} style={styles.image} />
    </View>
  );
};

export default CroppedImage;
