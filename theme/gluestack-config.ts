import { createConfig } from "@gluestack-ui/themed";

export const config = createConfig({
  tokens: {
    colors: {
      primary50: '#e6f7ff',
      primary100: '#bae3ff',
      primary200: '#7cc4fa',
      primary300: '#47a3f3',
      primary400: '#2186eb',
      primary500: '#0967d2',
      primary600: '#0552b5',
      primary700: '#03449e',
      primary800: '#01337d',
      primary900: '#002159',

      secondary50: '#f2f4f7',
      secondary100: '#d9e2ec',
      secondary200: '#bcccdc',
      secondary300: '#9fb3c8',
      secondary400: '#829ab1',
      secondary500: '#627d98',
      secondary600: '#486581',
      secondary700: '#334e68',
      secondary800: '#243b53',
      secondary900: '#102a43',

      success500: '#38b2ac',
      error500: '#e53e3e',
      warning500: '#dd6b20',
      info500: '#3182ce',
    },
  },
  globalStyle: {
    variants: {
      solid: {
        bg: '$primary500',
        borderColor: '$primary500',
        hoverBg: '$primary600',
        activeBg: '$primary700',
        textColor: '$white',
      },
      outline: {
        bg: 'transparent',
        borderColor: '$primary500',
        textColor: '$primary500',
        hoverBg: '$primary50',
        activeBg: '$primary100',
      },
    },
  },
});