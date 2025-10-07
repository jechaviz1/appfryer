import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { router, useGlobalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { BackButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Header from '@/components/Header'
import { theme, paddings, isLight, getBgColor } from '@/constants/Theme'
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

    useEffect(() => {
        get({ url: `/ingredient/${globQuery.id}`, token: user?.token })
            .then(ingredient => setIngredient(ingredient))
            .catch(e => console.error(e.response.data))
    }, [])

    // Using pill-tabs like ProfileScreen; no FlatList scroll sync needed

    const width = windowWidth - paddings * 2

    const renderTab = useCallback((tab: { item: string, index: number }) => {
        switch (tab.item) {
            case 'info':
                if (activeTab !== 0) {
                    return null
                }
                return (
                    <View style={[s.infoWrapper, {width}]}>
                        {/* Title */}
                        <Text type="subtitle" style={s.title}>{ingredient!.title}</Text>

                        {/* Category chip */}
                        <View style={[s.categoryRow, {marginTop: 8}]}> 
                            <Text style={s.categoryLabel}>{t('Category')}</Text>
                            <View style={s.categoryChip}>
                                <Text style={s.categoryText}>{ingredient!.category.title}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={s.ingredientDescriptionText}>
                            {ingredient!.description}
                        </Text>

                        {/* Details cards */}
                        <View style={s.ingredientDetailsWrapper}>
                            {details.map((detail, index) => (
                                <View key={index} style={s.detailWrapper}>
                                    <View style={s.detailIconWrapper}>
                                        <Image source={detail.icon} style={s.detailIcon}/>
                                    </View>
                                    <Text style={s.detailValue}>{detail.value}</Text>
                                    <Text style={s.detailCaption}>{t(detail.label)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Info rows (pill cards) */}
                        <View style={s.infoList}>
                            <View style={s.infoItem}>
                                <Text style={s.infoLabel}>{t('Season')}</Text>
                                <Text style={s.infoValue}>{ingredient!.season || t('All year')}</Text>
                            </View>
                            <View style={s.infoItem}>
                                <Text style={s.infoLabel}>{t('Origin')}</Text>
                                <Text style={s.infoValue}>{ingredient!.country || '---'}</Text>
                            </View>
                            <View style={s.infoItem}>
                                <Text style={s.infoLabel}>{t('Culinary use')}</Text>
                                <Text style={s.infoValue}>{ingredient!.culinaryUse || '---'}</Text>
                            </View>
                        </View>

                        {/* Product history */}
                        <View style={s.historyWrapper}>
                            <Text style={s.historyTitle}>{t('Product history')}</Text>
                            <Text style={s.historyText}>{ingredient!.description || '---'}</Text>
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
        { value: `${cals}`, label: 'Calories', icon: require('@/assets/icons/fire.png') },
        { value: ingredient?.country || '---', label: 'Country', icon: require('@/assets/icons/globe.png') },
        { value: ingredient?.interchangable || '---', label: 'Substitute', icon: require('@/assets/icons/interchange.png') },
    ]

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <Header
                title={t('Ingredient Details')}
                onBack={() => router.back()}
                rightIconSource={require('@/assets/icons/share.png')}
                onRightPress={() => {}}
            />
            <ScrollView>
                <View style={s.titleImageWrapper}>
                    <Image source={{ uri: ingredient.category.photo }} style={s.titleImage} />
                </View>

                <View style={[theme.mainContainer, s.tabsContainer]}>
                    {/* Pill Tabs (ProfileScreen style) */}
                    <View style={s.pillTabs}>
                        <Pressable style={[s.pillTab, activeTab === 0 ? s.pillTabActive : s.pillTabInactive]} onPress={() => setActiveTab(0)}>
                            <Text style={[s.pillTabText, activeTab === 0 ? s.pillTabTextActive : s.pillTabTextInactive]}>{t('Information')}</Text>
                        </Pressable>
                        <Pressable style={[s.pillTab, activeTab === 1 ? s.pillTabActive : s.pillTabInactive]} onPress={() => setActiveTab(1)}>
                            <Text style={[s.pillTabText, activeTab === 1 ? s.pillTabTextActive : s.pillTabTextInactive]}>{t('Nutritional properties')}</Text>
                        </Pressable>
                    </View>

                    {/* Tab Content */}
                    {activeTab === 0 ? renderTab({ item: 'info', index: 0 }) : renderTab({ item: 'nutritional', index: 1 })}
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    scrollView: {
        paddingBottom: 30,
    },
    titleImageWrapper: {
        position: 'relative',
    },
    titleImage: {
        width: '100%',
        height: 275,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 20,
        letterSpacing: 0,
        color: '#000000',
    },
    categoryLabel: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        color: '#1B1A1D',
    },
    ingredientDescriptionText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0,
        color: Colors.greyTextColor,
        marginTop: 6,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: getBgColor(),
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 18,
        backgroundColor: '#F6ECE2',
    },
    categoryText: {
        color: Colors.mainColor,
        fontSize: 12,
    },
    tabsContainer: {
        paddingTop: 0,
    },
    infoWrapper: {
        backgroundColor: getBgColor(),
        marginVertical: 20,
    },
    ingredientDetailsWrapper: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: getBgColor(),
        marginBottom: 16,
        gap: 16,
    },
    detailWrapper: {
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 12,
        width: '31%',
    },
    detailIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailIcon: {
        width: 20,
        height: 20,
    },
    detailValue: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#000000',
    },
    detailCaption: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        letterSpacing: 0,
        textAlign: 'center',
        color: Colors.greyTextColor,
    },
    infoList: {
        gap: 10,
        backgroundColor: getBgColor(),
    },
    infoItem: {
        width: '100%',
        minHeight: 44,
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    infoLabel: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 15,
        letterSpacing: 0,
        color: '#1B1A1D',
    },
    infoValue: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 15,
        letterSpacing: 0,
        textAlign: 'right',
        color: Colors.greyTextColor,
        maxWidth: '78%',
    },
    pillTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 30,
    },
    pillTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 30,
    },
    pillTabActive: {
        backgroundColor: Colors.mainColor,
    },
    pillTabInactive: {
        backgroundColor: 'transparent',
    },
    pillTabText: {
        fontFamily: 'Poppins',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        textAlign: 'center',
    },
    pillTabTextActive: {
        color: Colors.white,
    },
    pillTabTextInactive: {
        color: Colors.grey,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    historyWrapper: {
        marginTop: 10,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 115,
    },
    historyTitle: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        color: '#1B1A1D',
        marginBottom: 6,
    },
    historyText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0,
        color: Colors.greyTextColor,
    },
})