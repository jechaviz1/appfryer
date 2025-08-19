import { useCallback, useState } from 'react'
import { Pressable, StyleSheet } from "react-native"
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { Button, ChoiceItem, ScrollView, Text, View } from "@/components/base/BaseComponents"
import ImageLibrary from '@/components/ImageLibrary'
import AddIngredientModal from '@/components/modals/AddIngredientModal'
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import WeeklyFeedItem, { IWeeklyFeed } from '@/components/WeeklyFeedItem'
import Folders from '@/components/modals/Folders'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { fetchShoppingListByRecipes } from '@/services/fetches'
import { theme, isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { MediaType } from '@/interfaces/Media'
import { IShoppingListItemByRecipe } from '@/interfaces/ShoppingList'
import IIngredinent, { IIngredientForShoppingList } from '@/interfaces/Ingredient'
import IRecipe from '@/interfaces/Recipe'
import IPlanMeal from '@/interfaces/WeeklyPlan'
import { logError } from '@/services/utils'

interface IInterest {
    id?: number
    title: string
    checked: boolean
}

export default function MySpaceScreen() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()

    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [showFolders, setShowFolders] = useState(false)
    const [showAddIngredient, setShowAddIngredient] = useState(false)
    const [interests, setInterests] = useState<IInterest[]>([])
    const [savedRecipes, setSavedRecipes] = useState<IRecipeCard[]>([])
    const [weeklyPlan, setWeeklyPlan] = useState<IWeeklyFeed[]>([])
    const [shoppingList, setShoppingList] = useState<IShoppingListItemByRecipe[]>([])

    const fetchInterests = useCallback(async () => {
        const prefs = await AsyncStorage.getItem('preferences')
        if (prefs) {
            const prefsTmp = JSON.parse(prefs)
            const interestsTmp = prefsTmp.find((p: any) => p.name === 'interests')
            if (interestsTmp) {
                return setInterests(
                    [{ title: 'All', checked: true }]
                        .concat(interestsTmp.items.map((i: any) => ({ id: i.id, title: i.title, checked: false })))
                )
            }
        }

        const fetchedInterests: IInterest[] = await get({ url: '/meta/interests', token: user?.token })
        setInterests(
            [{ title: 'All', checked: true }]
                .concat(fetchedInterests.map((i) => ({ id: i.id, title: i.title, checked: false })))
        )
    }, [])

    const fetchSavedRecipes = useCallback(async () => {
        // TODO: get saved recipes firstly from AsyncStorage and then from the server
        const recipes: IRecipe[] = await post({ url: '/feed', data: { type: 'saved' }, token: user?.token })

        const savedRecipes: IRecipeCard[] = recipes.map((r: IRecipe) => {
            const img = r.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname
            }
        })

        setSavedRecipes(savedRecipes)
    }, [])

    const fetchWeeklyPlan = useCallback(async () => {
        // TODO: get weekly plan firstly from AsyncStorage and then from the server
        const today = (new Date()).setHours(0, 0, 0, 0)
        const nextWeek = (new Date(today + 6 * 24 * 60 * 60 * 1000)).setHours(23, 59, 59, 0)
        const todayStr = new Date(today).toISOString().split('T')[0]
        const nextWeekStr = new Date(nextWeek).toISOString().split('T')[0]

        const plan: IPlanMeal[] = await post({ url: '/plan', data: { mealDateFrom: todayStr, mealDateTo: nextWeekStr }, token: user?.token })

        const weeklyRecipes: IWeeklyFeed[] = plan.map(item => {
            const img = item.recipe.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: item.id,
                title: item.recipe.title,
                image: img?.url || '',
                type: item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1),
                rating: item.recipe.avgRating,
                time: item.recipe.timeCooking,
            }
        })

        setWeeklyPlan(weeklyRecipes)
    }, [])

    useFocusEffect(
        useCallback(() => {
            fetchInterests()
            fetchSavedRecipes()
            fetchWeeklyPlan()
            fetchShoppingListByRecipes(setShoppingList, user?.token)
        }, [])
    )

    const toggleInterest = useCallback((i: IInterest) => {
        if (i.title === 'All') {
            const newInterests = interests.map((item: IInterest) => {
                return { ...item, checked: item.title === 'All' }
            })
            setInterests(newInterests)
            return
        }
        const index = interests.findIndex((item: IInterest) => item.title === i.title)
        if (index === -1) {
            return
        }
        const newInterests = [...interests]
        newInterests[0].checked = false
        newInterests[index].checked = !newInterests[index].checked
        setInterests(newInterests)
    }, [interests])

    const toggleSelectedIngredientByRecipe = useCallback((ingredient: IIngredientForShoppingList) => {
        setSentReq(true)
        post({
            url: `/shoppingList/${ingredient.isChecked ? 'uncheck' : 'check'}/${ingredient.id}`,
            token: user?.token
        })
            .then((ing: IIngredientForShoppingList) => {
                setShoppingList(prev => prev.map(recipe => {
                    return {
                        ...recipe,
                        ingredients: recipe.ingredients.map(i => i.ingredientId === ing.ingredientId ? ing : i)
                    }
                }))
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [])

    const onAddIngredient = useCallback((ingredient: IIngredinent) => {
        setSentReq(true)
        post({
            url: '/shoppingList/add/ingredient',
            token: user?.token,
            data: {
                ingredientId: ingredient.id,
                measureId: ingredient.measureId,
                cnt: ingredient.cnt,
            }
        })
            .then(newShoppingList => {
                setShoppingList(newShoppingList)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [])

    return (
        <View style={theme.container}>
            { showFolders && <Folders
                isVisible={showFolders}
                onHide={() => setShowFolders(false)}
            /> }
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={theme.titleContainer}>
                    <Text style={{ flex: 1 }} type='subtitle'>{t('My space')}</Text>
                </View>

                {/* Saved recipes */}
                <View style={[theme.titleContainer, s.section, { justifyContent: 'space-between' }]}>
                    <Text type="caption">{t('Saved recipes')}</Text>
                    {/* <Link href={{
                        pathname: `/(pages)/feed`,
                        params: { type: 'saved', title: 'Saved recipes' }
                    }}> */}
                    <Pressable onPress={() => setShowFolders(true)}>
                        <Text type='link' style={theme.bold}>{t('See All')}</Text>
                    </Pressable>
                    {/* </Link> */}
                </View>

                {/* Interests */}
                <ScrollView horizontal>
                    {interests.map((i) => (
                        <Button
                            key={i.title}
                            shape='round'
                            text={i.title}
                            onPress={() => toggleInterest(i)}
                            style={[
                                s.interestBtn,
                                !i.checked && {backgroundColor: isLight() ? Colors.lightGrey : Colors.grey},
                            ]}
                            textStyle={!i.checked && {color: isLight() ? '#000000A6' : '#FFFFFFA6'}}
                            isWide={false}
                            size="medium"
                        />
                    ))}
                </ScrollView>

                {/* Saved recipes */}
                <ScrollView horizontal style={s.section}>
                    {savedRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </ScrollView>

                {/* Weekly plan */}
                <View style={[theme.titleContainer, s.section, {
                    justifyContent: 'space-between'
                }]}>
                    <Text type="caption">{t('Weekly plan')}</Text>
                    <Pressable onPress={() => router.push('/(pages)/weekly-plan')}>
                        <Text type='link' style={theme.bold}>{t('See All')}</Text>
                    </Pressable>
                </View>
                <ScrollView horizontal style={s.section}>
                    {weeklyPlan.map((recipe, index) => (
                        <WeeklyFeedItem key={index} recipe={recipe} />
                    ))}
                </ScrollView>

                {/* Shopping list */}
                <View style={[theme.titleContainer, s.section, {
                    justifyContent: 'space-between'
                }]}>
                    <Text type="caption">{t('Shopping list')}</Text>
                    <Pressable onPress={() => router.push('/(pages)/shopping-list')}>
                        <Text type='link' style={theme.bold}>{t('See All')}</Text>
                    </Pressable>
                </View>

                {shoppingList && shoppingList[0] && (
                    <View style={{ marginBottom: 10 }}>
                        <Text type='caption'>{shoppingList[0].recipeTitle || t('General')}</Text>
                        {shoppingList[0].ingredients.map((item: IIngredientForShoppingList) => (
                            <ChoiceItem
                                key={item.id}
                                id={item.ingredientId}
                                img={ImageLibrary.icons[item.category.icon as keyof typeof ImageLibrary.icons] || item.category.thumb}
                                text={item.ingredientTitle}
                                onPress={() => !isSentReq && toggleSelectedIngredientByRecipe(item)}
                                info
                                quantity={`${item.cnt || ''} ${item.measureTitle || ''}`}
                                checked={item.isChecked}
                            />
                        ))}
                    </View>
                )}

                {/* Adding ingredient */}
                <Pressable onPress={() => !isSentReq && setShowAddIngredient(true)}>
                    <Text type='link'>{t('Add an ingredient')}</Text>
                </Pressable>

                {showAddIngredient && <AddIngredientModal
                    isVisible={showAddIngredient}
                    hideAndClear={() => setShowAddIngredient(false)}
                    onSubmit={onAddIngredient}
                /> }

                <View style={{ marginTop: 80 }} />
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    section: {
        marginTop: 20,
        marginBottom: 6,
    },
    interestBtn: {
        marginBottom: 6,
        marginRight: 9,
        paddingHorizontal: 17,
        backgroundColor: Colors.mainColor,
    },
})