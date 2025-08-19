import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, IngredientButton, Lines, ModalTitle, ScrollView, Text, View } from '@/components/base/BaseComponents'
import IngredientSearchInput from '@/components/IngredientSearchInput'
import RecipeBrief from '@/components/RecipeBrief'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import IFolder from '@/interfaces/Folder'
import IPrefItem from "@/interfaces/PrefItem"
import IRecipe from '@/interfaces/Recipe'
import { paddings, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { logError } from '@/services/utils'

const ingredientsPreset: IPrefItem[] = [{
    id: 79,
    icon: 'egg',
    title: 'Egg',
    checked: false,
}, {
    id: 127,
    icon: 'milk',
    title: 'Milk',
    checked: false,
}, {
    id: 26,
    icon: 'bread',
    title: 'Bread',
    checked: false,
}, {
    id: 36,
    icon: 'butter',
    title: 'Butter',
    checked: false,
}, {
    id: 49,
    icon: 'cheese',
    title: 'Cheese',
    checked: false,
}, {
    id: 159,
    icon: 'peppers',
    title: 'Peppers',
    checked: false,
}, {
    id: 150,
    icon: 'pasta',
    title: 'Pasta',
    checked: false,
},
]

export default function Quiz() {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, setUser } = useAuth()
    const sliderRef = useRef<FlatList>(null)

    const [displayQuiz, setDisplayQuiz] = useState<boolean>(true)
    const [currentSlide, setCurrentSlide] = useState<number>(0)
    const [ingredients, setIngredients] = useState<IPrefItem[]>([])
    const [starIngredient, setStarIngredient] = useState<IPrefItem | null>(null)
    const [errorOnClickNext, setErrorOnClickNext] = useState<string | null>(null)
    const [recipes, setRecipes] = useState<IRecipe[]>([])

    useEffect(() => {
        setIngredients(ingredientsPreset)
    }, [])

    useEffect(() => {
        sliderRef.current?.scrollToIndex({
            index: currentSlide,
            animated: true,
        })
    }, [currentSlide])

    const slide1func = useCallback((): React.JSX.Element => {
        return <View style={s.slide}>
            <Image
                source={require('@/assets/images/quiz-banner.png')}
                style={s.quizBannerImg}
                resizeMode="contain"
            />
            <Text type="subtitle" style={s.quizBannerText}>{t('What would you like to eat?')}</Text>
        </View>
    }, [])

    const slide2func = useCallback((): React.JSX.Element => {
        return <View style={s.slide}>
            <View style={s.recipeWrapper}>
                <View style={s.recipeCircle}>
                    <Image source={require('@/assets/icons/recipe.png')} style={{ width: 36, height: 36 }} />
                </View>
            </View>
            <View style={s.slideMainPart}>
                <Text style={[theme.bold, {fontSize: 18, lineHeight: 28}]}>{t('What would you like to eat?')}</Text>
                <Text style={{ textAlign: 'center' }}>{t('Answer a few questions and we’ll create your new recipe.')}</Text>
            </View>
        </View>
    }, [])

    const toggleIngredient = useCallback((ingredient: IPrefItem) => {
        const newIngredients = ingredients.map(item => item.id === ingredient.id ? { ...item, checked: !item.checked } : item)
        setIngredients(newIngredients)
    }, [ingredients])

    const onAddIngredient = useCallback((ingredient: IPrefItem) => {
        const newIngredients = [...ingredients, {...ingredient, checked: true}]
        setIngredients(newIngredients)
    }, [ingredients])

    const slide3func = useCallback((): React.JSX.Element => {
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
                
                <View style={s.otherIngredients}>
                    <IngredientSearchInput
                        selected={ingredients}
                        onSelectedIngredient={ingredient => onAddIngredient(ingredient as IPrefItem)}
                        placeholder={t('Other ingredients')}
                        textInputStyle={{ height: 50 }}
                    />
                </View>

                <Lines count={2} current={0}/>
            </View>
        </View>
    }, [ingredients])

    const toggleStarIngredient = useCallback((ingredient: IPrefItem) => {
        console.log('ingredient', ingredient)
        setStarIngredient(starIngredient?.id === ingredient.id ? null : ingredient)
    }, [])

    const slide4func = useCallback((): React.JSX.Element => {
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
    }, [ingredients, starIngredient])

    const slides: React.JSX.Element[] = [slide1func(), slide2func(), slide3func(), slide4func()]

    const reset = useCallback(() => {
        setCurrentSlide(0)
        setIngredients(ingredientsPreset)
        setStarIngredient(null)
    }, [])

    const onClickNext = useCallback(async () => {
        if (currentSlide < slides.length - 1) {
            setErrorOnClickNext(null)
            if (currentSlide === 2) {
                if (ingredients.findIndex(item => item.checked) === -1) {
                    return setErrorOnClickNext(t('Please select at least one ingredient'))
                }
            }
            return setCurrentSlide(currentSlide + 1)
        }

        // on last slide
        // find the recipes
        console.log('starIngredient', starIngredient)
        const ids = starIngredient ? [starIngredient.id] : ingredients.filter(i => i.checked).map(i => i.id)
        let recipesData: IRecipe[]
        try {
            recipesData = await post({
                url: '/feed',
                data: {filterIngredientCategories: `[${ids.toString()}]`},
                token: user?.token})
        } catch (e) {
            logError(e)
            reset()

            return setErrorOnClickNext('Something went wrong')
        }

        if (recipesData.length === 0) {
            reset()
            return setErrorOnClickNext(t('No recipes found. Try again'))
        }

        setDisplayQuiz(false)
        setRecipes(recipesData)
    }, [currentSlide, ingredients])

    const startAgain = useCallback(() => {
        setDisplayQuiz(true)
        reset()
    }, [])

    const toggleFollowing = useCallback((userId: number, isFollowing: boolean) => {
        post({
            url: `/profile/${userId}/${isFollowing ? 'unfollow' : 'follow'}`,
            token: user?.token,
        })
            .then((curUser) => {
                setUser({...user, ...curUser})
                const updRecipes = recipes.map((recipe: IRecipe) => {
                    if (recipe.userId === userId) {
                        return {...recipe, userIsFollowing: !isFollowing}
                    }
                    return recipe
                })
                setRecipes(updRecipes)
            })
            .catch(logError)
    }, [recipes])

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <ModalTitle title={t('Quiz')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/')} />

                {/* Quiz */}
                {displayQuiz && <View style={{flex: 1}}>
                    <FlatList
                        ref={sliderRef}
                        data={slides}
                        renderItem={({ item }) => item}
                        horizontal
                        initialScrollIndex={0}
                        style={{ flex: 1, flexDirection: 'row' }}
                        pagingEnabled
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                    />
        
                    <View style={{marginTop: 40}}>
                        {errorOnClickNext && <Text style={s.errorOnClickNext}>{errorOnClickNext}</Text>}
                        <Button
                            text={t('Next')}
                            onPress={onClickNext}
                            size="large"
                        />
                    </View>
                </View> }

                {/* Recipes */}
                {!displayQuiz && <View>
                    {/* Quiz banner */}
                    <Pressable onPress={startAgain}>
                        {slide1func()}
                    </Pressable>

                    {/* Recipes */}
                    <View style={s.recipes}>
                        {recipes.map(recipe => <RecipeBrief
                            key={recipe.id}
                            recipe={recipe}
                            toggleFollowing={toggleFollowing}
                            onUpdateFolders={(folders: IFolder[]) => {
                                const updRecipes = recipes.map((r: IRecipe) => r.id === recipe.id
                                    ? {...r, isSaved: true, folders}
                                    : r)
                                setRecipes(updRecipes)
                            }}
                            onUnsave={() => {
                                const updRecipes = recipes.map((r: IRecipe) => r.id === recipe.id
                                    ? {...r, folders: [], isSaved: false}
                                    : r)
                                setRecipes(updRecipes)
                            }}
                        />)}
                    </View>
                </View> }
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    slide: {
        width: Dimensions.get('window').width - paddings * 2,
    },
    quizBannerImg: {
        width: '100%',
    },
    quizBannerText: {
        color: Colors.white,
        position: 'absolute',
        top: 92,
        left: 16,
        width: '50%',
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
    otherIngredients: {
        marginVertical: 36,
        height: 150,
        width: '100%',
    },
    errorOnClickNext: {
        color: Colors.mainColor,
        textAlign: 'center',
    },
    recipes: {
        gap: 8,
        marginBottom: 60,
    },
})