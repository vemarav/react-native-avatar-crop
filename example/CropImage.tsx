import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView} from 'react-native';
import Routes from './Routes';
import Crop from 'react-native-avatar-crop';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type CropImageProps = {
  route: {params: {uri: string; width: number; height: number}};
  navigation: {
    navigate: (name: string, params?: {[key: string]: string | number}) => {};
  };
};

const CropImage = ({route, navigation}: CropImageProps): JSX.Element => {
  const {uri} = route.params;

  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#454545',
    },
    btn: {
      justifyContent: 'center',
      marginHorizontal: 20,
      backgroundColor: '#0275D8',
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 4,
    },
    btnText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
    },
    padding20: {
      padding: 20,
    },
  });

  let crop = async (quality?: number) => ({uri: '', width: 0, height: 0});

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <Crop
        source={{uri}}
        width={SCREEN_WIDTH}
        height={SCREEN_WIDTH}
        cropArea={{width: SCREEN_WIDTH / 1.3, height: SCREEN_WIDTH / 1.3}}
        onCrop={cropCallback => (crop = cropCallback)}
      />
      <View style={styles.padding20} />
      <TouchableOpacity
        onPress={async () => {
          const cropped = await crop();
          navigation.navigate(Routes.croppedImage, cropped);
        }}>
        <View style={styles.btn}>
          <Text style={styles.btnText}>Save Crop</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CropImage;
