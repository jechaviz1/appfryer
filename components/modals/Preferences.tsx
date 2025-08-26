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
import { Text, View, Button } from "@/components/base/BaseComponents"
import ImageLibrary from "@/components/ImageLibrary"
import IPrefItem from "@/interfaces/PrefItem"
import { Colors } from "@/constants/Colors"

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

    const toggleItem = (slide: number, index: number) => {
        const dataTmp = [...data]
        dataTmp[slide].items[index].checked = !dataTmp[slide].items[index].checked
        setData(dataTmp)
    }

    const renderInterestCard = (item: IPrefItem, index: number) => {
        const isSelected = item.checked ?? false
        
        return (
            <Pressable 
                key={item.id}
                onPress={() => toggleItem(currentSlide, index)}
                style={[
                    s.interestCard,
                    isSelected && s.interestCardSelected
                ]}
            >
                <Image source={item.icon} style={s.interestCardImage} />
                <Text style={s.interestCardText}>{item.title}</Text>
            </Pressable>
        )
    }

    const backIcon = require('@/assets/icons/back.png')

    return !loaded ? null : (
        <Modal
            onModalHide={onHide}
            isVisible={isVisible}
            style={[theme.modal, {backgroundColor: getBgColor()}]}
        >
            {/* Header */}
            <View style={s.header}>
                <View style={s.headerTop}>
                    <View style={s.headerLeft}>
                        {currentSlide !== 0 ? (
                            <Pressable onPress={showPrevSlide} style={s.backButton}>
                                <Image
                                    source={backIcon}
                                    style={s.backButtonIcon}
                                />
                            </Pressable>
                        ) : (
                            <View style={s.backButtonPlaceholder} />
                        )}
                    </View>
                    
                    <View style={s.progressContainer}>
                        <View style={s.progressBar}>
                            <View 
                                style={[
                                    s.progressFill, 
                                    { width: `${((currentSlide + 1) / data.length) * 100}%` }
                                ]} 
                            />
                        </View>
                        <Text style={s.progressText}>{currentSlide + 1}/{data.length}</Text>
                    </View>
                    
                    <View style={s.headerRight} />
                </View>
            </View>

            {/* Content */}
            <View style={s.content}>
                <Text style={s.title}>{data[currentSlide]?.title}</Text>
                
                <FlatList
                    data={data[currentSlide]?.items || []}
                    renderItem={({ item, index }) => renderInterestCard(item, index)}
                    keyExtractor={(item) => item.id.toString()}
                    style={s.interestList}
                    showsVerticalScrollIndicator={false}
                />

                {data[currentSlide]?.additionalItems && !data[currentSlide]?.fullList && (
                    <Pressable
                        onPress={() => showFullListForSlide(currentSlide)}
                        style={s.seeMoreButton}
                    >
                        <Text style={s.seeMoreText}>{t('See more')}</Text>
                    </Pressable>
                )}

                {errorOnConfirm && (
                    <Text style={s.errorText}>{errorOnConfirm}</Text>
                )}
            </View>

            {/* Footer */}
            <View style={s.footer}>
                <View style={s.footerButtons}>
                    <Pressable onPress={onHide} style={s.skipButton}>
                        <Text style={s.skipText}>{t('Skip')}</Text>
                    </Pressable>
                    <Pressable 
                        onPress={confirmSlide} 
                        disabled={isButtonDisabled}
                        style={[s.confirmButton, isButtonDisabled && s.confirmButtonDisabled]}
                    >
                        <Text style={[s.confirmText, isButtonDisabled && s.confirmTextDisabled]}>
                            {t('Confirm')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    header: {
        paddingHorizontal: paddings,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerLeft: {
        width: 70,
        alignItems: 'flex-start',
    },
    headerRight: {
        width: 70,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 20,
        backgroundColor: '#F5F5DC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonPlaceholder: {
        width: 44,
        height: 44,
    },
    backButtonIcon: {
        width: 44,
        height: 44,
    },
    progressContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 20,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#C3803A',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 14,
        color: '#6C7278',
        fontFamily: 'DMSans',
    },
    content: {
        flex: 1,
        paddingHorizontal: paddings,
        paddingTop: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B1A1D',
        textAlign: 'center',
        marginBottom: 52,
        fontFamily: 'Poppins-Bold',
    },
    interestList: {
        flex: 1,
    },
    interestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 16,
        marginBottom: 19,
        borderWidth: 1,
        borderColor: '#EFF0F6',
    },
    interestCardSelected: {
        backgroundColor: '#F6ECE2',
        borderColor: '#C28040',
    },
    interestCardImage: {
        width: 40,
        height: 40,
        marginRight: 16,
    },
    interestCardText: {
        flex: 1,
        fontSize: 16,
        color: '#6C7278',
        fontFamily: 'Poppins-Medium',
    },
    seeMoreButton: {
        marginTop: 20,
        alignSelf: 'flex-start',
    },
    seeMoreText: {
        fontSize: 16,
        color: '#C3803A',
        fontFamily: 'Poppins-Medium',
        textDecorationLine: 'underline',
    },
    errorText: {
        fontSize: 14,
        color: '#FF2020',
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'Poppins-Medium',
    },
    footer: {
        paddingHorizontal: paddings,
        paddingBottom: 20,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    confirmButton: {
        paddingVertical: 8,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmText: {
        fontSize: 16,
        color: Colors.mainColor,
        fontFamily: 'Poppins-Medium',
        textTransform: 'uppercase',
    },
    confirmTextDisabled: {
        color: '#9BA1A6',
    },
    skipButton: {
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 16,
        color: '#6C7278',
        fontFamily: 'Poppins-Medium',
        textTransform: 'uppercase',
    },
})