import { Dimensions, FlatList, Image, Pressable, StyleSheet } from "react-native"
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

import { Button, Lines, ScrollView, Text, View } from "@/components/base/BaseComponents"
import { useSettings } from "@/contexts/settingsContext"
import { paddings, theme } from '@/constants/Theme'
import { get } from "@/services/apiRequests"
import { logError } from "@/services/utils"

function FullImage({ source }: any) {
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        Image.getSize(source, (w, h) => {
            setWidth(w)
            setHeight(h)
        })
    }, [source])

    const windowWidth = Dimensions.get('window').width

    return (
        <Image
            source={{uri: source}}
            style={[ s.image, {
                width: windowWidth - paddings * 2,
                height: (width && height) ? height * (windowWidth - paddings * 2) / width : 40,
            }]}
        />
    )
}

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
    const showPrevSlide = useCallback(() => setCurrentSlide(currentSlide - 1), [currentSlide])
    
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
            return <View style={{width: window.width - paddings * 2}} />
        }

        return (
            <View style={[ theme.mainContainer, s.main, { width: window.width - paddings * 2 }]}>
                { slide.item.photo && <FullImage source={slide.item.photo} /> }
                { slide.item.title && <Text type="subtitle" style={ s.subtitle }>{slide.item.title}</Text> }
                { slide.item.body && <Text style={{ textAlign: 'center' }}>{slide.item.body}</Text> }
                
                <View style={{ marginTop: 40 }}>
                    <Lines count={slides.length} current={slide.index} />
                </View>

                <View style={s.navButtons}>
                    {slide.index !== 0 && 
                        <Pressable onPress={showPrevSlide}>
                            <View><Text type="link">{t('Prev')}</Text></View>
                        </Pressable>
                    }
                    <Button
                        shape="round"
                        size="large"
                        text={slide.index !== slides.length - 1 ? t('Next') : t('Done')}
                        onPress={slide.index !== slides.length - 1 ? showNextSlide : goBack}
                        isWide={false}
                        style={{ marginTop: 20, paddingLeft: 50, paddingRight: 50 }}
                    />
                </View>
            </View>
        )
    }, [currentSlide, slides])

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={[theme.mainContainer, { paddingBottom: 80 }]}>
                <Pressable onPress={goBack}>
                    <Text type="link" style={{ alignSelf: 'flex-end' }}>
                        {currentSlide !== slides.length - 1 ? t('Skip') : t('Done')}
                    </Text>
                </Pressable>
                { slides.length > 0 && <FlatList
                    ref={sliderRef}
                    data={slides}
                    renderItem={renderItem}
                    initialScrollIndex={currentSlide}
                    horizontal
                    style={s.flatList}
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                /> }
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    main: {
        alignItems: 'center',
    },
    flatList: {
        flexDirection: 'row',
        marginTop: 40,
    },
    image: {
        marginBottom: 20,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 20,
    }, 
    navButtons: {
        flexDirection: 'column',
        // flex: 1,
        marginTop: 40,
        width: '100%',
        alignItems: 'center',
    },
})