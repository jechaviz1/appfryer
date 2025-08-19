// import { ScrollView as NativeScrollView, type ScrollViewProps } from 'react-native'
import { ScrollView as GestureScrollView, GestureHandlerRootView } from 'react-native-gesture-handler'

import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedScrollViewProps = React.ComponentProps<typeof GestureScrollView> & {
    style?: any
    lightColor?: string
    darkColor?: string
    children?: any
    horizontal?: boolean
};

export function ScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')

    return (
        <GestureHandlerRootView style={[{ backgroundColor }, style]} >
            <GestureScrollView {...otherProps} keyboardShouldPersistTaps={'handled'}/>
        </GestureHandlerRootView>
    )
}
