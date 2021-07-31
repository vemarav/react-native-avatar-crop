import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';
import Routes from './Routes';

type PickImageProps = {
  navigation: {
    navigate: (name: string, params: {[key: string]: any}) => {};
  };
};

const PickImage = ({navigation}: PickImageProps): JSX.Element => {
  const styles = StyleSheet.create({
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    btn: {
      backgroundColor: '#0275d8',
      borderRadius: 4,
      paddingHorizontal: 40,
      paddingVertical: 10,
    },
    btnText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
    },
  });

  const openImagePicker = () => {
    launchImageLibrary(
      {mediaType: 'photo'},
      ({assets}: ImagePickerResponse) => {
        if (assets) {
          onPickedImage(assets[0]);
        }
      },
    );
  };

  const onPickedImage = (image: Asset) => {
    navigation.navigate(Routes.cropImage, image);
  };

  return (
    <View style={styles.center}>
      <TouchableOpacity onPress={openImagePicker}>
        <View style={styles.btn}>
          <Text style={styles.btnText}>Pick Image</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PickImage;
