import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, ModalTitle, ScrollView, Text, View } from "@/components/base/BaseComponents"
import { getBgColor, theme, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { fetchLanguages } from '@/services/fetches'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '@/contexts/themeContext'

export default function Languages() {
    const { user, setUser } = useAuth()
    const { i18n, t } = useTranslation()
    const router = useRouter()
    const { isDark } = useTheme()

    const [languages, setLanguages] = useState<Record<string, string>>({})
    const [currentLang, setCurrentLang] = useState<string>(user?.language ?? languages[i18n.language])

    const s = createStyles(isDark)

    useEffect(() => {
        fetchLanguages(setLanguages)
    }, [])

    const changeLanguage = useCallback((lang: string) => {
        setCurrentLang(lang)
    }, [])

    const applyLanguage = useCallback(() => {
        post({url: '/profile/update', data: {language: currentLang}, token: user?.token})
            .then((userData) => {
                const userUpd = { ...user, ...userData }
                setUser(userUpd)
                AsyncStorage.setItem('user', JSON.stringify(userUpd))
                i18n.changeLanguage(currentLang)
            })
            .catch(logError)
    }, [currentLang])

    return (
        <View style={[theme.container, { backgroundColor: getBgColor() }]}>
            <View style={theme.statusBarHeight} />
            <View style={[theme.mainContainer, { backgroundColor: getBgColor() }]}>
                <ModalTitle title={t('Language')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')} />
                <ScrollView style={{ maxHeight: '85%' }}>
                    <View style={s.langs}>
                        <View style={[{ padding: 15, borderRadius: 12, backgroundColor: getCardBackground() }]}>
                            {Object.keys(languages).map((l) => (
                            <Pressable key={l} onPress={() => changeLanguage(l)}>
                                <View style={s.langTextWrapper}>
                                    <Text style={s.langText}>{languages[l]}</Text>
                                    {l === currentLang && <View style={s.checkmarkWrapper}>
                                        <Image source={require('@/assets/icons/checkmark.png')} style={s.checkmark}/>
                                    </View>}
                                </View>
                                <View style={s.line} />
                            </Pressable>
                            ))}
                        </View>
                        <Button
                            text={t('Apply changes')}
                            onPress={applyLanguage}
                            disabled={currentLang === user?.language}
                            style={s.applyButton}
                        />
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    langs: {
        gap: 16,
        backgroundColor: getBgColor(),
    },
    line: {
        width: '100%',
        height: 1,
        backgroundColor: getBorderColor(),
    },
    langTextWrapper: {
        flexDirection: 'row',
        gap: 6,
        marginVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    langText: {
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        color: getTextColor(),
        fontFamily: 'Poppins-Medium',
    },
    checkmarkWrapper: {
        width: 20,
        height: 20,
        backgroundColor: Colors.mainColor,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        width: 16,
        height: 16,
        tintColor: Colors.white,
    },
    applyButton: {
        backgroundColor: Colors.mainColor,
        marginTop: 8,
    },
    createdAt: {
        fontSize: 11,
        color: getSecondaryTextColor(),
    },
})