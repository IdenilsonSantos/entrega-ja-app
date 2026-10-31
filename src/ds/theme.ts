import { useColorScheme } from 'react-native';

/**
 * Tokens do design system, os mesmos valores do site (entrega-ja-web/src/index.css).
 * Trocar a marca: mude `primary*` aqui e lá.
 */
const light = {
  primary: '#FF7622',
  primaryPress: '#EA6514',
  primarySoft: '#FFEBE4',
  primaryText: '#C2500F',
  navy: '#181C2E',
  bg: '#FFFFFF',
  canvas: '#F6F8FA',
  surface: '#FFFFFF',
  field: '#F0F5FA',
  hover: '#ECF0F4',
  line: '#E8ECF1',
  ink: '#181C2E',
  text: '#32343E',
  muted: '#646982',
  subtle: '#A0A5BA',
  success: '#037A53',
  successSoft: '#E3F6EE',
  warn: '#9A5B00',
  warnSoft: '#FFF3DC',
  info: '#2459C9',
  infoSoft: '#E6EEFD',
  danger: '#D92D2D',
  dangerSoft: '#FFE9E7',
  onDark: '#FFFFFF',
};
export type Palette = typeof light;

const dark: Palette = {
  ...light,
  primarySoft: '#3A2418',
  primaryText: '#FF9A5C',
  navy: '#232338',
  bg: '#121223',
  canvas: '#0D0D1A',
  surface: '#1B1B2D',
  field: '#26263A',
  hover: '#2A2A3E',
  line: '#303046',
  ink: '#F4F5F8',
  text: '#D9DBE4',
  muted: '#A8ACC0',
  subtle: '#7C8099',
  success: '#4FD1A1',
  successSoft: '#12332A',
  warn: '#F2B24C',
  warnSoft: '#3A2C12',
  info: '#8FB0FF',
  infoSoft: '#1A2547',
  danger: '#FF7A70',
  dangerSoft: '#3D1A1A',
};

export const usePalette = () => (useColorScheme() === 'dark' ? dark : light);

export const font = { regular: 'Sen_400Regular', bold: 'Sen_700Bold', heavy: 'Sen_800ExtraBold' };
/** Hierarquia de cantos: etiqueta < controle < cartão < painel */
export const radius = { sm: 6, field: 10, card: 14, panel: 18, full: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
/** Áreas de toque: botão principal 56, controles 48, ícones 44 */
export const size = { cta: 56, field: 52, tap: 44 };
