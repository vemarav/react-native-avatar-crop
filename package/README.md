# react-native-avatar-crop

## Demo

<br>

![video](/screenshots/demo.gif)

## Usage

check [dependencies](https://www.npmjs.com/package/react-native-avatar-crop?activeTab=dependencies)

```
  let crop;
  const {width: SCREEN_WIDTH} = Dimensions.get('window');

  <Crop
    source={uri}
    cropShape={"circle"} // rect || circle
    width={SCREEN_WIDTH}
    height={SCREEN_WIDTH}
    cropArea={{
      width: SCREEN_WIDTH / 1.3,
      height: SCREEN_WIDTH / 1.3,
    }}
    borderWidth={0}
    backgroundColor={'#FFFFFF'}
    opacity={0.7} // 0 till 1, default is 0.7
    maxZoom= {3} // default 3
    resizeMode={"contain"} // default "cover"
    onCrop={cropCallback => (crop = cropCallback)} // returns a function
  />
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

## LICENSE

Package published under [MIT License](https://github.com/vemarav/subdomains/blob/master/LICENSE)

## Author

- [Aravind Vemula](https://github.com/vemarav)

## LIKED IT

Please use following button to star the, so it can reach others too

[![](https://img.shields.io/github/stars/vemarav/react-native-avatar-crop.svg?label=Stars&style=social)](https://github.com/vemarav/react-native-avatar-crop)

## SOCIAL

[![Twitter Follow](https://img.shields.io/twitter/follow/vemarav.svg?style=social&label=Follow)](https://twitter.com/vemarav)
