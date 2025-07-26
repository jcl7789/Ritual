// App.tsx

import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './web/store/store';
import Navigation from './web/components/Navigation';
import './web/locales/i18n'; // Inicializar i18n

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </Provider>
  );
}