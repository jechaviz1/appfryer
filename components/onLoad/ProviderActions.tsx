import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { useAppState } from '@/contexts/appStateContext'
import { post, setLogoutHandler } from '@/services/apiRequests'
import { logError } from '@/services/utils'

export default function ProviderActions({ children }: { children: React.ReactNode }) {
    const [isUserLoaded, setUserLoaded] = useState<boolean>(false)
    const [isSettingsLoaded, setSettingsLoaded] = useState<boolean>(false)
    const [isLanguageLoaded, setLanguageLoaded] = useState<boolean>(false)

    const [view, setView] = useState<React.ReactNode>(<View />)

    const { user, setUser } = useAuth()
    const { settings, setSettings } = useSettings()
    const { appState, setAppState } = useAppState()

    const reloadTranslations = useCallback(() => {
        console.log('reload translations')
        if (i18n && typeof i18n.reloadResources === 'function') {
            i18n.reloadResources()
        }
    }, [])

    useEffect(() => {
        setLogoutHandler(() => {
            setUser(null)
            AsyncStorage.removeItem('user')
                .catch(e => logError(e, 'Failed to remove user from AsyncStorage'))
        })
    }, [setUser])

    useEffect(() => {
        AsyncStorage.getItem('user')
            .then(userData => {
                if (userData) {
                    setUser(JSON.parse(userData))
                }
                setUserLoaded(true)
            })
            .catch(logError)
        AsyncStorage.getItem('settings')
            .then(settingsStr => {
                if (settingsStr) {
                    const settingsData = JSON.parse(settingsStr)
                    setSettings(settingsData)
                    if (i18n && typeof i18n.changeLanguage === 'function') {
                        i18n.changeLanguage(settingsData.language)
                    }
                }
                setSettingsLoaded(true)
            })
            .catch(logError)

        AsyncStorage.removeItem('filtersCategoriesLastUpdate')
        AsyncStorage.removeItem('filtersIngredientsLastUpdate')
        AsyncStorage.removeItem('filtersDietsLastUpdate')
        console.log('Reset all LastUpdate timestamps on app startup')
    }, [])

    useEffect(() => {
        if ((!isUserLoaded && !isSettingsLoaded) || isLanguageLoaded) {
            return
        }
        i18n
            .use(initReactI18next)
            .use(HttpBackend)
            .init({
                debug: false,
                lng: user?.language ?? 'es',
                fallbackLng: 'en',
                saveMissing: true,
                backend: {
                    loadPath: `${process.env.EXPO_PUBLIC_URL}/translations/{{lng}}.json`,
                    parse: (data: string) => {
                        return JSON.parse(data).translation
                    },
                },
                missingKeyHandler,
                // resources: {
                //     en: {
                //         translation: enJson.translation,
                //     },
                // },
            })
            .then(() => {
                setLanguageLoaded(true)
            })
    }, [isUserLoaded, isSettingsLoaded, isLanguageLoaded])

    useEffect(() => {
        if (isUserLoaded && isSettingsLoaded) {
            setView(children)
        }
    }, [isUserLoaded, isSettingsLoaded])

    // Set up translations after i18n is initialized
    useEffect(() => {
        if (!isLanguageLoaded) return;

        // reload at startup
        reloadTranslations()

        // reload every hour
        const interval = setInterval(reloadTranslations, 1000 * 60 * 60) // every hour

        // Clean up interval on unmount
        return () => clearInterval(interval)
    }, [isLanguageLoaded, reloadTranslations])

    const sendMissingKey = useCallback((key: string) => {
        if (!user?.token) {
            return
        }
        post({
            url: '/locale/translate',
            data: { phrase: key },
            token: user?.token,
        })
            .then((status: string) => {
                console.log(`Translation: '${key}': ${status}`)
                if (status === 'update') {
                    if (i18n && typeof i18n.reloadResources === 'function') {
                        i18n.reloadResources()
                    }
                }
            })
            .catch(logError)
    }, [i18n, user?.token])

    const missingKeyHandler = useCallback((lngs: readonly string[], ns: string, key: string) => {
        setTimeout(() => {
            setAppState(prev => {
                if (prev.sendedMissingTranslations.includes(key)) {
                    return prev
                }
                sendMissingKey(key)
                return {...prev, sendedMissingTranslations: [...prev.sendedMissingTranslations, key]}
            })
        }, 0)
    }, [user?.token, appState])

    return view
}
