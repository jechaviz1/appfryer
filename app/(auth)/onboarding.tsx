import { Dimensions, FlatList, Image, Pressable, StyleSheet } from "react-native"
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

import { Lines, Text, View } from "@/components/base/BaseComponents"
import { useSettings } from "@/contexts/settingsContext"
import { theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { get } from "@/services/apiRequests"
import { logError } from "@/services/utils"

//

interface ISlide {
    title: string,
    body: string,
    photo: any,
}

export default function Onboarding() {
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const { settings, setSettings } = useSettings()

    const sliderRef = useRef<FlatList<ISlide>>(null)
    const [currentSlide, setCurrentSlide] = useState<number>(0)
    const [slides, setSlides] = useState<ISlide[]>([])

    useEffect(() => {
        get({url: '/public/onboarding/' + i18n.language})
            .then((res: any) => setSlides(res))
            .catch(logError)
    }, [])

    useEffect(() => {
        sliderRef.current?.scrollToIndex({
            index: currentSlide,
            animated: true,
        })
    }, [currentSlide])

    const window = Dimensions.get('window')

    const showNextSlide = useCallback(() => setCurrentSlide(currentSlide + 1), [currentSlide])
    //
    
    const goBack = useCallback(() => {
        const settingsTmp = { ...settings, onboardingViewed: true }
        AsyncStorage.setItem('settings', JSON.stringify(settingsTmp))
            .catch(e => console.log(e))
        setSettings(settingsTmp)
        router.canGoBack()
            ? router.back()
            : router.push('/(auth)/login')
    }, [settings])

    const renderItem = useCallback((slide: { item: ISlide, index: number }) => {
        if (currentSlide !== slide.index) {
            return <View style={{ width: window.width }} />
        }

        return (
            <View style={[s.slideContainer, { width: window.width, height: window.height }] }>
                { slide.item.photo && (
                    <Image
                        source={{ uri: slide.item.photo }}
                        resizeMode="cover"
                        style={[s.heroImage, { width: window.width, height: window.height * 0.5 }]}
                    />
                )}

                <View style={[s.contentCard, { top: window.height * 0.5 - 70 }]}>
                    <View style={s.iconHolder}>
                        <Image
                            source={require('@/assets/images/ologo.png')}
                            style={s.icon}
                            resizeMode="contain"
                        />
                    </View>

                    { slide.item.title && (
                        <Text type="subtitle" style={ s.subtitle }>
                            {slide.item.title}
                        </Text>
                    ) }
                    { slide.item.body && (
                        <Text style={ s.body }>
                            {slide.item.body}
                        </Text>
                    ) }

                    <View style={{ marginTop: 54 }}>
                        <Lines count={slides.length} current={slide.index} />
                    </View>
                </View>
            </View>
        )
    }, [currentSlide, slides])

    return (
        <View style={[theme.container, { flex: 1, backgroundColor: Colors.white }] }>
            <View style={theme.statusBarHeight} />
            { slides.length > 0 && (
                <FlatList
                    ref={sliderRef}
                    data={slides}
                    renderItem={renderItem}
                    initialScrollIndex={currentSlide}
                    horizontal
                    style={s.flatList}
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                />
            ) }

            <View style={s.bottomControls}>
                <Pressable onPress={goBack}>
                    <Text type="link" style={s.skipText}>
                        {currentSlide !== slides.length - 1 ? t('Skip') : t('Done')}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={currentSlide !== slides.length - 1 ? showNextSlide : goBack}
                    style={s.fab}
                >
                    <Image
                        source={require('@/assets/icons/chevron-right-full.png')}
                        style={s.fabIcon}
                    />
                </Pressable>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    flatList: {
        flexDirection: 'row',
        flex: 1,
    },
    slideContainer: {
        backgroundColor: Colors.white,
    },
    heroImage: {
        backgroundColor: Colors.white,
    },
    contentCard: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 70,
        borderColor: Colors.black,
        paddingHorizontal: 38,
        paddingTop: 28,
        paddingBottom: 88,
        alignItems: 'center',
    },
    iconHolder: {
        width: 63,
        height: 63,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 29,
    },
    icon: {
        width: 63,
        height: 63,
    },
    subtitle: {
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 20,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#1B1A1D',
        marginBottom: 20,
    },
    body: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        textAlign: 'center',
        color: Colors.greyTextColor,
    },
    bottomControls: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skipText: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontStyle: 'normal',
        fontSize: 16,
        letterSpacing: 0,
        textAlign: 'center',
        color: Colors.greyTextColor,
    },
    fab: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 6,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
    },
    fabIcon: {
        width: 44,
        height: 44,
    },
})