import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch as RNSwitch, Text, TextInput, View, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, radius, size, space, usePalette, type Palette } from './theme';

export * from './theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warn' | 'info' | 'danger';
const toneColors = (c: Palette, t: Tone) =>
  ({
    neutral: [c.field, c.muted],
    primary: [c.primarySoft, c.primaryText],
    success: [c.successSoft, c.success],
    warn: [c.warnSoft, c.warn],
    info: [c.infoSoft, c.info],
    danger: [c.dangerSoft, c.danger],
  })[t];

// ── texto

type Variant = 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'number';
const VARIANT: Record<Variant, TextStyle> = {
  title: { fontFamily: font.heavy, fontSize: 30, lineHeight: 34 },
  h1: { fontFamily: font.bold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: font.bold, fontSize: 19, lineHeight: 24 },
  h3: { fontFamily: font.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bold, fontSize: 14, lineHeight: 18 },
  number: { fontFamily: font.heavy, fontSize: 34, lineHeight: 38, fontVariant: ['tabular-nums'] },
};

export function T({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: keyof Palette }) {
  const c = usePalette();
  const fallback: keyof Palette = v === 'body' ? 'text' : v === 'small' ? 'muted' : 'ink';
  return <Text style={[VARIANT[v], { color: c[color ?? fallback] }, style]} {...rest} />;
}

// ── ações

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'success' | 'danger';
/**
 * Alturas: lg 56 (ação única no fim da tela), md 48 (padrão e botões lado a lado), sm 40.
 * Botões lado a lado vão dentro de <ButtonRow>, que dá a mesma largura a todos.
 */
const HEIGHT = { sm: 40, md: 48, lg: size.cta };
export function Button({ title, onPress, variant = 'primary', loading, disabled, style, size: s = 'md' }: { title: string; onPress: () => void; variant?: BtnVariant; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; size?: 'sm' | 'md' | 'lg' }) {
  const small = s === 'sm';
  const c = usePalette();
  const bg = { primary: c.primary, outline: c.surface, ghost: 'transparent', dark: c.navy, success: c.success, danger: c.dangerSoft }[variant];
  const fg = { primary: '#fff', outline: c.ink, ghost: c.ink, dark: '#fff', success: '#fff', danger: c.danger }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        { height: HEIGHT[s], borderRadius: radius.field, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, flexDirection: 'row', gap: space.sm },
        variant === 'outline' && { borderWidth: 1.5, borderColor: c.line },
        pressed && { opacity: 0.85 },
        off && { opacity: 0.45 },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={fg} />}
      <Text style={{ fontFamily: font.bold, fontSize: small ? 14 : 16, color: fg }}>{title}</Text>
    </Pressable>
  );
}

/** Botões lado a lado com a mesma largura */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: space.sm }}>{Array.isArray(children) ? children.filter(Boolean).map((ch, i) => <View key={i} style={{ flex: 1 }}>{ch}</View>) : <View style={{ flex: 1 }}>{children}</View>}</View>;
}

export function Link({ title, onPress, color = 'primaryText' }: { title: string; onPress: () => void; color?: keyof Palette }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
      <T v="label" color={color}>
        {title}
      </T>
    </Pressable>
  );
}

// ── superfícies

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, padding: space.lg, gap: space.md }, style]}>{children}</View>;
}

export function Divider() {
  const c = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = usePalette();
  const [bg, fg] = toneColors(c, tone);
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: font.bold, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

export function Alert({ tone = 'info', title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const c = usePalette();
  const [bg, fg] = toneColors(c, tone);
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: bg, borderRadius: radius.card, padding: space.md, gap: 2 }}>
      {title && <Text style={{ fontFamily: font.bold, fontSize: 14, color: fg }}>{title}</Text>}
      {typeof children === 'string' ? <Text style={{ fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: c.text }}>{children}</Text> : children}
    </View>
  );
}

/** Placa no padrão Mercosul */
export function Plate({ plate }: { plate: string }) {
  return (
    <View accessibilityLabel={`Placa ${plate}`} style={{ width: 104, borderWidth: 2, borderColor: '#181C2E', borderRadius: 5, overflow: 'hidden', backgroundColor: '#fff' }}>
      <Text style={{ backgroundColor: '#1C3F94', color: '#fff', fontSize: 7, letterSpacing: 2, textAlign: 'center', fontFamily: font.bold, paddingVertical: 1 }}>BRASIL</Text>
      <Text style={{ color: '#111', fontSize: 17, letterSpacing: 1.5, textAlign: 'center', fontFamily: font.heavy, paddingVertical: 3 }}>{plate}</Text>
    </View>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={{ flex: 1, gap: 4 }}>
      <T v="small">{label}</T>
      <T v="h1" style={{ fontFamily: font.heavy, fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
      {hint && <T v="small">{hint}</T>}
    </Card>
  );
}

export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: space.xl, gap: space.sm }}>
      <T v="h3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {description && (
        <T v="small" style={{ textAlign: 'center' }}>
          {description}
        </T>
      )}
    </View>
  );
}

// ── formulário

export function Field({ label, hint, error, ...input }: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  const c = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.subtle}
        style={{ height: size.field, borderRadius: radius.field, backgroundColor: c.field, paddingHorizontal: space.lg, fontFamily: font.regular, fontSize: 16, color: c.ink, borderWidth: 1.5, borderColor: error ? c.danger : 'transparent' }}
        {...input}
      />
      {error ? (
        <T v="small" color="danger">
          {error}
        </T>
      ) : (
        hint && <T v="small">{hint}</T>
      )}
    </View>
  );
}

export function SwitchRow({ label, description, value, onChange, disabled }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <T>{label}</T>
        {description && <T v="small">{description}</T>}
      </View>
      <RNSwitch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: c.success, false: c.subtle }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

/** Opção em cartão (tipo de veículo) */
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ paddingHorizontal: space.lg, height: 44, justifyContent: 'center', borderRadius: radius.field, borderWidth: 1.5, borderColor: selected ? c.primary : c.line, backgroundColor: selected ? c.primarySoft : c.surface }}
    >
      <T v="label" color={selected ? 'primaryText' : 'ink'}>
        {label}
      </T>
    </Pressable>
  );
}

// ── tela

export function Screen({ children, refreshing, onRefresh, title }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; title?: string }) {
  const c = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.canvas }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}
      >
        {title && <T v="h1">{title}</T>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Loading() {
  const c = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.canvas }}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}
