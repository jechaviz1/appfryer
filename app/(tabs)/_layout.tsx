import React, { useEffect, useRef, useState } from 'react'
import { Image, Platform, View, StyleSheet } from 'react-native'
import { Redirect, router, Tabs } from 'expo-router'
import Modal from "react-native-modal"
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import * as Notifications from 'expo-notifications'

import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

import { ModalTitle, Text } from '@/components/base/BaseComponents'
import TabBarIcons from '@/components/TabBarIcons'
import { get, post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { useAppState } from '@/contexts/appStateContext'
import { theme, getBgColor } from '@/constants/Theme'
import { logError } from '@/services/utils'

export default function TabLayout() {
    const { t, i18n } = useTranslation()

    const { user, setUser } = useAuth()
    const { setSettings } = useSettings()
    const { appState, setAppState } = useAppState()
    const colorScheme = useColorScheme()

    const [isNeedToLogin, setIsNeedToLogin] = useState<boolean>(false)

    const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false)
    const [requiredUpdate, setRequiredUpdate] = useState<boolean>(false)
    const [newVersion, setNewVersion] = useState<string>('')

    const notificationListener = useRef<Notifications.Subscription>()
    const notificationOnTapListener = useRef<Notifications.Subscription>()

    async function registerForPushNotificationsAsync() {
        let token
        const {status: existingStatus} = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!')
            return
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '5b40e441-8fd7-4b98-b607-8ca178ac4447'           // from app.json expo/extra/eas/projectId
            });
            const token = tokenData.data;
            console.log('getExpoPushTokenAsync:', token)
            return token
        } catch (error) {
            alert('Failed to get token:\n' + JSON.stringify(error));
        }

        return
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: true,
        }),
    })

    // it's entry point for the app, so we will check if user is authenticated
    // from AsyncStorage instead of useAuth that common for other places
    useEffect(() => {
        AsyncStorage.getItem('user')
            .then(async (userStr: string | null) => {
                if (!userStr) {
                    setIsNeedToLogin(true)
                    return
                }
                const userObj = JSON.parse(userStr)
                if (!userObj?.token || !userObj?.authenticated) {
                    setIsNeedToLogin(true)
                    return
                }
                setUser(prev => ({...prev, ...userObj}))
                // user is authenticated, but we need to update the actual data
                get({url: '/profile/me', token: userObj?.token})
                    .then(userData => {
                        setUser(prev => ({...prev, ...userData}))
                        AsyncStorage.setItem('user', JSON.stringify({...userObj, ...userData}))
                        if (userData.language) {
                            i18n.changeLanguage(userData.language)
                        }
                    })
                    .catch(logError)

                const settingsStr = await AsyncStorage.getItem('settings')
                const settings = settingsStr ? JSON.parse(settingsStr) : {}

                // get notification token
                if (!settings?.notificationToken) {
                    registerForPushNotificationsAsync()
                        .then(notificationToken => {
                            if (!notificationToken) {
                                return
                            }
                            const settingsUpd = { ...settings, notificationToken }
                            setSettings(settingsUpd)
                            AsyncStorage.setItem('settings', JSON.stringify(settingsUpd))
                            const osField = Platform.OS === 'ios' ? 'tokenIos' : 'tokenAndroid'
                            post({
                                url: '/profile/settings/notification',
                                data: {[osField]: notificationToken},
                                token: userObj?.token
                            })
                                .catch(logError)
                        })
                        .catch(logError)
                }

                // set up listener when app is foreground, background or killed
                if (!notificationListener.current) {
                    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                    console.log('notification received', notification)
                    setAppState({...appState, isNewNotifications: true})
                })
                }
                if (!notificationOnTapListener.current) {
                    notificationOnTapListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                        console.log('notification tapped:', response)
                        console.log('data', response.notification.request.content.data)
                        if (response.notification.request.content.data?.recipe) {
                            const recipeId = response.notification.request.content.data.recipe
                            router.push({
                                pathname: `/(pages)/recipe/${recipeId}` as '(pages)/recipe/[:id]',
                                // params: {id: recipeId}
                            })
                        }
                    })
                }

                return () => {
                    console.log('---> unsubscribe')

                    notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current)
                    notificationOnTapListener.current && Notifications.removeNotificationSubscription(notificationOnTapListener.current)
                }
            })
            .catch(logError)
    }, [])

    useEffect(() => {
        if (!user?.token) {
            return
        }
        post({
            url: '/system/updates',
            data: {
                platform: Platform.OS,
                platformVersion: Platform.Version,
                appVersion: Constants.expoConfig?.version,
            },
            token: user?.token,
        })
            .then((data: {
                currentAppVersion: string,
                isUpdateAvailable: boolean,
                isUpdateRequired: boolean,
                isNewNotifications: boolean
            }) => {
                setAppState({ ...appState, isNewNotifications: data.isNewNotifications })
                if (data.isUpdateAvailable) {
                    setShowNewVersionModal(true)
                    setRequiredUpdate(data.isUpdateRequired)
                    setNewVersion(data.currentAppVersion)
                }
            })
            .catch(logError)
    }, [user?.token])

    if (isNeedToLogin) {
        return <Redirect href="/(auth)/login" />
    }

    return (
        <View style={{height: '100%'}}>
            {/* New version modal */}
            <Modal
                isVisible={showNewVersionModal}
                onBackdropPress={() => requiredUpdate ? {} : setShowNewVersionModal(false)}
                style={[theme.modal, s.modal, { backgroundColor: getBgColor() }]}
            >
                <View>
                    <ModalTitle title={t('New version available')} onHide={() => requiredUpdate ? {} : setShowNewVersionModal(false)} />
                    <Text type='caption' style={s.modalText}>{t('Version: {{version}}', {version: Constants.expoConfig?.version})}</Text>
                    <Text type='caption' style={s.modalText}>{t('New version: {{version}}', {version: newVersion})}</Text>
                    {requiredUpdate && (
                        <Text type='error' style={[theme.bold, {marginTop: 20}]}>{t('You need to update the app to use the new version')}</Text>
                    )}
                </View>
            </Modal>
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarStyle: s.tabBar,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused ? TabBarIcons.HomeActiveIcon : TabBarIcons.HomeIcon}
                            style={s.iconSize}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused ? TabBarIcons.SearchActiveIcon : TabBarIcons.SearchIcon}
                            style={s.iconSize}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="news"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused ? TabBarIcons.NewsActiveIcon : TabBarIcons.NewsIcon}
                            style={s.iconSize}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-space"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused ? TabBarIcons.MySpaceActiveIcon : TabBarIcons.MySpaceIcon}
                            style={s.iconSize}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused ? TabBarIcons.PersonActiveIcon : TabBarIcons.PersonIcon}
                            style={s.iconSize}
                        />
                    ),
                }}
            />
        </Tabs>
        </View>
    )
}

const s = StyleSheet.create({
    tabBar: {
        height: 86,
        paddingBottom: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 10,
    },
    plusIconWrapper: {
        backgroundColor: '#C3803A',
        borderRadius: 100,
        paddingTop: 6,
        position: 'relative',
        width: 47,
        height: 47,
    },
    iconSize: {
        width: 22,
        height: 22,
    },
    modal: {
        justifyContent: 'flex-start',
        marginTop: '100%',
    },
    modalText: {
        marginVertical: 8,
    },
})