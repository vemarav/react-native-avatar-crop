import React from 'react';
import {View, Dimensions, Image, StyleSheet, TouchableOpacity, Text} from 'react-native';

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

const CroppedImage = ({route}: CroppedImageProps) => {
  const {uri, width, height} = route.params;
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#454545',
    },
    image: {
      width: SCREEN_WIDTH / 1.3,
      height: SCREEN_WIDTH / 1.3,
      resizeMode: 'contain',
      borderRadius: SCREEN_WIDTH / 1.3,
    },
  });

  return (
    <View style={styles.center}>
      <Image source={{uri}} style={styles.image} />
    </View>
  );
};

export default CroppedImage;
