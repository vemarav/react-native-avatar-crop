import React from 'react';
import {View, StyleSheet} from 'react-native';
import Crop from 'react-native-avatar-crop';

type CropImageProps = {
  route: {params: {uri: string; width: number; height: number}};
  navigation: {
    navigate: (name: string, params: {[key: string]: any}) => {};
  };
};

const CropImage = ({route, navigation}: CropImageProps): JSX.Element => {
  const {uri, width, height} = route.params;
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#454545',
    },
  });
  return (
    <View style={styles.center}>
      <Crop
        source={{uri}}
        imageSize={{width, height}}
        onCrop={console.log}
        width={331}
        height={331}
        cropArea={{width: 232, height: 232}}
      />
    </View>
  );
};

export default CropImage;
