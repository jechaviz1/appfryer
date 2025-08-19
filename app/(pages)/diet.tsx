import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { BackButton, Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import { theme, paddings, isLight } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { get } from '@/services/apiRequests'
import { Colors } from '@/constants/Colors'
import { IDiet } from '@/interfaces/Diet'
import { logError } from '@/services/utils'

export default function Diet() {
    const router = useRouter()
    const globQuery = useGlobalSearchParams()
    const { user } = useAuth()
    const { t } = useTranslation()
    const tabsRef = useRef<FlatList>(null)

    const [diet, setDiet] = useState<IDiet>()
    const [activeTab, setActiveTab] = useState(0)

    useEffect(() => {
        get({url: `/meta/diet/${globQuery.id}`, token: user?.token})
            .then(setDiet)
            .catch(logError)
    }, [])

    useEffect(() => {
        tabsRef.current?.scrollToIndex({
            index: activeTab,
            animated: true,
        })
    }, [activeTab])

    if (!diet) {
        return null
    }

    const window = Dimensions.get('window')

    const tabs = [
        {title: 'Principles', key: 'keyDetails', index: 0},
        {title: 'Benefits', key: 'benefits', index: 1},
        {title: 'Allowed foods', key: 'allowedFood', index: 2},
        {title: 'Not allowed foods', key: 'notAllowedFood', index: 3},
        {title: 'Important notes', key: 'importantNotes', index: 4},
        {title: 'Recommended audience', key: 'recommendedAudience', index: 5},
        {title: 'Ease of following', key: 'easeOfFollowing', index: 6},
        {title: 'Time to see results', key: 'timeToSeeResults', index: 7},
        {title: 'Cost', key: 'cost', index: 8},
        {title: 'Environmental impact', key: 'environmentalImpact', index: 9},
        {title: 'Sample daily menu', key: 'sampleDailyMenu', index: 10},
        {title: 'Potential risks', key: 'potentialRisks', index: 11},
    ]

    const greyTextColor = isLight() ? Colors.grey : Colors.lightGrey

    const renderTab = (tab: { item: string, index: number }) => {
        return (
            <View style={[theme.section, {gap: 18, width: window.width - paddings * 2}]}>
                <Text style={{ color: greyTextColor}}>{diet[tabs[tab.index].key as keyof IDiet]}</Text>
            </View>
        )
    }
    
    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={theme.titleImageWrapper}>
                    <Image source={{ uri: diet.photo || 'https://picsum.photos/600' }} style={theme.titleImage} />
                    <BackButton />
                </View>
                <Text type="subtitle">{t(diet.title)}</Text>
                <Text style={[s.dietDescriptionText, {color: isLight() ? Colors.grey : Colors.lightGrey }]}>{t(diet.description)}</Text>

                <ScrollView style={s.tabs} horizontal>
                    {tabs.map(tab => (
                        <Pressable
                            key={tab.index}
                            style={[
                                theme.tabCaptionWrapper, s.tab,
                                activeTab === tab.index ? theme.activeTab : {},
                            ]}
                            onPress={() => setActiveTab(tab.index)}
                        >
                            <Text style={[
                                theme.tabCaption,
                                { color: activeTab === tab.index ? Colors.mainColor : greyTextColor }
                            ]}>
                                {t(tab.title)}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <FlatList
                    ref={tabsRef}
                    data={tabs.map(tab => tab.title)}
                    renderItem={renderTab}
                    initialScrollIndex={activeTab}
                    horizontal
                    style={theme.tabsFlatList}
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                />

                <Button
                    text={t('See recipes')}
                    onPress={() => router.push({pathname: '/(pages)/feed', params: {title: diet.title, filterDiets: diet.id}})}
                    style={{marginTop: 40}}
                />

            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dietDescriptionText: {
        fontSize: 14,
        marginTop: 6,
    },
    tabs: {
        marginTop: 20,
        marginBottom: 10,
        gap: 10,
    },
    tab: {
        paddingHorizontal: 18,
    },
})