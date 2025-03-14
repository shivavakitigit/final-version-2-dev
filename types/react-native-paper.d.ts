declare module 'react-native-paper' {
  import React from 'react';
  import { TextStyle, ViewStyle, StyleProp, ColorValue } from 'react-native';

  export interface ThemeColors {
    primary: string;
    background: string;
    surface: string;
    accent: string;
    error: string;
    text: string;
    onSurface: string;
    disabled: string;
    placeholder: string;
    backdrop: string;
    notification: string;
    success: string;
    warning: string;
    info: string;
    primaryContainer: string;
    secondaryContainer: string;
    secondary: string;
  }

  export interface Theme {
    colors: ThemeColors;
    roundness: number;
    fonts: {
      regular: any;
      medium: any;
      light: any;
      thin: any;
    };
    animation: {
      scale: number;
    };
  }

  export const MD3LightTheme: Theme;
  export const MD3DarkTheme: Theme;
  export const MD2LightTheme: Theme;
  export const MD2DarkTheme: Theme;

  export type ProviderProps = {
    children: React.ReactNode;
    theme?: Theme;
  };

  export function PaperProvider(props: ProviderProps): JSX.Element;
  export function useTheme(): Theme;

  // Components
  export interface TextProps {
    style?: StyleProp<TextStyle>;
    variant?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const Text: React.ComponentType<TextProps>;

  export interface ButtonProps {
    mode?: 'text' | 'outlined' | 'contained';
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    onPress?: () => void;
    loading?: boolean;
    disabled?: boolean;
    icon?: string | ((props: { size: number, color: string }) => React.ReactNode);
    [key: string]: any;
  }
  export const Button: React.ComponentType<ButtonProps>;

  export interface SurfaceProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    elevation?: number;
    [key: string]: any;
  }
  export const Surface: React.ComponentType<SurfaceProps>;

  export interface TitleProps {
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const Title: React.ComponentType<TitleProps>;

  export interface ChipProps {
    mode?: 'flat' | 'outlined';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: string | ((props: { size: number, color: string }) => React.ReactNode);
    children?: React.ReactNode;
    onPress?: () => void;
    [key: string]: any;
  }
  export const Chip: React.ComponentType<ChipProps>;

  export interface ProgressBarProps {
    progress?: number;
    color?: string;
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }
  export const ProgressBar: React.ComponentType<ProgressBarProps>;

  export interface SwitchProps {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    color?: string;
    disabled?: boolean;
    [key: string]: any;
  }
  export const Switch: React.ComponentType<SwitchProps>;

  export interface CardProps {
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const Card: React.ComponentType<CardProps> & {
    Content: React.ComponentType<{ style?: StyleProp<ViewStyle>, children?: React.ReactNode }>;
    Actions: React.ComponentType<{ style?: StyleProp<ViewStyle>, children?: React.ReactNode }>;
    Cover: React.ComponentType<{ source: { uri: string }, style?: StyleProp<ViewStyle> }>;
    Title: React.ComponentType<{ title: string, subtitle?: string, style?: StyleProp<TextStyle> }>;
  };

  export interface AppbarProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const Appbar: React.ComponentType<AppbarProps>;

  export interface IconButtonProps {
    icon: string | ((props: { size: number, color: string }) => React.ReactNode);
    color?: string;
    size?: number;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    iconColor?: string;
    [key: string]: any;
  }
  export const IconButton: React.ComponentType<IconButtonProps>;

  export interface AvatarProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }
  
  export const Avatar: React.ComponentType<AvatarProps> & {
    Image: React.ComponentType<{ size?: number, source: { uri: string }, style?: StyleProp<ViewStyle> }>;
    Icon: React.ComponentType<{ size?: number, icon: string, style?: StyleProp<ViewStyle> }>;
    Text: React.ComponentType<{ size?: number, label: string, style?: StyleProp<ViewStyle> }>;
  };

  export interface TextInputProps {
    label?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    mode?: 'flat' | 'outlined';
    style?: StyleProp<ViewStyle>;
    secureTextEntry?: boolean;
    error?: boolean;
    disabled?: boolean;
    placeholder?: string;
    right?: React.ReactNode;
    left?: React.ReactNode;
    multiline?: boolean;
    keyboardType?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    [key: string]: any;
  }
  
  export const TextInput: React.ComponentType<TextInputProps> & {
    Icon: React.ComponentType<{ icon: string, onPress?: () => void, color?: string }>;
  };

  export interface ActivityIndicatorProps {
    animating?: boolean;
    color?: string;
    size?: 'small' | 'large' | number;
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }
  export const ActivityIndicator: React.ComponentType<ActivityIndicatorProps>;

  export interface SegmentedButtonsProps {
    value?: string;
    onValueChange?: (value: string) => void;
    buttons?: Array<{
      value: string;
      label: string;
      icon?: string;
      disabled?: boolean;
      checkedColor?: string;
      uncheckedColor?: string;
    }>;
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }
  export const SegmentedButtons: React.ComponentType<SegmentedButtonsProps>;
}