import { useState } from 'react'
import { Dimensions, Image, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { BackButton, Button, Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { getBgColor, paddings, theme, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor } from '@/constants/Theme'
import { router } from 'expo-router'
import { useTheme } from '@/contexts/themeContext'

export default function Premium() {
    const { t } = useTranslation()
    const { isDark } = useTheme()
    const [selectedPeriod, setSelectedPeriod] = useState<0 | 1>(1)

    const s = createStyles(isDark)

    const benefits = [
        'Premium recipes from exclusive chefs',
        'Nutritional analysis',
        'Virtual cooking classes',
        'No advertising',
    ]

    const windowWidth = Dimensions.get('window').width
    const premiumPerson = require('../../assets/images/premium-person.png')
    const gradientBg = require('../../assets/images/premium-gradient-bg.png')
    
    return (
        <View style={s.mainContainer}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={s.mainContainer}>
                {/* Header Section with Background Image */}
                <View style={[s.headerSection, { width: windowWidth }]}>
                    <Image source={gradientBg} style={s.gradientBackground} resizeMode="stretch" />

                    {/* Close Button */}
                    <Pressable style={s.closeButton} onPress={() => router.back()}>
                        <Image source={require('../../assets/icons/x-white.png')} style={s.closeButtonIcon} />
                    </Pressable>
                    
                    {/* Title and Subtitle */}
                    <View style={s.headerTitleContainer}>
                        <Text style={s.headerTitle}>{t('Get premium')}</Text>
                        <Text style={s.headerSubtitle}>{t('More recipes, more discounts, more flavor.')}</Text>
                    </View>
                    
                    {/* Premium Person Illustration */}
                    <Image source={premiumPerson} style={s.premiumPersonImg} />
                </View>

                {/* Main Content Area */}
                <View style={s.contentArea}>
                    {/* Features List */}
                    <View style={s.featuresContainer}>
                        {benefits.map((benefit, index) => (
                            <View key={index} style={s.featureRow}>
                                <Image source={require('../../assets/icons/check.png')} style={s.checkmarkIcon} />
                                <Text style={s.featureText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Subscription Options */}
                    <View style={s.subscriptionContainer}>
                        {/* Monthly Option */}
                        <Pressable
                            onPress={() => setSelectedPeriod(0)}
                            style={[
                                s.subscriptionCard,
                                selectedPeriod === 0 ? s.subscriptionCardSelected : s.subscriptionCardUnselected
                            ]}
                        >
                            <View style={s.subscriptionContent}>
                                <View style={s.subscriptionLeft}>
                                    <View style={s.radioButton}>
                                        {selectedPeriod === 0 && <Image source={require('../../assets/icons/check-round.png')} style={s.radioButtonSelected} />}
                                    </View>
                                    <View style={s.subscriptionTextContainer}>
                                        <Text style={s.subscriptionTitle}>{t('Monthly')}</Text>
                                        <Text style={s.subscriptionSubtitle}>{t('Complete one recipe to get it')}</Text>
                                    </View>
                                </View>
                                <View style={s.subscriptionRight}>
                                    <Text style={s.subscriptionPrice}>$1.99 / m</Text>
                                    <View style={[
                                        s.discountTag,
                                        selectedPeriod === 0 ? s.discountTagSelected : s.discountTagUnselected
                                    ]}>
                                        <Text style={s.discountText}>-15%</Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>

                        {/* Annual Option */}
                        <Pressable
                            onPress={() => setSelectedPeriod(1)}
                            style={[
                                s.subscriptionCard,
                                selectedPeriod === 1 ? s.subscriptionCardSelected : s.subscriptionCardUnselected
                            ]}
                        >
                            <View style={s.subscriptionContent}>
                                <View style={s.subscriptionLeft}>
                                    <View style={s.radioButton}>
                                        {selectedPeriod === 1 && <Image source={require('../../assets/icons/check-round.png')} style={s.radioButtonSelected} />}
                                    </View>
                                    <View style={s.subscriptionTextContainer}>
                                        <Text style={s.subscriptionTitle}>{t('Yearly')}</Text>
                                        <Text style={s.subscriptionSubtitle}>{t('Complete one recipe to get it')}</Text>
                                    </View>
                                </View>
                                <View style={s.subscriptionRight}>
                                    <Text style={s.subscriptionPrice}>$22.99 / α</Text>
                                    <View style={[
                                        s.discountTag,
                                        selectedPeriod === 1 ? s.discountTagSelected : s.discountTagUnselected
                                    ]}>
                                        <Text style={s.discountText}>-20%</Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </View>

                    {/* Action Buttons */}
                    <View style={s.actionButtonsContainer}>
                        <Button
                            text={t('Get premium')}
                            onPress={() => console.log('Get premium')}
                            style={[s.premiumButton, { width: windowWidth - paddings * 2 - 50 }]}
                            textStyle={s.premiumButtonText}
                        />
                        <Pressable onPress={() => console.log('Restore purchases')}>
                            <Text style={s.restoreText}>{t('Restore purchases')}</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: getBgColor(),
    },
    headerSection: {
        height: 385,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: getBgColor(),
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 'auto',
        height: 241,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 25,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeButtonIcon: {
        width: 24,
        height: 24,
    },
    headerTitleContainer: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 80,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
        zIndex: 10,
    },
    headerSubtitle: {
        color: Colors.white,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Poppins',
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.9,
        zIndex: 10,
    },
    premiumPersonImg: {
        width: 300,
        height: 300,
        marginTop: 120,
        zIndex: 10,
    },
    contentArea: {
        flex: 1,
        backgroundColor: getBgColor(),
        paddingHorizontal: 25,
    },
    featuresContainer: {
        backgroundColor: getBgColor(),
        gap: 14,
        marginBottom: 40,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: getBgColor(),
    },
    checkmarkIcon: {
        width: 24,
        height: 24,
        marginRight: 17,
        tintColor: Colors.mainColor,
    },
    featureText: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22,
        color: getTextColor(),
        flex: 1,
    },
    subscriptionContainer: {
        marginBottom: 30,
        backgroundColor: getBgColor(),
    },
    subscriptionCard: {
        backgroundColor: getCardBackground(),
        marginBottom: 12,
        borderRadius: 10,
        height: 97,
    },
    subscriptionCardSelected: {
        backgroundColor: isDark ? '#374151' : '#F6ECE2',
        borderWidth: 1,
        borderColor: Colors.mainColor,
        borderRadius: 10,
    },
    subscriptionCardUnselected: {
        backgroundColor: getCardBackground(),
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: 10,
    },
    subscriptionContent: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        padding: 14,
        height: 94,
    },
    subscriptionLeft: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: getSecondaryTextColor(),
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 0,
    },
    subscriptionTextContainer: {
        backgroundColor: 'transparent',
        flex: 1,
    },
    subscriptionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 16,
        color: getTextColor(),
        marginBottom: 2,
    },
    subscriptionSubtitle: {
        fontFamily: 'Poppins',
        fontSize: 14,
        lineHeight: 19,
        color: getSecondaryTextColor(),
    },
    subscriptionRight: {
        backgroundColor: 'transparent',
        alignItems: 'flex-end',
    },
    subscriptionPrice: {
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 16,
        color: Colors.mainColor,
        marginBottom: 9,
    },
    discountTag: {
        backgroundColor: isDark ? '#374151' : '#F6ECE2',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 18,
    },
    discountTagSelected: {
        backgroundColor: getCardBackground(),
    },
    discountTagUnselected: {
        backgroundColor: isDark ? '#374151' : '#F6ECE2',
    },
    discountText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        lineHeight: 19,
        color: Colors.mainColor,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        backgroundColor: getBgColor(),
        alignItems: 'center',
        paddingBottom: 30,
    },
    premiumButton: {
        backgroundColor: Colors.mainColor,
        height: 52,
        borderRadius: 11,
        marginBottom: 35,
    },
    premiumButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
    restoreText: {
        color: Colors.mainColor,
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
})