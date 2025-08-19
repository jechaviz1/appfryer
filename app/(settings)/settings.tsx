import { Appearance, Image, Linking, Platform, Pressable, StyleSheet, Switch } from "react-native"
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from "react"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
// import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useTranslation } from 'react-i18next'

import { ScrollView, Text, View } from "@/components/base/BaseComponents"
import Preferences from '@/components/modals/Preferences'
import PersonalInfo from '@/components/modals/PersonalInfo'
import ChangePassword from '@/components/modals/ChangePassword'
import { useSettings } from "@/contexts/settingsContext"
import { useAuth } from "@/contexts/authContext"
import { Colors } from "@/constants/Colors"
import { theme, isLight } from '@/constants/Theme'
import { logError } from "@/services/utils"

interface SettingsItem {
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

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')
    const rightChevronLight = require('@/assets/icons/chevron-right-grey.png')
    const rightChevronDark = require('@/assets/icons/chevron-right-light-grey.png')
    const rightArrow = isLight() ? rightChevronLight : rightChevronDark
    const gradientColors = ['#d6a674', Colors.mainColor]
    const rightArrowElem = <Image source={rightArrow} style={s.rightArrow} />

    const getItems = useCallback((): SettingsItem[][] => [
        [
            { label: t('Language'), action: () => router.push('/(settings)/languages'), rightSide: <Text style={s.language} type="link">{langsMap[user?.language as ('en' | 'es' | undefined) ?? 'es']}</Text> },
            { label: t('Preferences'), action: () => setShowPreferences(true), rightSide: rightArrowElem },
            { label: t('Edit password'), action: () => setShowChangePassword(true), rightSide: rightArrowElem },
            { label: t('Dark mode'), action: () => Appearance.setColorScheme(isLight() ? 'dark' : 'light'), rightSide: <Switch value={!isLight()} trackColor={Colors.switchTrack} onValueChange={() => Appearance.setColorScheme(isLight() ? 'dark' : 'light')} /> },
            { label: t('Review App'), action: () => openStore(), rightSide: rightArrowElem },
            { label: t('Activity log'), action: () => router.push('/(settings)/activity-log'), rightSide: rightArrowElem },
            { label: t('Manage notifications'), action: () => router.push('/(settings)/notifications'), rightSide: rightArrowElem },
        ],
        [
            { label: t('About AppFryer'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'about'}}), rightSide: rightArrowElem },
            { label: t('Terms and Conditions'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'terms'}}), rightSide: rightArrowElem },
            { label: t('Latest and Upcoming Updates'), action: () => router.push({pathname: '/(pages)/static-page', params: {name: 'updates'}}), rightSide: rightArrowElem },
        ],
        [
            { label: t('Support'), action: () => {}, rightSide: rightArrowElem },
        ],
        [
            { label: t('Delete account & personal data'), action: () => router.push({pathname: '/(settings)/delete-account'}), rightSide: rightArrowElem },
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
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                { showPreferences && <Preferences isVisible={showPreferences} onHide={() => setShowPreferences(false)} /> }
                { showPersonalInfo && <PersonalInfo isVisible={showPersonalInfo} onHide={() => setShowPersonalInfo(false)} /> }
                { showChangePassword && <ChangePassword isVisible={showChangePassword} onHide={() => setShowChangePassword(false)} /> }

                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="subtitle">{t('Settings')}</Text>
                    </Pressable>
                </View>

                <View style={s.main}>
                    <Pressable onPress={() => setShowPersonalInfo(true)}>
                        <View style={[theme.section, s.brief]}>
                        {avatar && <Image source={avatar} style={ s.avatar } /> }
                        <View style={{ flex: 1 }}>
                            <Text type="defaultSemiBold">{user?.fullname}</Text>
                            <Text style={{ color: isLight() ? Colors.grey : Colors.lightGrey }}>{user?.email}</Text>
                        </View>
                        <Image source={rightArrow} style={s.rightArrow} />
                        </View>
                    </Pressable>

                    {/* <View style={theme.section}>
                        {items[0].map((item, index) => (
                            <Pressable
                                key={index}
                                style={[s.menuItem, index === 0 ? s.menuItemFirst : null, index === items[0].length - 1 ? s.menuItemLast : null]}
                                onPress={() => item.action()}
                            >
                                <Text style={{ flex: 1 }}>{item.label}</Text>
                                {item.rightSide}
                            </Pressable>
                        ))}
                    </View> */}

                    {/* Premium section */}
                    {/* <Pressable onPress={() => router.push('/(pages)/premium')}>
                        <LinearGradient
                            start={{x: 0, y: 0.75}}
                            end={{x: 1, y: 0.25}}
                            colors={gradientColors}
                            style={s.premiumWrapper}
                        >
                            <View style={s.premiumBellCircle}>
                                <Image source={require('@/assets/icons/bell-70.png')} style={s.premiumBell} />
                            </View>
                            <View style={{ backgroundColor: 'transparent' }}>
                                <Text style={[s.premiumText, s.textBold]}>{t('Get premium!')}</Text>
                                <Text style={s.premiumText}>{t('Subscribe today and start exploring a world full of flavor and knowledge!')}</Text>
                            </View>

                        </LinearGradient>
                    </Pressable> */}

                    {/* {getItems().filter((item, index) => index > 0).map((section, index) => ( */}
                    {getItems().map((section, index) => (
                    <View style={theme.section} key={index}>
                        {section.map((item, index) => {
                            const isFirst = index === 0
                            const isLast = index === section.length - 1
                            return (
                            <Pressable
                                key={item.label}
                                style={[s.menuItem, isFirst && s.menuItemFirst, isLast && s.menuItemLast]}
                                onPress={() => item.action()}
                            >
                                <Text style={{ flex: 1 }}>{item.label}</Text>
                                {item.rightSide}
                            </Pressable>
                        )})}
                    </View>
                    ))}

                    {/* <View style={theme.section}>
                        <Pressable onPress={() => generateNotification()}>
                            <Text>Notification token: {settings?.notificationToken}</Text>
                        </Pressable>
                    </View> */}

                    <Pressable onPress={signOut}>
                        <View style={theme.section}>
                            <Text style={{
                                position: 'absolute',
                                top: 0,
                                left: 4,
                                textTransform: 'uppercase',
                                fontSize: 13,
                            }}>AppFryer V{Constants.expoConfig?.version}</Text>
                            <Text type="subtitle" style={{
                                textAlign: 'center',
                                color: Colors.mainColor,
                                fontSize: 14
                            }}>{t('Log out')}</Text>
                        </View>
                    </Pressable>
                </View>
                <View style={s.bottomBar} />
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    topbarWrap: {
        gap: 16,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    topbarInner: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },
    main: {
        width: '100%',
        gap: 16,
    },
    
    brief: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    rightArrow: {
        width: 6,
        height: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGrey,
    },
    menuItemFirst: {
        paddingTop: 0,
    },
    menuItemLast: {
        borderBottomWidth: 0,
        borderBottomColor: Colors.lightGrey,
        paddingBottom: 0,
    },
    language: {
        fontFamily: 'DMSans-Bold',
        fontWeight: '700',
    },
    premiumWrapper: {
        borderRadius: 16,
        width: '100%',
        height: 150,
        paddingLeft: 70,
        paddingRight: 32,
        justifyContent: 'center',
    },
    premiumBellCircle: {
        position: 'absolute',
        top: 22,
        left: 13,
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumBell: {
        width: 17,
        height: 17,
    },
    premiumText: {
        fontSize: 12,
        color: Colors.white,
    },
    textBold: {
        fontSize: 13,
        fontWeight: 'medium',
        fontFamily: 'DMSans-Medium',
    },
    bottomBar: {
        width: '100%',
        height: 80,
    }
})