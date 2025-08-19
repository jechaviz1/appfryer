import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Slider } from '@miblanchard/react-native-slider'
import { useTranslation } from 'react-i18next'

import { Button, Lines, Text, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { isLight, paddings, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { timeFromMinutes } from '@/services/datetime'

export default function TimeStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()

    const [prepTime, setPrepTime] = useState<number>(recipe?.timePreparation || 5)
    const [cookingTime, setCookingTime] = useState<number>(recipe?.timeCooking || 5)
    const [temperature, setTemperature] = useState<number>(recipe?.temperature || 20)
    const [canGoNext, setCanGoNext] = useState(true)

    useEffect(() => {
        if (!recipe) {
            router.replace(`/(tabs)/`)
        }
    }, [])

    const nextStep = useCallback(() => {
        if (!recipe) {
            return
        }
        setCanGoNext(false)

        if (prepTime === recipe.timePreparation && cookingTime === recipe.timeCooking && temperature === recipe.temperature) {
            setCanGoNext(true)
            return router.push('/(create)/6-ingredients')
        }

        post({
            url: `/recipe/${recipe.id}/edit`,
            data: {
                timePreparation: prepTime,
                timeCooking: cookingTime,
                temperature,
            },
            token: user?.token
        })
            .then((r) => {
                setCanGoNext(true)
                setRecipe({
                    ...recipe,
                    timePreparation: prepTime,
                    timeCooking: cookingTime,
                    temperature,
                })
                router.push('/(create)/6-ingredients')
            })
            .catch(e => {
                setCanGoNext(true)
                logError(e)
            })
    }, [recipe, prepTime, cookingTime, temperature])


    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')
    const window = Dimensions.get('window')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(create)/4-servings')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 5})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <View style={s.main}>
                    <View style={[s.wrapper, {width: window.width - paddings * 2}]}>
                        <Text type="subtitle" style={s.subtitle}>{t('Enter times and cooking temperature')}</Text>
                        <Text type='caption'>{t('Preparation time: {{prepTime}}', { prepTime: timeFromMinutes(prepTime) })}</Text>
                        <Slider
                            value={prepTime}
                            onValueChange={v => setPrepTime(Array.isArray(v) ? v[0] : v)}
                            minimumValue={5}
                            maximumValue={240}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbTintColor={Colors.white}
                            thumbStyle={s.thumb}
                        />

                        <Text type='caption'>{t('Cooking time: {{cookingTime}}', {cookingTime: timeFromMinutes(cookingTime)})}</Text>
                        <Slider
                            value={cookingTime}
                            onValueChange={v => setCookingTime(Array.isArray(v) ? v[0] : v)}
                            minimumValue={5}
                            maximumValue={240}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbTintColor={Colors.white}
                            thumbStyle={s.thumb}
                        />

                        <Text type='caption'>{t('Temperature: {{temperature}}º', {temperature})}</Text>
                        <Slider
                            value={temperature}
                            onValueChange={v => setTemperature(Array.isArray(v) ? v[0] : v)}
                            minimumValue={5}
                            maximumValue={240}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbTintColor={Colors.white}
                            thumbStyle={s.thumb}
                        />
                    </View>
                </View>

                <View style={s.btnWrapper}>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={4} />
                    </View>
                    <Button text={t('Next')} disabled={!canGoNext} onPress={nextStep} />
                </View>

            </View>
        </View>
    )
}

const s = StyleSheet.create({
    topbarWrap: {
        marginBottom: 24,
        width: '100%',
        justifyContent: 'space-between',
    },
    topbarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    main: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
    },
    wrapper: {
        marginTop: 42,
        marginBottom: 36,
        gap: 14,
    },
    subtitle: {
        marginHorizontal: 48,
        marginBottom: 20,
        textAlign: 'center',
    },
    thumb: {
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})