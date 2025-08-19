import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
} from "react-native"
import { useEffect, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { get, post } from '@/services/apiRequests'
import { paddings, theme, getBgColor, isLight } from "@/constants/Theme"
import { useSettings } from "@/contexts/settingsContext"
import { useAuth } from "@/contexts/authContext"
import { Text, View, ChoiceItem, Button, Lines } from "@/components/base/BaseComponents"
import ImageLibrary from "@/components/ImageLibrary"
import IPrefItem from "@/interfaces/PrefItem"

interface IPreferences {
    isVisible: boolean
    onHide: () => void
}

export default function Preferences({ onHide, isVisible }: IPreferences) {
    const { settings, setSettings } = useSettings()
    const { user, setUser } = useAuth()
    const { t } = useTranslation()

    const [loaded, setLoaded] = useState<boolean>(false)
    const [preferences, setPreferences] = useState<any>([])
    const [data, setData] = useState<ISlide[]> ([])
    // const [visibleSlides, setVisibleSlides] = useState<boolean>(true)
    const [currentSlide, setCurrentSlide] = useState<number>(0)
    const [isButtonDisabled, setButtonDisabled] = useState<boolean>(false)
    const [errorOnConfirm, setErrorOnConfirm] = useState<string|null>(null)

    const sliderRef = useRef<FlatList<ISlide>>(null)

    interface ISlide {
        title: string,
        items: IPrefItem[],
        additionalItems?: IPrefItem[],
        fullList?: boolean,
    }

    const logError = (e: any) => {
        if (e.response) {
            console.error(e.response.status, e.response.data)
            return
        }
        console.error('Err: ', e)
    }

    const personalizePreferences = (
        interests: [IPrefItem],
        intolerances: [IPrefItem],
        diets: [IPrefItem]
    ) => {
        if (user?.interests) {
            user.interests.forEach((item: IPrefItem) => {
                const index = interests.findIndex((i: IPrefItem) => i.id === item.id)
                if (index !== -1) {
                    interests[index].checked = true
                }
            })
        }
        if (user?.intolerances) {
            user.intolerances.forEach((item: IPrefItem) => {
                const index = intolerances.findIndex((i: IPrefItem) => i.id === item.id)
                if (index !== -1) {
                    intolerances[index].checked = true
                }
            })
        }
        if (user?.diets) {
            user.diets.forEach((item: IPrefItem) => {
                const index = diets.findIndex((i: IPrefItem) => i.id === item.id)
                if (index !== -1) {
                    diets[index].checked = true
                }
            })
        }

        return [interests, intolerances, diets]
    }


    // if we already have the preferences, use them,
    // otherwise preferences can be fetched only with token
    // (the useEffect callback cannot be async...)
    useEffect(() => {
        if (!isVisible) {
            return
        }
        AsyncStorage.getItem('preferences')
            .then(prefs => {
                if (prefs) {
                    const prefsTmp = JSON.parse(prefs)
                    setPreferences(prefsTmp)
                    setSettings({...settings, preferences: prefsTmp })
                    setLoaded(true)
                    return
                }

                if (!user || !user.token) {
                    return
                }
                Promise.all([
                    get({url: '/meta/interests', token: user.token}),
                    get({url: '/meta/intolerances', token: user.token}),
                    get({url: '/meta/diets', token: user.token}),
                ]).then(([interests, intolerances, diets]) => {
                    // personalize preferences
                    const [interestsTmp, intolerancesTmp, dietsTmp] = personalizePreferences(
                        [...interests] as [IPrefItem],
                        [...intolerances] as [IPrefItem],
                        [...diets] as [IPrefItem]
                    )
        
                    const prefsTmp = [
                        {name: 'interests', title: t('What are your interests?'), items: interestsTmp,},
                        {name: 'intolerances', title: t('Do you have any intolerance?'), items: intolerancesTmp,},
                        // {name: 'diets', title: t('What is your diet type?'), items: dietsTmp},
                    ]
                    setPreferences(prefsTmp)
                    setSettings({...settings, preferences: prefsTmp })
                    AsyncStorage.setItem('preferences', JSON.stringify(prefsTmp))
                        .catch(e => console.error('Error: AsyncStorage.setItem("preferences")', e))
                    
                    setLoaded(true)
                }).catch(logError)
            })
            .catch(logError)
    }, [isVisible, user])

    // prepare data for slides
    useEffect(() => {
        if (!preferences || Object.keys(preferences).length === 0) {
            return
        }

        function prepareItem(item: any): IPrefItem {
            return {
                id: item.id,
                icon: item.icon && item.icon in ImageLibrary
                    ? ImageLibrary[item.icon as keyof typeof ImageLibrary]
                    : ImageLibrary.avocado, // default image
                title: item.title,
                checked: item.checked ?? false,
            }
        }

        const dataTmp: ISlide[] = []
        for (const pref of preferences) {
            const items: IPrefItem[] = []
            for (const item of pref.items) {
                items.push(prepareItem(item))
            }

            const slideTmp: ISlide = {
                title: pref.title,
                items,
            }

            if (pref.additionalItems) {
                const addItems: IPrefItem[] = []
                for (const item of pref.additionalItems) {
                    addItems.push(prepareItem(item))
                }
                slideTmp.additionalItems = addItems
            }

            dataTmp.push(slideTmp)
        }
        setData(dataTmp)
    }, [preferences])

    const window = Dimensions.get('window')

    const confirmSlide = () => {
        setErrorOnConfirm(null)
        // transform data to preferences for AsyncStorage
        const preferencesTmp: any[] = [...preferences]
        data[currentSlide].items.forEach((item: IPrefItem, index: number) => {
            // we adds the additional items to the items array just for display
            // so, after click on 'See more' counts of items in data and preferences will be different
            if (!preferencesTmp[currentSlide].items[index]) {
                return
            }
            preferencesTmp[currentSlide].items[index].checked = item.checked
        })

        if (data[currentSlide].additionalItems) {
            data[currentSlide].additionalItems.forEach((item: IPrefItem, index: number) => {
                preferencesTmp[currentSlide].additionalItems[index].checked = item.checked
            })
        }

        AsyncStorage.setItem('preferences', JSON.stringify(preferencesTmp))
            .catch(logError)
        setPreferences(preferencesTmp)
        setSettings({...settings, preferences: preferencesTmp })

        const choosedItems = preferencesTmp[currentSlide].items
            .filter((item: IPrefItem) => item.checked)
            .map((item: IPrefItem) => item.id)

        // check if user already has the same preferences
        if (user) {
            const userSlidePreferences = user[preferencesTmp[currentSlide].name] ?? []
            let alreadyItems = userSlidePreferences
                .map((item: IPrefItem) => item.id)

            if (JSON.stringify(alreadyItems) === JSON.stringify(choosedItems)) {
                if (currentSlide === data.length - 1) {
                    setCurrentSlide(0)
                    return onHide()
                }
                setButtonDisabled(false)
                setCurrentSlide(currentSlide + 1)
                return
            }
        }


        setButtonDisabled(true)
        post({
            url: '/profile/update',
            data: {[preferencesTmp[currentSlide].name]: choosedItems},
            token: user?.token
        })
            .then(resp => {
                setUser({...user, ...resp})
                if (currentSlide === data.length - 1) {
                    setCurrentSlide(0)
                    return onHide()
                }
                setButtonDisabled(false)
                setCurrentSlide(currentSlide + 1)
            })
            .catch(e => {
                logError(e)
                setErrorOnConfirm(e.response.data.message)
                setButtonDisabled(false)
            })

    }
    const showPrevSlide = () => setCurrentSlide(currentSlide - 1)

    useEffect(() => {
        sliderRef.current?.scrollToIndex({
            index: currentSlide,
            animated: true,
        })
    }, [currentSlide])
    
    const showFullListForSlide = (index: number) => {
        const dataTmp = [...data]
        dataTmp[index].items = dataTmp[index].items.concat(dataTmp[index].additionalItems ?? [])
        dataTmp[index].fullList = true
        setData(dataTmp)
    }

    const toggleItem = (slide: number,index: number) => {
        const dataTmp = [...data]
        dataTmp[slide].items[index].checked = !dataTmp[slide].items[index].checked
        setData(dataTmp)
    }

    const renderItem = (slide: { item: ISlide, index: number }) => {
        return (
            <View style={[ s.main, { width: window.width - paddings * 2 }]}>
                <Text type="subtitle" style={ s.subtitle }>{slide.item.title}</Text>

                <FlatList
                    data={slide.item.items}
                    renderItem={
                        ({ item, index }) => <ChoiceItem
                            id={item.id}
                            img={item.icon}
                            text={item.title}
                            checked={item.checked ?? false}
                            onPress={() => toggleItem(slide.index, index)}
                            style={{ margin: 6 }}
                        />
                    }
                    style={{ marginTop: 20, width: '100%',  }}
                />

                { slide.item.additionalItems && !slide.item?.fullList && (
                    <Pressable
                        onPress={() => showFullListForSlide(slide.index)}
                        style={{ marginTop: 20 }}
                    >
                        <Text type='link' style={{ textAlign: 'left' }}>{t('See more')}</Text>
                    </Pressable>
                ) }

                <View style={{ marginTop: 40, marginBottom: 20 }}>
                    <Lines count={data.length} current={slide.index} />
                </View>

                {errorOnConfirm &&
                    <Text type="error" style={{ textAlign: 'center', margin: 10 }}>{errorOnConfirm}</Text>
                }
                <Button
                    disabled={isButtonDisabled}
                    size="medium"
                    text={t('Confirm')}
                    onPress={confirmSlide}
                    style={{ marginTop: 20, paddingLeft: 50, paddingRight: 50 }}
                />
            </View>
        )
    }

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return !loaded ? null : (
        <Modal
            onModalHide={onHide}
            isVisible={isVisible}
            style={[theme.modal, {backgroundColor: getBgColor()}]}
        >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                { currentSlide !== 0 ? <Pressable onPress={showPrevSlide} style={{ alignSelf: 'flex-start' }}>
                    <Image
                        source={isLight() ? backIconLight : backIconDark}
                        style={{ width: 16, height: 16, marginTop: 10 }}
                    />
                </Pressable> : <View /> }
                <Pressable onPress={onHide}>
                    <Text type="link">{t('Skip')}</Text>
                </Pressable>
            </View>
            <FlatList
                ref={sliderRef}
                data={data}
                renderItem={renderItem}
                initialScrollIndex={currentSlide}
                horizontal
                style={s.flatList}
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
            />
        </Modal>
    )
}

const s = StyleSheet.create({
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    main: {
        flexDirection: 'column',
        // justifyContent: 'space-between',
        alignItems: 'center',
    },
    flatList: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 40,
    },
    image: {
        marginBottom: 60,
    },
    subtitle: {
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 20,
    }, 
    navButtons: {
        flexDirection: 'column',
        flex: 1,
        marginTop: 40,
        width: '100%',
        alignItems: 'center',
    },
})