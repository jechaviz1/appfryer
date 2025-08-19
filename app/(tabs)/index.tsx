import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Notifications from '@/components/modals/Notifications'
import Stories from '@/components/Stories'
import { theme, isLight } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { useAppState } from '@/contexts/appStateContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IRecipe from '@/interfaces/Recipe'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'

const storiesFake = [
    { id: 1, image: 'https://picsum.photos/200', name: 'Shiovan', link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 2, image: 'https://picsum.photos/200', name: 'Marcia Hernandez', link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 3, image: 'https://picsum.photos/200', name: 'Greg Egan', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
    { id: 4, image: 'https://picsum.photos/200', name: 'Emma', viewed: true, link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 5, image: 'https://picsum.photos/200', name: 'Jaime', viewed: true, link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 6, image: 'https://picsum.photos/200', name: 'Miguel', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
]

export default function HomeScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user, setUser } = useAuth()
    const { searchFilters, setSearchFilters } = useSearchFilters()
    const { appState, setAppState } = useAppState()

    const [avatar, setAvatar] = useState<any>()
    const [showNotifications, setShowNotifications] = useState<boolean>(false)

    const [tabs] = useState([
        {title: 'New', icon: require('@/assets/icons/lightning.png'), type: 'new'},
        {title: 'Trend', icon: require('@/assets/icons/fire.png'), type: 'trend'},
        {title: 'Seasonal', icon: require('@/assets/icons/leaf.png'), type: 'seasonal'},
    ])

    useFocusEffect(useCallback(() => {
        if (!user) {
            return
        }
        
        get({url: '/profile/me', token: user?.token})
            .then(userData => setUser({...user, ...userData}))
            .catch(e => logError(e, 'Failed to get user data'))
    }, []))

    useEffect(() => {
        user?.profileImageThumb
            ? setAvatar({uri: user.profileImageThumb})
            : setAvatar(require('@/assets/images/icon.png'))
    }, [user])

    const bellIcon = isLight() ? require('@/assets/icons/bell-black.png') : require('@/assets/icons/bell-white.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <Notifications isVisible={showNotifications} onHide={() => setShowNotifications(false)} />

                <View style={s.topSide}>
                    <View style={s.welcomeBack}>
                        { avatar && <Image source={avatar} style={s.avatar} /> }
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: isLight() ? Colors.grey : Colors.lightGrey }}>{t('Welcome back,')}</Text>
                            <Text type="defaultSemiBold" style={{ fontSize: 15 }}>{user?.fullname}</Text>
                        </View>
                        <Pressable onPress={() => {
                            setShowNotifications(true)
                            setAppState({ ...appState, isNewNotifications: false })
                        }}>
                            <Image source={bellIcon} style={s.notificationIcon} />
                             { appState.isNewNotifications && <View style={[s.notificationMarker, { borderColor: isLight() ? Colors.white : Colors.black}]} />}
                        </Pressable>
                    </View>
                    {/* <Stories storiesArray={storiesFake} /> */}

                    {/* Quiz banner */}
                    <Pressable style={s.quizBanner} onPress={() => router.navigate('/(pages)/quiz')}>
                        <Image
                            source={require('@/assets/images/quiz-banner.png')}
                            style={s.quizBannerImg}
                            resizeMode="contain"
                        />
                        <Text type="subtitle" style={s.quizBannerText}>{t('What would you like to eat?')}</Text>
                        <Button
                            text={t('Try out')}
                            onPress={() => router.navigate('/(pages)/quiz')}
                            style={s.quizBannerBtn}
                            isWide={false}
                            size="small"
                            textStyle={[theme.bold, s.quizBannerBtnText]}
                        />
                    </Pressable>

                    <Button
                        text={t('Browse all recipes')}
                        onPress={() => router.navigate('/(tabs)/news')}
                        style={s.browseAllBtn}
                    />

                </View>
                
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    topSide: {
        gap: 20,
    },
    welcomeBack: {
        flexDirection: 'row',
        gap: 10,
    },
    avatar: {
        width: 47,
        height: 47,
        borderRadius: 999,
    },
    notificationIcon: {
        width: 21,
        height: 21,
        marginTop: 4,
        marginRight: 2,
    },
    notificationMarker: {
        position: 'absolute',
        top: 4,
        right: 0,
        width: 12,
        height: 12,
        borderWidth: 2,
        borderRadius: 999,
        backgroundColor: 'red',
    },
    // Quiz
    quizBanner: {
        position: 'relative',
        alignContent: 'center',
        justifyContent: 'center',
        marginTop: 20,
        minHeight: 162,
        maxHeight: 182,
    },
    quizBannerImg: {
        width: '100%',
    },
    quizBannerText: {
        color: Colors.white,
        position: 'absolute',
        top: 32,
        left: 16,
        width: '50%',
    },
    quizBannerBtn: {
        position: 'absolute',
        bottom: 22,
        left: 16,
        backgroundColor: Colors.white,
        paddingHorizontal: 18,
    },
    quizBannerBtnText: {
        color: Colors.mainColor,
    },

    browseAllBtn: {
        marginTop: 20,
    },
})
