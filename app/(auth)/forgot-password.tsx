import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { theme } from '@/constants/Theme'
import { Text, View } from "@/components/base/BaseComponents"

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={theme.titleContainer}>
                    <Text type="title">{t('Forgot Password')}</Text>
                </View>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                    <Text type="link">{t('Back to login page')}</Text>
                </Pressable>
            </View>
        </View>
    )
}
