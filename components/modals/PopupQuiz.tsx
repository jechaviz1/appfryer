import { Dimensions, FlatList, Image, Pressable, StyleSheet } from "react-native"
import React, { useEffect, useRef, useState } from "react"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { Button, IngredientButton, Lines, Text, View } from "@/components/base/BaseComponents"
import IPrefItem from "@/interfaces/PrefItem"
import { theme, paddings, getBgColor } from "@/constants/Theme"
import { Colors } from "@/constants/Colors"

const ingredientsFake: IPrefItem[] = [{
    id: 1,
    icon: 'eggs',
    title: 'Eggs',
    checked: false,
}, {
    id: 2,
    icon: 'milk',
    title: 'Milk',
    checked: false,
}, {
    id: 3,
    icon: 'bread',
    title: 'Bread',
    checked: false,
}, {
    id: 4,
    icon: 'butter',
    title: 'Butter',
    checked: false,
}, {
    id: 5,
    icon: 'cheese',
    title: 'Cheese',
    checked: false,
}, {
    id: 6,
    icon: 'peppers',
    title: 'Bell pepper',
    checked: false,
}, {
    id: 7,
    icon: 'pasta',
    title: 'Pasta',
    checked: false,
},
]

export default function PopupQuiz({ isVisible, onHide }: { isVisible: boolean, onHide: () => void }) {
    const { t } = useTranslation()
    const sliderRef = useRef<FlatList>(null)
    const [currentSlide, setCurrentSlide] = useState<number>(0)
    const [ingredients, setIngredients] = useState<IPrefItem[]>([])
    const [starIngredient, setStarIngredient] = useState<IPrefItem | null>(null)
    const [errorOnClickNext, setErrorOnClickNext] = useState<string | null>(null)

    useEffect(() => {
        setIngredients(ingredientsFake)
    }, [])

    useEffect(() => {
        sliderRef.current?.scrollToIndex({
            index: currentSlide,
            animated: true,
        })
    }, [currentSlide])

    const xIcon = require('@/assets/icons/x.png')
    const recipeImg = require('@/assets/icons/recipe.png')

    const hide = () => {
        onHide()
        setIngredients(ingredientsFake)
        setErrorOnClickNext(null)
        setStarIngredient(null)
        setCurrentSlide(0)
    }

    function slide1func(): React.JSX.Element {
        return <View style={s.slide}>
            <View style={s.recipeWrapper}>
                <View style={s.recipeCircle}>
                    <Image source={recipeImg} style={{ width: 36, height: 36 }} />
                </View>
            </View>
            <View style={s.slideMainPart}>
                <Text type='defaultSemiBold' style={theme.bold}>{t('What would you like to eat?')}</Text>
                <Text style={{ textAlign: 'center' }}>{t('Answer a few questions and we’ll create your new recipe.')}</Text>
            </View>
        </View>
    }

    const toggleIngredient = (ingredient: IPrefItem) => {
        const newIngredients = ingredients.map(item => item.id === ingredient.id ? { ...item, checked: !item.checked } : item)
        setIngredients(newIngredients)
    }

    function slide2func(): React.JSX.Element {
        return <View style={s.slide}>
            <View style={s.slideMainPart}>
                <Text type='defaultSemiBold' style={theme.bold}>{t('What ingredients do you have?')}</Text>
                <View style={s.ingredientsWrapper}>
                    {ingredients.map((ingredient, index) => {
                        const isSelected = ingredients.filter(
                            (item: IPrefItem) => item.id === ingredient.id && ingredient.checked)

                        return (
                            <IngredientButton
                                ingredient={ingredient}
                                key={index}
                                onPress={() => toggleIngredient(ingredient)}
                                checked={isSelected.length > 0}
                            />
                        )
                    })}
                </View>

                <Lines count={2} current={0}/>
            </View>
        </View>
    }

    const toggleStarIngredient = (ingredient: IPrefItem) => {
         setStarIngredient(starIngredient?.id === ingredient.id ? null : ingredient)
    }

    function slide3func(): React.JSX.Element {
        return <View style={s.slide}>
            <View style={s.slideMainPart}>
                <Text type='defaultSemiBold' style={theme.bold}>{t('What is your star ingredient?')}</Text>
                <View style={s.ingredientsWrapper}>
                    {ingredients.filter((item: IPrefItem) => item.checked).map((ingredient, index) => {
                        const isSelected = !!starIngredient && starIngredient.id === ingredient.id

                        return (
                            <IngredientButton
                                ingredient={ingredient}
                                key={index}
                                onPress={() => toggleStarIngredient(ingredient)}
                                checked={isSelected}
                            />
                        )
                    })}
                </View>

                <Lines count={2} current={1}/>
            </View>
        </View>
    }

    const slides: React.JSX.Element[] = [slide1func(), slide2func(), slide3func()]

    const onClickNext = () => {
        if (currentSlide < slides.length - 1) {
            setErrorOnClickNext(null)
            if (currentSlide === 1) {
                if (ingredients.findIndex(item => item.checked) === -1) {
                    return setErrorOnClickNext(t('Please select at least one ingredient'))
                }
            }
            return setCurrentSlide(currentSlide + 1)
        }
        hide()
    }

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={hide}
            style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
        >
            <View style={{ width: '100%' }}>
                <Pressable onPress={hide} style={{ alignSelf: 'flex-end' }}>
                    <Image source={xIcon} style={{ width: 18, height: 18 }} />
                </Pressable>
            </View>

            <FlatList
                ref={sliderRef}
                data={slides}
                renderItem={({ item }) => item}
                horizontal
                initialScrollIndex={0}
                style={{ flexDirection: 'row' }}
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
            />

            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                {errorOnClickNext && <Text style={s.errorOnClickNext}>{errorOnClickNext}</Text>}
                <Button
                    text={t('Next')}
                    onPress={onClickNext}
                    size="large"
                />
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.5,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },
    slide: {
        width: Dimensions.get('window').width - paddings * 2,
    },
    recipeWrapper: {
        alignItems: 'center',
        marginTop: 26,
        marginBottom: 40,
    },
    recipeCircle: {
        width: 96,
        height: 96,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C3803A1A',
    },
    slideMainPart: {
        gap: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ingredientsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 32,
    },
    errorOnClickNext: {
        color: Colors.mainColor,
        textAlign: 'center',
    },
})