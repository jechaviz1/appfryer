import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet } from "react-native"
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { IngredientButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Search from "@/components/Search"
import IngredientSearchInput from "@/components/IngredientSearchInput"
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import RecipeOfMonth from '@/components/RecipeOfMonth'
import Challenges from '@/components/Challenges'
import Achievements from '@/components/Achievements'
import Categories from '@/components/Categories'
import Diets from '@/components/Diets'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { theme, isLight } from '@/constants/Theme'
import { Colors } from "@/constants/Colors"
import IPrefItem from '@/interfaces/PrefItem'
import IRecipe from '@/interfaces/Recipe'
import { MediaType} from '@/interfaces/Media'

const seasonalProdsFake: IPrefItem[] = [
    {
        id: 5,
        icon: 'melons',
        title: 'Melon',
    },
    {
        id: 6,
        icon: 'eggplant',
        title: 'Eggplant',
    },
    {
        id: 7,
        icon: 'parsley',
        title: 'Parsley',
    },
]

export default function SearchScreen() {
    const { user } = useAuth()
    const { t } = useTranslation()
    
    const { searchFilters, setSearchFilters } = useSearchFilters()
    const [fridgeProds, setFridgeProds] = useState<IPrefItem[]>([])
    const [seasonalProds, setSeasonalProds] = useState<IPrefItem[]>([])

    const [searchResults, setSearchResults] = useState<IRecipeCard[]>([])
    const [recipesForYou, setRecipesForYou] = useState<IRecipeCard[]>([])
    const [recipesOfMonth, setRecipesOfMonth] = useState<IRecipeCard[]>([])

    const modifyRecipesForCards = useCallback((recipes: IRecipe[]) => {
        return recipes.map((r: IRecipe) => {
            const img = r.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname
            }
        })
    }, [])

    const fetchRecipes = useCallback((type: string, setRecipes: (recipes: IRecipeCard[]) => void) => {
        post({
            url: '/feed',
            data: { type },
            token: user?.token
        })
            .then((recipes: IRecipe[]) => {
                setRecipes(modifyRecipesForCards(recipes))
            })
            .catch(logError)
    }, [])

    useFocusEffect(useCallback(() => {
        // get({url: '/ingredient/seasonal', token: user?.token})
        //     .then((data: IPrefItem[]) => setSeasonalProds(data))
        //     .catch(logError)

        fetchRecipes('recipesForYou', setRecipesForYou)
        fetchRecipes('recipesOfMonth', setRecipesOfMonth)

        setSeasonalProds(seasonalProdsFake)
    }, []))

    const onSelectIngredientForFridge = useCallback((ingredient: IPrefItem) => {
        setFridgeProds([...fridgeProds, ingredient])
        let newIngredients: IPrefItem[] = [...searchFilters?.explore?.ingredients || []]
        newIngredients.push(ingredient)

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [fridgeProds, searchFilters])

    const toggleIngredient = useCallback((ingredient: IPrefItem) => {
        let newIngredients = [...searchFilters?.explore?.ingredients || []]
        if (newIngredients.filter((item: { id: number }) => item.id === ingredient.id).length > 0) {
            newIngredients = newIngredients.filter((item: { id: number }) => item.id !== ingredient.id)
        } else {
            newIngredients.push({
                id: ingredient.id,
                title: ingredient.title,
                icon: ingredient.icon,
            })
        }

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [searchFilters])

    const removeIngredient = useCallback((ingredient: IPrefItem) => {
        setFridgeProds(fridgeProds.filter(item => item.id !== ingredient.id))

        let newIngredients: IPrefItem[] = [...searchFilters?.explore?.ingredients || []]
        newIngredients = newIngredients.filter(item => item.id !== ingredient.id)

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [fridgeProds, searchFilters])

    const categoryTextColor = isLight() ? Colors.grey : Colors.lightGrey
    const circlePlus = require('@/assets/icons/circle-plus.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={[theme.mainContainer]}>
                <View style={[theme.titleContainer, { marginBottom: 20 }]}>
                    <Text type="subtitle">{t('Explore recipes')}</Text>
                </View>

                <Search
                    page='explore'
                    onSearch={recipes => setSearchResults(modifyRecipesForCards(recipes))}
                    sendOnBlankFiltersEmptyArray
                />

                {/* Fridge ingredients */}
                {/* <View style={s.productSection}>
                    <View style={s.productTitlePart}>
                        <Text type="caption">{t('What is in your fridge?')}</Text>
                    </View>
                    <IngredientSearchInput
                        placeholder='Add ingredients'
                        selected={fridgeProds}
                        onSelectedIngredient={ingredient => onSelectIngredientForFridge(ingredient as IPrefItem)}
                    />
                    <View style={s.products}>
                        {fridgeProds.map((prod, index) => (
                            <IngredientButton
                                ingredient={prod}
                                key={index}
                                needRemoveIcon={true}
                                onPress={() => removeIngredient(prod)}
                            /> )
                        )}
                    </View>
                </View> */}

                {/* Seasonal ingredients */}
                {/* <View style={s.productSection}>
                    <View style={s.productTitlePart}>
                        <Text type="caption">{t('Seasonal ingredients')}</Text>
                        <Pressable style={theme.seeMoreBtn} onPress={() => console.log('see more')}>
                            <Image source={circlePlus} style={{ width: 14, height: 14 }} />
                            <Text style={{ color: Colors.mainColor }}>{t('See more')}</Text>
                        </Pressable>
                    </View>
                    <View style={s.products}>
                        {seasonalProds.map((prod, index) => {
                            const isSelected = searchFilters?.explore?.ingredients?.filter(
                                (item: IPrefItem) => item.id === prod.id) || false

                            return (
                                <IngredientButton
                                    ingredient={prod}
                                    key={index}
                                    onPress={() => toggleIngredient(prod)}
                                    checked={isSelected.length > 0}
                                />
                            )
                        })}
                    </View>
                </View>

                <View style={{ width: '100%', height: 40 }} /> */}

                {/* Search results */}
                {searchResults.length > 0 && (<View>
                    <Text type="caption" style={{ marginBottom: 10 }}>{t('Search results')}</Text>
                    <ScrollView horizontal>
                        {searchResults.map((recipe, index) => (
                            <RecipeCard key={index} recipe={recipe} />
                        ))}
                    </ScrollView>
                </View>)}

                {/* Recipes for you */}
                <View style={[theme.titleContainer, {
                    marginTop: 20,
                    marginBottom: 6,
                    justifyContent: 'space-between'
                }]}>
                    <Text type="caption">{t('Recipes for you')}</Text>
                    <Pressable onPress={() => console.log('see all')}>
                        <Text type='link' style={theme.bold}>{t('See All')}</Text>
                    </Pressable>
                </View>
                <ScrollView horizontal>
                    {recipesForYou.map((recipe, index) => (
                        <RecipeCard key={index} recipe={recipe} />
                    ))}
                </ScrollView>

                {/* Recipes of the month */}
                <View style={[theme.titleContainer, {
                    marginTop: 20,
                    marginBottom: 6,
                    justifyContent: 'space-between'
                }]}>
                    <Text type="caption">{t('Recipes of the month')}</Text>
                </View>
                <ScrollView horizontal style={{ marginBottom: 32 }}>
                    {recipesOfMonth.map((recipe) => (
                        <RecipeOfMonth key={recipe.id} recipe={recipe} />
                    ))}
                </ScrollView>

                {/* <Challenges /> */}

                {/* <Achievements /> */}

                <Categories />

                {/* Type of diet */}
                {/* <Diets /> */}

                {/* Bottom space under tab bar */}
                <View style={{width: '100%', height: 80}}/>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    productSection: {
        marginTop: 20,
        gap: 13,
    },
    productTitlePart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    products: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
})