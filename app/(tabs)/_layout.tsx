import React, { useEffect, useRef, useState } from 'react'
import { Image, Platform, View, StyleSheet, Pressable } from 'react-native'
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
        // Skip push notifications in development mode
        if (__DEV__) {
            console.log('Skipping push notification setup in development mode')
            return null
        }

        let token
        const {status: existingStatus} = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted for push notifications')
            return null
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '5b40e441-8fd7-4b98-b607-8ca178ac4447'           // from app.json expo/extra/eas/projectId
            });
            const token = tokenData.data;
            console.log('getExpoPushTokenAsync:', token)
            return token
        } catch (error) {
            console.log('Failed to get push notification token:', error)
            // Don't show alert, just log the error and continue
            return null
        }
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
                                console.log('No notification token received, skipping notification setup')
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
                                .then(() => console.log('Notification token sent to server'))
                                .catch(error => {
                                    console.log('Failed to send notification token to server:', error)
                                    // Don't block the app if notification setup fails
                                })
                        })
                        .catch(error => {
                            console.log('Notification registration failed:', error)
                            // Don't block the app if notification setup fails
                        })
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
                    tabBarActiveTintColor: Colors.mainColor,
                    tabBarInactiveTintColor: '#6C7278',
                    headerShown: false,
                    tabBarStyle: s.tabBar,
                    tabBarLabelStyle: s.tabBarLabel,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t('Home'),
                        tabBarIcon: ({ focused }) => (
                            <View style={s.iconContainer}>
                                <Image
                                    source={focused ? TabBarIcons.HomeActiveIcon : TabBarIcons.HomeIcon}
                                    style={[s.iconSize, { tintColor: focused ? Colors.mainColor : '#6C7278' }]}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="explore"
                    options={{
                        title: t('Explore'),
                        tabBarIcon: ({ focused }) => (
                            <View style={s.iconContainer}>
                                <Image
                                    source={focused ? TabBarIcons.SearchActiveIcon : TabBarIcons.SearchIcon}
                                    style={[s.iconSize, { tintColor: focused ? Colors.mainColor : '#6C7278' }]}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="create"
                    options={{
                        title: "",
                        tabBarIcon: ({ focused }) => (
                            <View style={s.plusButtonContainer}>
                                <View style={s.plusButton}>
                                    <Image
                                        source={TabBarIcons.PlusIcon}
                                        style={[s.plusIconSize]}
                                    />
                                </View>
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="space"
                    options={{
                        title: t('My Space'),
                        tabBarIcon: ({ focused }) => (
                            <View style={s.iconContainer}>
                                <Image
                                    source={focused ? TabBarIcons.BookActiveIcon : TabBarIcons.BookIcon}
                                    style={[s.iconSize, { tintColor: focused ? Colors.mainColor : '#6C7278' }]}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t('Profile'),
                        tabBarIcon: ({ focused }) => (
                            <View style={s.iconContainer}>
                                <Image
                                    source={focused ? TabBarIcons.UserActiveIcon : TabBarIcons.UserIcon}
                                    style={[s.iconSize, { tintColor: focused ? Colors.mainColor : '#6C7278' }]}
                                />
                            </View>
                        ),
                    }}
                />
            </Tabs>
        </View>
    )
}

const s = StyleSheet.create({
    tabBar: {
        height: 74,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    tabBarLabel: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 12,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButton: {
        borderRadius: 22,
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    iconSize: {
        width: 24,
        height: 24,
    },
    plusIconSize: {
        width: 46,
        height: 46,
    },
    modal: {
        justifyContent: 'flex-start',
        marginTop: '100%',
    },
    modalText: {
        marginVertical: 8,
    },
})