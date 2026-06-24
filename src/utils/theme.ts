import { useColorScheme } from 'react-native';

export const colors = {
  primary: '#C2185B',
  primaryDark: '#880E4F',
  primaryLight: '#F8BBD0',
  accent: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  error: '#D32F2F',
  white: '#FFFFFF',
  black: '#121212',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  input: string;
  placeholder: string;
  white: string;
}

export const lightTheme: ThemeColors = {
  background: colors.white,
  surface: colors.gray[50],
  card: colors.white,
  text: colors.gray[900],
  textSecondary: colors.gray[600],
  textInverse: colors.white,
  border: colors.gray[300],
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  input: colors.gray[50],
  placeholder: colors.gray[400],
  white: colors.white,
};

export const darkTheme: ThemeColors = {
  background: colors.gray[900],
  surface: colors.gray[800],
  card: colors.gray[800],
  text: colors.white,
  textSecondary: colors.gray[400],
  textInverse: colors.gray[900],
  border: colors.gray[700],
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  input: colors.gray[800],
  placeholder: colors.gray[500],
  white: colors.white,
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
