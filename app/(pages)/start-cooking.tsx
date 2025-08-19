import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, Lines, ScrollView, View } from "@/components/base/BaseComponents"
import { theme, paddings } from '@/constants/Theme'
import { useAppState } from '@/contexts/appStateContext'
import IRecipe, { IRecipeStep } from '@/interfaces/Recipe'

import { fakeCookingSteps } from '@/services/fakeData'

import CookingInitTab from '@/components/cooking/CookingInitTab'
import CookingIngredientsTab from '@/components/cooking/CookingIngredientsTab'
import CookingStepTab from '@/components/cooking/CookingStepTab'


export default function StartCooking() {
    const router = useRouter()
    const tabsRef = useRef<FlatList>(null)
    const { appState, setAppState } = useAppState()
    const { t } = useTranslation()
    
    const [recipe, setRecipe] = useState<IRecipe>()
    const [activeTab, setActiveTab] = useState(0)
    const [steps, setSteps] = useState<JSX.Element[]>([])
    
    const onClose = () => {
        setAppState({ ...appState, actualRecipe: undefined })
        router.back()
    }

    const onBack = () => setActiveTab(activeTab - 1)

    useEffect(() => {
        if (!appState.actualRecipe) {
            return
        }
        appState.actualRecipe.cookingSteps && Array.isArray(appState.actualRecipe.cookingSteps)
            ? setRecipe(appState.actualRecipe)
            : setRecipe({...appState.actualRecipe, cookingSteps: fakeCookingSteps})
    }, [])

    useEffect(() => {
        if (!recipe) {
            return
        }
        const cookingSteps: JSX.Element[] = recipe.cookingSteps.map((step, index) => <CookingStepTab
            recipe={recipe}
            setRecipe={setRecipe}
            onBack={onBack}
            step={step}
            stepIndex={index + 1}
            isLastStep={index === recipe.cookingSteps.length - 1} />
        )

        setSteps([
            <CookingInitTab onClose={onClose}/>,
            <CookingIngredientsTab recipe={recipe} onBack={onBack}/>,
            ...cookingSteps,
        ])
    }, [recipe, activeTab])

    useEffect(() => {
        tabsRef.current?.scrollToIndex({ index: activeTab, animated: true })
    }, [activeTab]) 

    if (!recipe) {
        return null
    }

    const renderStep = ({ index }: { index: number }) => {
        return (
            <View style={[s.stepWrapper, { width: Dimensions.get('window').width - paddings * 2 }]}>
                <View style={{ minHeight: Dimensions.get('window').height - 260 }}>
                    {steps[index]}
                </View>

                <View style={s.linesWrapper}>
                    {activeTab > 0
                        ? <Lines count={recipe.cookingSteps.length + 1} current={activeTab - 1}/>
                        : <View style={s.linesInactive} />
                    }
                </View>
                <Button
                    text={index === steps.length - 1 ? t('Done') : t('Next')}
                    onPress={() => steps.length === index + 1 ? onClose() : setActiveTab(index + 1)}
                    size='large'
                    style={s.nextBtn}
                />
            </View>
        )
    }

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={[theme.mainContainer, { height: Dimensions.get('screen').height - 75 }]}>
                <FlatList
                    ref={tabsRef}
                    data={steps.map((_, index) => index)}
                    renderItem={renderStep}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                />
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    stepWrapper: {
        paddingBottom: 20,
    },
    nextBtn: {
        alignSelf: 'flex-end',
    },
    linesWrapper: {
        marginVertical: 50,
        marginHorizontal: 'auto',
    },
    linesInactive: {
        height: 6,
        width: '100%',
    },
})