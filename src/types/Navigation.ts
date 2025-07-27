import { NavigatorScreenParams } from '@react-navigation/native';
import { Entry } from '.';

// Tipos para el stack principal de navegación
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  AddEntry: undefined;
  EntryDetail: { entryId: string };
  EditEntry: { entry: Entry };
  Settings: undefined;
  Statistics: undefined;
};

// Tipos para las tabs del bottom navigation
export type TabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

// Tipos para las pantallas específicas
export type HomeScreenProps = {
  navigation: any;
  route: any;
};

export type AddEntryScreenProps = {
  navigation: any;
  route: any;
};

export type HistoryScreenProps = {
  navigation: any;
  route: any;
};

export interface FirstLoadProps {
  onComplete: () => void;
}

// Tipos para componentes de navegación
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export interface NavigationHeaderProps {
  title: string;
  showBack?: boolean;
  rightButton?: React.ReactNode;
}