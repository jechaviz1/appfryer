import { Text as NativeText, type TextProps, StyleSheet } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Colors } from '@/constants/Colors'
import { theme } from '@/constants/Theme';

export type ThemedTextProps = TextProps & {
    lightColor?: string
    darkColor?: string
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'caption' |  'link' | 'error' | 'disabled'
};

export function Text({
    style,
    lightColor,
    darkColor,
    type = 'default',
    ...rest
}: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return (
        <NativeText
            style={[
                { color, fontFamily: 'DMSans' },
                type === 'default' ? s.default : undefined,
                type === 'title' ? {...theme.bold, ...s.title} : undefined,
                type === 'defaultSemiBold' ? s.defaultSemiBold : undefined,
                type === 'subtitle' ? {...theme.bold, ...s.subtitle} : undefined,
                type === 'caption' ? {...theme.bold, ...s.caption} : undefined,
                type === 'link' ? s.link : undefined,
                type === 'error' ? s.error : undefined,
                type === 'disabled' ? s.disabled : undefined,
                style,
            ]}
            {...rest}
        />
    )
}

const s = StyleSheet.create({
    default: {
        fontSize: 14,
        lineHeight: 22,
    },
    defaultSemiBold: {
        fontSize: 20,
        lineHeight: 28,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
    },
    title: {
        fontSize: 32,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 22,
    },
    caption: {
        fontSize: 17,
    },
    link: {
        lineHeight: 30,
        fontSize: 14,
        color: Colors.mainColor,
    },
    error: {
        color: Colors.mainColor,
        fontFamily: 'DMSans-Medium',
        fontSize: 14,
    },
    disabled: {
        lineHeight: 30,
        fontSize: 14,
        color: Colors.grey,
    },
})
