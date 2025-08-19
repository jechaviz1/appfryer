import { useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'

import { BackButton, Button, Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { paddings } from '@/constants/Theme'

export default function Premium() {
    const { t } = useTranslation()
    const [selectedPeriod, setSelectedPeriod] = useState<0 | 1>(1)

    const benefits = [
        'Premium recipes from chefs',
        'Nutritional analysis',
        'Virtual cooking classes',
        'Ad-free',
    ]
    const prices = [
        '$2.49',
        '$1.99',
    ]

    const windowWidth = Dimensions.get('window').width
    const diamond = require('../../assets/images/premium-diamond.png')
    return (
        <View style={{ flex: 1 }}>
            <View style={{ position: 'absolute', top: 40, left: 12, zIndex: 10}}>
                <BackButton />
            </View>
            <LinearGradient
                colors={['#de9446', '#9b5b18']}
                style={[s.container, { width: windowWidth }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={s.circle} />
                <Text type='title' style={{ color: Colors.white }}>{t('Get premium')}</Text>
                <Image source={diamond} style={s.diamondImg} />

                {/* Benefits */}
                <View style={s.textBox}>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={s.textRow}>
                            <Image source={require('@/assets/icons/checkmark.png')} style={s.checkImg} />
                            <Text style={s.text}>{t(benefit)}</Text>
                        </View>
                    ))}
                </View>

                {/* Period selector */}
                <View style={[
                    s.periodSelector,
                    {
                        paddingLeft: selectedPeriod === 0 ? 0 : 12,
                        paddingRight: selectedPeriod === 0 ? 12 : 0,
                    }
                ]}>
                    <Pressable
                        onPress={() => setSelectedPeriod(0)}
                        style={[
                            s.periodItem,
                            {
                            backgroundColor: selectedPeriod === 0 ? Colors.white : 'transparent',
                            paddingHorizontal: selectedPeriod === 0 ? 16 : 0,
                            }
                        ]}
                    >
                        <Text style={{
                            color: selectedPeriod === 0 ? Colors.mainColor : Colors.white,
                            fontWeight: selectedPeriod === 0 ? 'bold' : 'medium',
                            fontFamily: selectedPeriod === 0 ? 'DMSans-Bold' : 'DMSans-Medium',
                        }}>{t('Monthly')}</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setSelectedPeriod(1)}
                        style={[
                            s.periodItem,
                            {
                            backgroundColor: selectedPeriod === 1 ? Colors.white : 'transparent',
                            paddingHorizontal: selectedPeriod === 1 ? 16 : 0,
                            }
                        ]}
                    >
                        <Text style={{
                            color: selectedPeriod === 1 ? Colors.mainColor : Colors.white,
                            fontWeight: selectedPeriod === 1 ? 'bold' : 'medium',
                            fontFamily: selectedPeriod === 1 ? 'DMSans-Bold' : 'DMSans-Medium',
                        }}>{t('Yearly')}</Text>
                    </Pressable>
                </View>

                {/* Price */}
                <Text style={s.price}>
                    {prices[selectedPeriod]}{t('/mo')}
                </Text>

                {/* Buttons */}
                <Button
                    text={t('Get Premium')}
                    onPress={() => console.log('Get premium')}
                    style={[s.purchaseBtn, { width: windowWidth - paddings * 2 }]}
                    textStyle={[s.btnText, s.purchaseBtnText]}
                />
                <Pressable onPress={() => console.log('Restore purchases')}>
                    <Text style={[s.btnText, s.restoreText]}>{t('Restore Purchases')}</Text>
                </Pressable>
            </LinearGradient>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        top: -270,
        left: -230,
        zIndex: 10,
        width: 800,
        height: 800,
        borderRadius: 999,
        backgroundColor: '#ffffff10',
    },
    diamondImg: {
        width: 132,
        height: 132,
        marginTop: 20,
    },
    textBox: {
        marginTop: 40,
        marginBottom: 110,
        backgroundColor: 'transparent',
        gap: 18,
    },
    textRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        backgroundColor: 'transparent',
    },
    checkImg: {
        width: 16,
        height: 16,
    },
    text: {
        color: Colors.white,
    },
    periodSelector: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#ffffff20',
        borderRadius: 100,
    },
    periodItem: {
        paddingVertical: 8,
        borderRadius: 100,
    },
    price: {
        marginTop: 22,
        color: Colors.white,
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
        fontSize: 19,
    },
    purchaseBtn: {
        marginTop: 36,
        marginBottom: 12,
        backgroundColor: Colors.white,
        height: 52,
        borderRadius: 14,
    },
    btnText: {
        lineHeight: 52,
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
    },
    purchaseBtnText: {
        color: Colors.mainColor,
    },
    restoreText: {
        color: Colors.white,
    },
})