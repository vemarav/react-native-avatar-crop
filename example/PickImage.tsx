import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import Routes from './Routes';
import ImagePicker, { Options } from 'react-native-image-crop-picker';

const {width: SCREEN_WIDTH} = Dimensions.get('screen');

type PickImageProps = {
  navigation: {
    navigate: (name: string, params: {[key: string]: any}) => {};
  };
};

const PickImage = ({navigation}: PickImageProps): JSX.Element => {
  const [uri, setUri] = useState('');
  const pickerOptions: Options = {forceJpg: true, mediaType: 'photo', cropping: false};

  const openImagePicker = () => {
    ImagePicker.openPicker(pickerOptions).then(onPickedImage);
  };

  const openCameraPicker = () => {
    ImagePicker.openCamera(pickerOptions).then(onPickedImage);
  }

  const onPickedImage = (image: any) => {
    navigation.navigate(Routes.cropImage, {
      uri: image.sourceURL || image.path,
      width: image.width,
      height: image.height,
    });
  };

  const cropNetworkImage = () => {
    navigation.navigate(Routes.cropImage, {uri});
  };

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <View
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_WIDTH,
          marginBottom: 30,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#cccccc',
        }}>
        {uri ? (
          <Image
            source={{uri}}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH,
              resizeMode: 'contain',
            }}
          />
        ) : (
          <Text>after typing url, wait till image loads</Text>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 30,
        }}>
        <TextInput
          style={{
            flex: 1,
            borderBottomWidth: 1,
            padding: 10,
            marginRight: 20,
            color: 'black',
          }}
          onChangeText={setUri}
          placeholder={'paste image url'}
          autoCorrect={false}
          autoCapitalize={"none"}
          keyboardType={"url"}
        />
        <TouchableOpacity onPress={cropNetworkImage}>
          <View
            style={{padding: 10, backgroundColor: '#0275d8', borderRadius: 4}}>
            <Text style={{color: 'white', fontWeight: '600'}}>Go</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={{height: 100, justifyContent: 'center'}}>
        <Text style={{fontSize: 16}}>OR</Text>
      </View>
      <View style = {{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={openImagePicker}>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Photos</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={openCameraPicker}>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Camera</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default PickImage;

const styles = StyleSheet.create({
  center: {
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
});
