# react-native-avatar-crop

Supports rect and circle cropping. Use `cropArea={{width, height}}` for custom aspect ratio.

Download apk to see it in action, [click to download](https://reactnativeavatarcrop.page.link/download)

<br>

| Image Picker                                                                                | Network Image                                                                                |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ![video](https://github.com/vemarav/react-native-avatar-crop/raw/main/screenshots/demo.gif) | ![video](https://github.com/vemarav/react-native-avatar-crop/raw/main/screenshots/demo2.gif) |

## Installation

npm

```
npm install react-native-avatar-crop vemarav/react-native-image-editor react-native-image-size @react-native-masked-view/masked-view  @react-native-gesture-handler --save
```

yarn

```
yarn add react-native-avatar-crop vemarav/react-native-image-editor react-native-image-size @react-native-masked-view/masked-view  @react-native-gesture-handler
```

## Usage

```jsx
const component = (props) => {
  const { uri, setUri } = useState("");
  let crop;
  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  const cropImage = async () => {
    // crop accepts quality, default is 1
    // uri will have cropped image cache path
    const { uri, width, height } = await crop(0.9);
    setUri(uri);
  };

  return (
    <View>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
            resizeMode: "contain",
          }}
        />
      ) : null}
      <Crop
        source={props.uri}
        cropShape={"circle"} // rect || circle
        width={SCREEN_WIDTH} // default value
        height={SCREEN_WIDTH} // defalt value
        cropArea={{
          width: SCREEN_WIDTH / 1.3, // required
          height: SCREEN_WIDTH / 1.3, // required
        }}
        borderWidth={0} // default 2
        backgroundColor={"#FFFFFF"} // default #FFFFFF, use same format
        opacity={0.7} // between 0 and 1, default is 1
        maxZoom={3} // default 3
        resizeMode={"contain"} // default "cover"
        onCrop={(cropCallback) => (crop = cropCallback)} // returns a function
      />
    </View>
  );
};
```

see full example [here](https://github.com/vemarav/react-native-avatar-crop/blob/main/example/CropImage.tsx)

## CONTRIBUTING

1. Whether you are a novice or experienced software developer, all contributions and suggestions are welcome!

   Clone repo

   git clone https://github.com/vemarav/react-native-avatar-crop.git

2. Add features or bug fixes

3. Make a Pull Request

   OR

   Report a bug [here](https://github.com/vemarav/react-native-avatar-crop/issues/new/choose)

   Feel free to contribute, hosted on ❤️ with Github.

## TODO

- [ ] Add rotation support

## LICENSE

Package published under [MIT License](https://github.com/vemarav/subdomains/blob/master/LICENSE)

## Author

- [Aravind Vemula](https://github.com/vemarav)

## LIKED IT

Please use following button to star the, so it can reach others too

[![](https://img.shields.io/github/stars/vemarav/react-native-avatar-crop.svg?label=Stars&style=social)](https://github.com/vemarav/react-native-avatar-crop)

## SOCIAL

[![Twitter Follow](https://img.shields.io/twitter/follow/vemarav.svg?style=social&label=Follow)](https://twitter.com/vemarav)
