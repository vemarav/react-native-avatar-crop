import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Routes from './Routes';

// screens
import PickImage from './PickImage';
import CropImage from './CropImage';
import CroppedImage from './CroppedImage';

const Stack = createStackNavigator();

const App = (): JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name={Routes.pickImage} component={PickImage} />
        <Stack.Screen name={Routes.cropImage} component={CropImage} />
        <Stack.Screen name={Routes.croppedImage} component={CroppedImage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
