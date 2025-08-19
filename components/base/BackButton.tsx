import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

import { theme } from '@/constants/Theme'

export function BackButton() {
    const router = useRouter()

    const goBack = () => {
        if (router.canGoBack()) {
            router.back()
            return
        }

        router.push('/(tabs)/')
    }

    return (
        <Pressable onPress={goBack} style={[theme.backButton, s.backButton]}>
            <Image source={require('@/assets/icons/chevron-left.png')} style={{ width: 20, height: 20 }} />
        </Pressable>
    )
}

const s = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 18,
        left: 18,
    },
})