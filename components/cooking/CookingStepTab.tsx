import { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Text, View } from "@/components/base/BaseComponents"
import { getTimerTextFromSeconds } from '@/services/datetime'
import { logError } from '@/services/utils'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import IRecipe, { IRecipeStep } from '@/interfaces/Recipe'
import { Colors } from '@/constants/Colors'
import { theme, isLight } from '@/constants/Theme'
import RadialSliderWrapper from './RadialSliderWrapper'

interface Props {
    recipe: IRecipe | undefined
    setRecipe: (recipe: IRecipe) => void
    onBack: () => void
    step: IRecipeStep | undefined
    stepIndex: number
    isLastStep: boolean
}

interface ITimer {
    tabIndex: number
    timeInSec: number
    isStarted: boolean
}

export default function CookingStepTab ({ recipe, setRecipe, onBack, step, stepIndex, isLastStep }: Props) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [timer, setTimer] = useState<ITimer>()
    const [image, setImage] = useState<string>()

    useEffect(() => {
        if (step && step.cookingTime) {
            setTimer({ tabIndex: 0, timeInSec: step.cookingTime * 60, isStarted: false })
        }
        setImage(recipe?.medias.find((media) => media.uuid === step?.mediaUuid)?.url)
    }, [step])

    useEffect(() => {
        if (timer && timer.isStarted && timer.timeInSec === 0) {
            setTimer({ ...timer, isStarted: false })
            return
        }
        if (timer && timer.isStarted) {
            const interval = setInterval(() => {
                setTimer({ ...timer, timeInSec: timer.timeInSec - 1 })
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [timer])

    if (!step || !recipe || recipe.cookingSteps.length === 0) {
        return <View />
    }

    const toggleTimer = (currentTimer: ITimer) => {
        setTimer({ ...currentTimer, isStarted: !currentTimer.isStarted })
    }

    const setRate = (rating: number) => {
        post({
            url: `/recipe/${recipe.id}/rating`,
            data: { rating },
            token: user?.token,
        })
            .then((response) => {
                setRecipe({...recipe, ...response})
            })
            .catch(logError)
    }

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    const startTimerIcon = require('@/assets/icons/video-triangle.png')
    const pauseTimerIcon = require('@/assets/icons/pause-white.png')

    const filledStar = require('@/assets/icons/star-fill-78.png')
    const greyStar = require('@/assets/icons/star-grey-78.png')
    const star = require('@/assets/icons/star-78.png')

    const ratingCaptions = {
        1: 'Bad',
        2: 'Average',
        3: 'Good',
        4: 'Very good!',
        5: 'Perfect'
    }

    return (
        <View>
            {image
                ? <View style={s.titleImageWrapper}>
                    <Image source={{ uri: image }} style={s.titleImage} />
                    <Pressable onPress={onBack} style={[theme.backButton, s.backButton]}>
                        <Image source={require('@/assets/icons/chevron-left.png')} style={{ width: 20, height: 20 }} />
                    </Pressable>
                </View>
                : <Pressable onPress={onBack} style={{ marginTop: 40, marginBottom: 40 }}>
                    <Image source={isLight() ? backIconLight : backIconDark} style={s.simpleBackButton} />
                </Pressable>
            }
            <Text type="subtitle" style={{ marginBottom: 12 }}>{isLastStep ? t('Final') : stepIndex} {t('step')}</Text>
            <Text type='caption'>{step.title}</Text>
            <Text style={{ marginTop: 12, color: isLight() ? Colors.grey : Colors.lightGrey }}>{step.description}</Text>

            {step.info &&
                <View style={[s.infoWrapper]}>
                    <View style={s.infoIconWrapper}>
                        <Image source={require('@/assets/icons/info.png')} style={{ width: 16, height: 16 }} />
                    </View>
                    <Text style={{ color: isLight() ? Colors.grey : Colors.lightGrey, flex: 1 }}>
                        {step.info}
                    </Text>
                </View>
            }

            { timer && <View style={s.timerWrapper}>
                <View style={s.timerSliderWrapper}>
                    <RadialSliderWrapper
                        variant={'radial-circle-slider'}
                        startAngle={90}
                        max={timer.timeInSec}
                        min={0}
                        value={timer.timeInSec}
                        onChange={(value) => setTimer({...timer, timeInSec: value})}
                        step={1}
                        radius={72}
                        sliderWidth={8}
                        sliderTrackColor='#0000001A'
                        thumbRadius={0}
                        thumbBorderWidth={0}
                        lineSpace={0}
                        isHideCenterContent
                        linearGradient={[{offset: '0%', color: Colors.mainColor}, {offset: '100%', color: Colors.mainColorLight}]}
                    />
                    <Pressable
                        style={s.timerButtonWrapper}
                        onPress={() => timer.timeInSec > 0 && toggleTimer(timer)}
                    >
                        <Image
                            source={timer.isStarted ? pauseTimerIcon : startTimerIcon}
                            style={[s.timerButton, {marginLeft: timer.isStarted ? 12 : 14 }]}
                        />
                    </Pressable>
                </View>

                <Text style={[s.timerText, {color: isLight() ? Colors.grey : Colors.lightGrey}]}>
                    {getTimerTextFromSeconds(timer.timeInSec)}
                </Text>
            </View> }

            {isLastStep && (
                <View style={s.rateRecipeWrapper}>
                    <Text type='caption'>{t('Rate recipe')}</Text>
                    <View style={theme.rateRecipeStars}>
                        {Array.from({length: 5}, (_, index) => (
                            <Pressable key={index} onPress={() => setRate(index + 1)}>
                                <Image source={
                                        recipe.userRating && recipe.userRating >= index + 1
                                            ? filledStar : (isLight() ? greyStar : star) }
                                    style={theme.rateRecipeStar}
                                />
                            </Pressable>    
                        ))}
                    </View>
                    {recipe.userRating && <Text style={s.rateRecipeText}>
                        {t(ratingCaptions[recipe.userRating as keyof typeof ratingCaptions])}
                    </Text>}
                </View>
            )}
        </View>
    )
}

const s = StyleSheet.create({
    titleImageWrapper: {
        position: 'relative',
        marginBottom: 8,
    },
    titleImage: {
        width: '100%',
        height: 328,
        marginBottom: 12,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    simpleBackButton: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },
    backButton: {
        position: 'absolute',
        top: 18,
        left: 18,
    },
    infoWrapper: {
        marginTop: 30,
        marginHorizontal: 15,
        flexDirection: 'row',
        gap: 10,
    },
    infoIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 8,
        backgroundColor: '#C3803A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerWrapper: {
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerSliderWrapper: {
        position: 'relative',
    },
    timerButtonWrapper: {
        position: 'absolute',
        top: 52,
        left: 52,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.mainColor,
    },
    timerButton: {
        width: 24,
        height: 24,
        marginTop: 12,
    },
    timerText: {
        marginTop: 12,
        lineHeight: 32,    
        alignContent: 'center',
        justifyContent: 'center',
        fontSize: 26,
        fontWeight: '700',
        fontFamily: 'DMSans-Bold',
    },
    rateRecipeWrapper: {
        marginTop: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateRecipeText: {
        marginTop: 18,
        alignContent: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: '700',
    },
})