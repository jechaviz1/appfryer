import { useEffect, useState } from "react"
import { Pressable, Image, StyleSheet } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { ScrollView, Text, View } from "@/components/base/BaseComponents"
import { isLight, theme } from "@/constants/Theme"
import { useAppState, IStaticPage } from "@/contexts/appStateContext"
import { useAuth } from "@/contexts/authContext"
import { get } from "@/services/apiRequests"
import { logError } from "@/services/utils"

export default function CustomPage() {
    const { i18n } = useTranslation()
    const router = useRouter()
    const { name } = useGlobalSearchParams()

    const [ isLoaded, setLoaded ] = useState(false)
    const [ title, setTitle ] = useState('')
    const [ content, setContent ] = useState('')

    const { user } = useAuth()
    const { appState, setAppState } = useAppState()

    const fetchPages = () => {
        const url = '/public/pages/' + i18n.language
        get({ url, token: user?.token })
            .then((pages) => {
                setLoaded(true)
                const now = new Date()
                const preparedPages: IStaticPage[] = pages.map((p: any) => ({ ...p, language: i18n.language, fetchedAt: now }))

                setAppState({ ...appState, staticPages: preparedPages })
                const page = preparedPages.find(p => p.name === name)
                if (!page) {
                    return router.canGoBack() ? router.back() : router.navigate('/')
                }

                setTitle(page.title)
                setContent(page.body)
            })
            .catch(logError)
    }

    useEffect(() => {
        if (!name) {
            router.canGoBack() ? router.back() : router.navigate('/')
            return
        }

        const page = appState.staticPages.find(p => p.name === name)
        if (!page || page.language !== i18n.language) {
            fetchPages()
            return
        }
        setLoaded(true)
    }, [])

    useEffect(() => {
        if (!isLoaded) {
            return
        }
        
        const page = appState.staticPages.find(p => p.name === name)
        if (!page) {
            return
        }

        // display immediately fetched page
        setTitle(page.title)
        setContent(page.body)
        // and try to update it every day
        if (page.fetchedAt.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
            fetchPages()
        }
    }, [isLoaded, appState.staticPages])
    

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={[theme.titleContainer, {marginBottom: 32}]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="subtitle">{title}</Text>
                    </Pressable>
                </View>
                <View style={s.main}>
                    <View style={theme.section}>
                        {content.split('\n').map((t, i) => <Text key={i}>{t}</Text>)}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
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
        paddingBottom: 80,
    },
})