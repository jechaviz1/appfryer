import { useCallback, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Button, ModalTitle, Text, TextInput, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { post } from '@/services/apiRequests'
import { theme } from '@/constants/Theme'
import { logError } from '@/services/utils'

export default function DeleteAccount() {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { setSettings } = useSettings()

    const [email, setEmail] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [isDeleted, setIsDeleted] = useState<boolean>(false)

    const onDelete = useCallback(() => {
        setError('')
        setSentReq(true)
        post({
            url: '/profile/deleteAccount',
            data: { email },
            token: user?.token
        })
            .then(data => {
                if (data?.status !== 'ok') {
                    setError(data.message)
                    setSentReq(false)
                    return
                }
                setIsDeleted(true)
                setTimeout(() => {
                    setUser(null)
                    setSettings(null)
                    AsyncStorage.removeItem('user')
                    AsyncStorage.removeItem('settings')
                    router.navigate('/(auth)/login')
                }, 5000)
            })
            .catch(e => {
                setSentReq(false)
                setError(e.response?.data?.message ?? e.message)
                logError(e)
            })
    }, [email])

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title={t('Delete account & personal data')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')} />

                <Text>
                    {t('Deleting your account (with email {{email}}) is irreversible. Confirm you want to permanently delete account by entering your email below:', { email: user?.email })}
                </Text>

                <TextInput
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text)
                        setError('')
                    }}
                    placeholder={t('Email')}
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    keyboardType="email-address"
                    onBlur={() => {}}
                    styleContainer={s.input}
                />

                {error && <Text type='error'>{error}</Text>}
                <Button
                    onPress={onDelete}
                    disabled={isSentReq || email !== user?.email}
                    style={s.button}
                    text={t('Delete account')}
                />

                {isDeleted &&
                <View style={s.messageWrapper}>
                    <Text type='error' style={s.message}>{t('Your account deleted.')}</Text>
                    <Text type='error' style={s.message}>{t('We will be glad to see you later!')}</Text>
                </View>
                }
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    input: {
        marginVertical: 20,
    },
    button: {
        marginTop: 20,
    },
    messageWrapper: {
        marginVertical: 32,
    },
    message: {
        marginVertical: 8,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'DMSans-Bold',
    },
})