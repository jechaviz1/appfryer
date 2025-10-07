import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, StyleSheet, Image, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, Lines, ScrollView, View, Text } from "@/components/base/BaseComponents"
import { theme, paddings } from '@/constants/Theme'
import { useAppState } from '@/contexts/appStateContext'
import IRecipe, { IRecipeStep } from '@/interfaces/Recipe'
import { Colors } from '@/constants/Colors'
import Header from '@/components/Header'

import { fakeCookingSteps } from '@/services/fakeData'

import CookingInitTab from '@/components/cooking/CookingInitTab'
import CookingIngredientsTab from '@/components/cooking/CookingIngredientsTab'
import CookingStepTab from '@/components/cooking/CookingStepTab'


export default function StartCooking() {
    const router = useRouter()
    const { appState, setAppState } = useAppState()
    const { t } = useTranslation()
    
    const [recipe, setRecipe] = useState<IRecipe>()
    const [currentStep, setCurrentStep] = useState(0)
    const [timer, setTimer] = useState<{ timeInSec: number; isStarted: boolean }>({ timeInSec: 0, isStarted: false })
    
    const onClose = () => {
        setAppState({ ...appState, actualRecipe: undefined })
        router.back()
    }

    const onBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        } else {
            onClose()
        }
    }

    const onNext = () => {
        if ((currentStep + 1) < (recipe?.cookingSteps?.length || 0)) {
            setCurrentStep(currentStep + 1)
        } else {
            onClose()
        }
    }

    const onStepPress = (stepIndex: number) => {
        setCurrentStep(stepIndex)
    }

    useEffect(() => {
        if (!appState.actualRecipe) {
            return
        }
        appState.actualRecipe.cookingSteps && Array.isArray(appState.actualRecipe.cookingSteps)
            ? setRecipe(appState.actualRecipe)
            : setRecipe({...appState.actualRecipe, cookingSteps: fakeCookingSteps})
    }, [])

    useEffect(() => {
        if (recipe?.cookingSteps?.[currentStep]?.cookingTime) {
            setTimer({ 
                timeInSec: recipe.cookingSteps[currentStep].cookingTime * 60, 
                isStarted: false 
            })
        }
    }, [currentStep, recipe])

    useEffect(() => {
        if (timer.isStarted && timer.timeInSec > 0) {
            const interval = setInterval(() => {
                setTimer(prev => ({ ...prev, timeInSec: prev.timeInSec - 1 }))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [timer.isStarted, timer.timeInSec])

    if (!recipe) {
        return null
    }
    
    const currentStepData = recipe.cookingSteps?.[currentStep]
    const totalSteps = recipe.cookingSteps?.length || 0
    const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0

    const toggleTimer = () => {
        setTimer(prev => ({ ...prev, isStarted: !prev.isStarted }))
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getImageSource = () => {
        const currentStepData = recipe.cookingSteps?.[currentStep];
        if (currentStepData?.mediaUuid) {
            const media = recipe.medias?.find(m => m.uuid === currentStepData.mediaUuid);
            if (media?.url) {
                return { uri: media.url };
            }
        }
        // if (recipe.medias?.[0]?.url) {
        //     return { uri: recipe.medias[0].url };
        // }
        return require('@/assets/images/cooking.png');
    }

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={theme.statusBarHeight} />
            <Header 
                title={t('Start Recipe')}
                onBack={onBack}
            />

            {/* Main Content */}
            <ScrollView style={s.content}>
                {/* Recipe Image */}
                <View style={s.imageContainer}>
                    <Image 
                        source={getImageSource()} 
                        style={s.recipeImage} 
                    />
                    
                    {/* Progress Bar */}
                    <View style={s.progressContainer}>
                        <View style={s.progressBar}>
                            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={s.stepCounter}>{currentStep + 1}/{totalSteps}</Text>
                    </View>
                </View>

                {/* Step Navigation */}
                <View style={s.stepNavigation}>
                    {Array.from({ length: totalSteps }, (_, index) => (
                        <Pressable
                            key={index}
                            style={[
                                s.stepButton,
                                index === currentStep ? s.stepButtonActive : s.stepButtonInactive
                            ]}
                            onPress={() => onStepPress(index)}
                        >
                            <Text style={[
                                s.stepButtonText,
                                index === currentStep ? s.stepButtonTextActive : s.stepButtonTextInactive
                            ]}>
                                {index === 0 ? t('Step 1') : index + 1}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Step Content */}
                <View style={s.stepContent}>
                    <Text style={s.stepTitle}>
                        { t('Step') + ' ' + (currentStep + 1) + ': ' + currentStepData?.title }
                    </Text>
                    <Text style={s.stepDescription}>
                        {currentStepData?.description}
                    </Text>

                    {/* Timer */}
                    {currentStepData?.cookingTime && timer.timeInSec > 0 && (
                        <View style={s.timerContainer}>
                            <View style={s.timerCircle}>
                                <Text style={s.timerText}>{formatTime(timer.timeInSec)}</Text>
                            </View>
                            <Pressable style={s.timerButton} onPress={toggleTimer}>
                                <Image 
                                    source={timer.isStarted 
                                        ? require('@/assets/icons/pause-white.png') 
                                        : require('@/assets/icons/video-triangle.png')
                                    } 
                                    style={s.timerButtonIcon} 
                                />
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* Action Button */}
                <View style={s.actionContainer}>
                    <Button
                        text={currentStep >= totalSteps - 1 ? t('Done') : t('Next step')}
                        onPress={onNext}
                        style={s.actionButton}
                        textStyle={s.actionButtonText}
                        size="large"
                    />
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F5F2',
    },
    header: {
        backgroundColor: '#8B4513',
        paddingTop: 50,
    },
    content: {
        flex: 1,
        backgroundColor: '#F9F5F2',
    },
    imageContainer: {
        position: 'relative',
        height: 275,
        backgroundColor: '#F9F5F2',
    },
    recipeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'transparent',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: Colors.white,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#C3803A',
        borderRadius: 2,
    },
    stepCounter: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    stepNavigation: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 4,
    },
    stepButton: {
        height: 32,
        borderRadius: 18,
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#F9F2EC',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    stepButtonActive: {
        backgroundColor: '#F6ECE2',
    },
    stepButtonInactive: {
        backgroundColor: '#F9F2EC',
    },
    stepButtonText: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        letterSpacing: 0,
        color: '#919191',
    },
    stepButtonTextActive: {
        color: '#C28040',
    },
    stepButtonTextInactive: {
        color: '#919191',
    },
    stepContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        flex: 1,
    },
    stepTitle: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0,
        color: '#000000',
        marginBottom: 12,
    },
    stepDescription: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        color: '#6C7278',
        marginBottom: 30,
    },
    timerContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    timerCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 8,
        borderColor: '#E0E0E0',
    },
    timerText: {
        fontSize: 31,
        fontWeight: '700',
        color: '#C3803A',
        lineHeight: 35,
    },
    timerButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#C3803A',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    timerButtonIcon: {
        width: 16,
        height: 20,
        tintColor: Colors.white,
    },
    actionContainer: {
        paddingHorizontal: 62,
        paddingBottom: 28,
    },
    actionButton: {
        height: 53,
        borderRadius: 11,
        paddingTop: 11,
        paddingRight: 27,
        paddingBottom: 11,
        paddingLeft: 27,
        backgroundColor: '#C28040',
        gap: 11,
    },
    actionButtonText: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22.4, // 140% of 16px
        letterSpacing: -0.16, // -1% of 16px
        textAlign: 'center',
        color: '#FFFFFF',
    },
})