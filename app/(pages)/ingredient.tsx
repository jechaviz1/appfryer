import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { useGlobalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { BackButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import { theme, paddings, isLight } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { get } from '@/services/apiRequests'
import { Colors } from '@/constants/Colors'
import { IIngredinentInfo } from '@/interfaces/Ingredient'
import NutritionalValues from '@/components/NutritionalValues'

export default function Ingredient() {
    const globQuery = useGlobalSearchParams()
    const { user } = useAuth()
    const { t } = useTranslation()
    const { width: windowWidth } = useWindowDimensions()

    const [ingredient, setIngredient] = useState<IIngredinentInfo>()
    const [activeTab, setActiveTab] = useState(0)

    const tabsRef = useRef<FlatList>(null)

    useEffect(() => {
        get({ url: `/ingredient/${globQuery.id}`, token: user?.token })
            .then(ingredient => setIngredient(ingredient))
            .catch(e => console.error(e.response.data))
    }, [])

    useEffect(() => {
        tabsRef.current?.scrollToIndex({
            index: activeTab,
            animated: true,
        })
    }, [activeTab])

    const width = windowWidth - paddings * 2

    const renderTab = useCallback((tab: { item: string, index: number }) => {
        switch (tab.item) {
            case 'info':
                if (activeTab !== 0) {
                    return null
                }
                return (
                    <View style={[theme.section, {gap: 18, width}]}>
                        <View style={s.infoRow}>
                            <Text>{t('Name')}</Text>
                            <Text style={s.infoValue}>{ingredient!.title}</Text>
                        </View>
                        <View style={s.line} />
                        <View style={s.infoRow}>
                            <Text>{t('Category')}</Text>
                            <Text style={s.infoValue}>{ingredient!.category.title}</Text>
                        </View>
                        <View style={s.line} />
                        <View>
                            <Text>{t('Description')}</Text>
                            <Text style={s.infoValue}>{ingredient!.description}</Text>
                        </View>
                    </View>
                )
            case 'nutritional':
                if (activeTab !== 1) {
                    return null
                }
                return (
                    <NutritionalValues isPremium={user?.isPremium || false} nutrientsInit={ingredient!.nutrients} />
                )
            case 'origin':
                if (activeTab !== 2) {
                    return null
                }
                return (
                    <View style={[theme.section, {gap: 18, width}]}>
                        <Text style={s.infoValue}>{ingredient!.country}</Text>
                    </View>
                )
            case 'culinaryUses':
                if (activeTab !== 3) {
                    return null
                }
                return (
                    <View style={[theme.section, {gap: 18, width}]}>
                        <Text style={s.infoValue}>{ingredient!.culinaryUse}</Text>
                    </View>
                )
        }
        return (
            <View style={[theme.section, {width}]}>
                <Text type='subtitle'>{tab.item}</Text>
            </View>
        )
    }, [activeTab, ingredient])

    if (!ingredient) {
        return null
    }

    const cals = Math.floor(ingredient.nutrients.calories || 0)
    const details = [
        { value: `${cals} ${t('kcal')}`, icon: require('@/assets/icons/fire.png') },
        { value: ingredient?.country || '', icon: require('@/assets/icons/globe.png') },
        { value: ingredient?.interchangable || '', icon: require('@/assets/icons/interchange.png') },
        { value: ingredient?.season || t('All year'), icon: require('@/assets/icons/leaf.png') },
    ]

    const tabs = [
        { item: t('Info'), index: 0 },
        { item: t('Nutritional properties'), index: 1 },
        { item: t('Origin'), index: 2 },
        { item: t('Culinary uses'), index: 3 },
    ]

    const greyTextColor = isLight() ? Colors.grey : Colors.lightGrey

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={theme.titleImageWrapper}>
                    <Image source={{ uri: ingredient.category.photo }} style={theme.titleImage} />
                    <BackButton />
                </View>
                <Text type="subtitle">{ingredient.title}</Text>
                <Text style={[s.ingredientDescriptionText, {color: isLight() ? Colors.grey : Colors.lightGrey }]}>{ingredient.description}</Text>

                <View style={s.ingredientDetailsWrapper}>
                    {details.map((detail, index) => (
                        <View key={index} style={s.detailWrapper}>
                            <View style={s.detailIconWrapper}>
                                <Image source={detail.icon} style={s.detailIcon}/>
                            </View>
                            <Text style={{textAlign: 'center'}}>{detail.value}</Text>
                        </View>
                        
                    ))}
                </View>

                {/* Tabs */}
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
                                {tab.item}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={{ marginBottom: 80 }}>
                    <FlatList
                        ref={tabsRef}
                        data={['info', 'nutritional', 'origin', 'culinaryUses']}
                        renderItem={renderTab}
                        initialScrollIndex={activeTab}
                        horizontal
                        style={theme.tabsFlatList}
                        pagingEnabled
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    ingredientDescriptionText: {
        fontSize: 14,
        marginTop: 6,
    },
    ingredientDetailsWrapper: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailWrapper: {
        alignItems: 'center',
    },
    detailIconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 999,
        backgroundColor: Colors.mainColorLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    detailIcon: {
        width: 25,
        height: 25,
    },
    tabs: {
        marginTop: 20,
        marginBottom: 10,
        gap: 10,
    },
    tab: {
        paddingHorizontal: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    infoValue: {
        color: Colors.grey,
        maxWidth: '78%',
    },
    line: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.lightGrey,
    },
})