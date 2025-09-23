import { Appearance, Image, ImageBackground, Linking, Platform, Pressable, StyleSheet, Switch } from "react-native"
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from "react"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
// import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useTranslation } from 'react-i18next'

import { ScrollView, Text, View } from "@/components/base/BaseComponents"
import Header from '@/components/Header'
import Preferences from '@/components/modals/Preferences'
import PersonalInfo from '@/components/modals/PersonalInfo'
import ChangePassword from '@/components/modals/ChangePassword'
import { useSettings } from "@/contexts/settingsContext"
import { useAuth } from "@/contexts/authContext"
import { Colors } from "@/constants/Colors"
import { theme, isLight, getBgColor } from '@/constants/Theme'
import { logError } from "@/services/utils"

interface SettingsItem {
    key: string
    label: string
    action: () => void
    rightSide?: React.JSX.Element
}

const langsMap = {
    en: 'English',
    es: 'Español',
}

// TODO: replace with right links
const rateUri = Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/fi/app/disney/id6742740366?l=rate'
    : 'market://details?id=com.appfryer.appfryer'

export default function Settings() {
    const router = useRouter()
    const { t, i18n } = useTranslation()

    const { user, setUser } = useAuth()
    const { settings, setSettings } = useSettings()

    const [showPreferences, setShowPreferences] = useState<boolean>(false)
    const [showPersonalInfo, setShowPersonalInfo] = useState<boolean>(false)
    const [showChangePassword, setShowChangePassword] = useState<boolean>(false)
    const [avatar, setAvatar] = useState<any>()

    useEffect(() => {
        user?.profileImageThumb
            ? setAvatar({uri: user.profileImageThumb})
            : setAvatar(require('@/assets/images/icon.png'))
    }, [])

    const openStore = useCallback(() => {
        Linking.canOpenURL(rateUri)
            .then(supported => {
                supported && Linking.openURL(rateUri)
            })
            .catch(logError)
    }, [])

    const signOut = useCallback(() => {
        AsyncStorage.removeItem('user')
            .catch(e => console.log(e))
        AsyncStorage.removeItem('settings')
            .catch(e => console.log(e))
        AsyncStorage.removeItem('preferences')
            .catch(e => console.log(e))

        setUser(null)
        setSettings(null)
        i18n.changeLanguage('es') // default language

        router.navigate('/(auth)/login')
    }, [])

    const rightChevronLight = require('@/assets/icons/chevron-right-neutral-grey.png')
    const rightChevronDark = require('@/assets/icons/chevron-right-light-grey.png')
    const rightArrow = isLight() ? rightChevronLight : rightChevronDark
    const gradientColors = ['#d6a674', Colors.mainColor]
    const rightArrowElem = <Image source={rightArrow} style={s.rightArrow} />

    const getItems = useCallback((): SettingsItem[][] => [
        [
            { key: 'content-creator', label: t('Content creator settings'), action: () => {}, rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'language', label: t('Language'), action: () => router.push('/(settings)/languages'), rightSide: <Text style={s.language}>{langsMap[user?.language as ('en' | 'es' | undefined) ?? 'es']}</Text> },
            { key: 'dark-mode', label: t('Dark mode'), action: () => Appearance.setColorScheme(isLight() ? 'dark' : 'light'), rightSide: <Switch value={!isLight()} style={{ height: 20 }} onValueChange={() => Appearance.setColorScheme(isLight() ? 'dark' : 'light')} /> },
            { key: 'units', label: t('Units of measurement'), action: () => {}, rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'review-app', label: t('Review App'), action: () => openStore(), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'notifications', label: t('Manage notifications'), action: () => router.push('/(settings)/notifications'), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'edit-password', label: t('Edit password'), action: () => setShowChangePassword(true), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
        ],
        [
            { key: 'premium', label: t('Premium'), action: () => router.push('/(pages)/premium') },
        ],
        [
            { key: 'security', label: t('Advanced security and privacy'), action: () => {}, rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'about', label: t('About AppFryer'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'about'}}), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'terms', label: t('Terms and Conditions'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'terms'}}), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
            { key: 'updates', label: t('Latest and Upcoming Updates'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'updates'}}), rightSide: <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.downArrow} /> },
        ]
    ], [user])

    // const generateNotification = async () => {
    //     //show the notification to the user
    //     Notifications.scheduleNotificationAsync({
    //         //set the content of the notification
    //         content: {
    //             title: "Local Notification",
    //             body: "body",
    //             data: {recipe: 14},
    //         },
    //         trigger: null,
    //     })
    // }

    return (
        <View style={s.container}>
            <View style={theme.statusBarHeight} />
            <Header 
                title={t('Settings')}
                onBack={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile')}
            />
            <ScrollView style={s.mainContainer}>
                { showPreferences && <Preferences isVisible={showPreferences} onHide={() => setShowPreferences(false)} /> }
                { showPersonalInfo && <PersonalInfo isVisible={showPersonalInfo} onHide={() => setShowPersonalInfo(false)} /> }
                { showChangePassword && <ChangePassword isVisible={showChangePassword} onHide={() => setShowChangePassword(false)} /> }

                <View style={s.main}>
                    {/* User Profile Section */}
                    <Pressable onPress={() => setShowPersonalInfo(true)}>
                        <View style={s.profileSection}>
                            {avatar && <Image source={avatar} style={s.avatar} /> }
                            <View style={s.profileInfo}>
                                <Text style={s.profileName}>{user?.fullname}</Text>
                                <Text style={s.profileEmail}>{user?.email}</Text>
                            </View>
                            <Image source={rightArrow} style={s.rightArrow} />
                        </View>
                    </Pressable>

                    {/* Settings Items */}
                    {getItems().map((section, index) => (
                        <View style={s.menuSection} key={index}>
                            {section.map((item, index) => {
                                const isFirst = index === 0
                                const isLast = index === section.length - 1
                                
                                // Replace premium menu item with Premium Section
                                if (item.key === 'premium') {
                                    return (
                                        <Pressable key={item.key} onPress={() => item.action()}>
                                            <ImageBackground 
                                                source={require('@/assets/images/premium-bg.png')} 
                                                style={s.premiumCard}
                                                imageStyle={s.premiumBackgroundImage}
                                            >
                                                <Image source={require('@/assets/images/diamond.png')} style={s.premiumIcon} />
                                                <Text style={s.premiumTitle}>{t('Go Premium!')}</Text>
                                                <Text style={s.premiumDescription}>
                                                    {t('Subscribe today and start exploring a world full of flavor and knowledge.')}
                                                </Text>
                                            </ImageBackground>
                                        </Pressable>
                                    )
                                }
                                
                                return (
                                    <Pressable
                                        key={item.key}
                                        style={[s.menuItem, isFirst && s.menuItemFirst, isLast && s.menuItemLast]}
                                        onPress={() => item.action()}
                                    >
                                        <Text style={s.menuItemText}>{item.label}</Text>
                                        {item.rightSide}
                                    </Pressable>
                            )})}
                        </View>
                    ))}

                    {/* Logout Button */}
                    <Pressable onPress={signOut}>
                        <View style={s.logoutContainer}>
                            <Text style={s.logoutText}>{t('Log out')}</Text>
                        </View>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#F8F5F0',
    },
    main: {
        width: '100%',
        gap: 16,
        paddingHorizontal: 25,
        backgroundColor: getBgColor(),
    },
    profileSection: {
        backgroundColor: '#ECD8C4',
        borderRadius: 13,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 30,
        marginBottom: 16,
    },
    profileInfo: {
        flex: 1,
        backgroundColor: '#ECD8C4',
    },
    profileName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        fontWeight: '500',
        color: '#1B1A1D',
    },
    profileEmail: {
        fontFamily: 'Poppins',
        fontSize: 14,
        color: '#6C7278',
        marginTop: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#C28040',
    },
    rightArrow: {
        width: 13,
        height: 25,
        tintColor: '#C28040',
    },
    downArrow: {
        width: 25,
        height: 13,
        tintColor: '#C28040',
    },
    settingsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    menuSection: {
        backgroundColor: 'transparent',
        gap: 13,
    },
    menuItem: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
    },
    menuItemFirst: {
        paddingTop: 16,
    },
    menuItemLast: {
        borderBottomWidth: 0,
        paddingBottom: 16,
    },
    menuItemText: {
        fontFamily: 'Poppins',
        flex: 1,
        fontSize: 15,
        color: '#919191',
    },
    language: {
        fontFamily: 'Poppins',
        fontSize: 15,
        color: '#C28040',
    },
    premiumCard: {
        borderRadius: 16,
        paddingHorizontal: 40,
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 182,
        justifyContent: 'center',
    },
    premiumBackgroundImage: {
        borderRadius: 10,
        resizeMode: 'cover',
    },
    premiumIcon: {
        width: 84,
        height: 84,
    },
    premiumTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'center',
        color: Colors.white,
        marginBottom: 10,
    },
    premiumDescription: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        color: Colors.white,
    },
    logoutContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    logoutText: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        textDecorationLine: 'underline',
        color: '#C28040',
    },
})