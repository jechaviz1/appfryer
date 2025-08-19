import { useEffect, useState } from 'react'
import { Dimensions, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, ChoiceItem, ModalTitle, ScrollView, Text, View } from "@/components/base/BaseComponents"
import ImageLibrary from '@/components/ImageLibrary'
import AddIngredientModal from '@/components/modals/AddIngredientModal'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import { fetchShoppingListByRecipes } from '@/services/fetches'
import { theme } from '@/constants/Theme'
import { IShoppingListItemByRecipe} from '@/interfaces/ShoppingList'
import IIngredinent, { IIngredientForShoppingList } from '@/interfaces/Ingredient'
import { logError } from '@/services/utils'

export default function ShoppingList() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()
    // const [modeBy, setModeBy] = useState<'recipes' | 'total'>('recipes')
    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [showAddIngredient, setShowAddIngredient] = useState(false)

    // const [shoppingListByTotal, setShoppingListByTotal] = useState<IShoppingList[]>()
    const [shoppingListByRecipes, setShoppingListByRecipes] = useState<IShoppingListItemByRecipe[]>([])
    
    // const [selectedIngredients, setSelectedIngredients] = useState<IIngredinent[]>([])
    // const [selectedByRecipes, setSelectedByRecipes] = useState<IIngredientForShoppingList[]>([])

    useEffect(() => {
        fetchShoppingListByRecipes(setShoppingListByRecipes, user?.token)
    }, [])

    const toggleSelectedIngredientByRecipe = (ingredient: IIngredientForShoppingList) => {
        setSentReq(true)
        post({
            url: `/shoppingList/${ingredient.isChecked ? 'uncheck' : 'check'}/${ingredient.id}`,
            token: user?.token
        })
            .then((ing: IIngredientForShoppingList) => {
                setShoppingListByRecipes(prev => prev.map(recipe => {
                    return {
                        ...recipe,
                        ingredients: recipe.ingredients.map(i => i.ingredientId === ing.ingredientId ? ing : i)
                    }
                }))
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }

    const clearChecked = () => {
        setSentReq(true)
        post({
            url: '/shoppingList/delete/checked',
            token: user?.token,
        })
            .then((list: IShoppingListItemByRecipe[]) => {
                setShoppingListByRecipes(list)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }

    /* const toggleSelectedIngredient = (ingredient: IIngredinent) => {
        if (selectedIngredients.includes(ingredient)) {
            setSelectedIngredients(selectedIngredients.filter(item => item.id !== ingredient.id))
        } else {
            setSelectedIngredients([...selectedIngredients, ingredient])
        }
    } */

    const onAddIngredient = (ingredient: IIngredinent) => {
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
                setShoppingListByRecipes(newShoppingList)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title={t('Shopping list')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/my-space')} />
                <ScrollView style={s.container}>

                    {/* Choose mode */}
                    {/* <View style={s.modes}>
                        <Pressable
                            style={modeBy === 'recipes' && s.modeActiveWrapper}
                            onPress={() => setModeBy('recipes')}
                        >
                            <Text style={modeBy === 'recipes' && s.modeActiveText}>By recipes</Text>
                        </Pressable>
                        <Text>/</Text>
                        <Pressable
                            style={modeBy === 'total' && s.modeActiveWrapper}
                            onPress={() => setModeBy('total')}
                        >
                            <Text style={modeBy === 'total' && s.modeActiveText}>Total quantity</Text>
                        </Pressable>
                    </View> */}

                    {/* Shopping list */}
                    {/* {modeBy === 'recipes' && shoppingListByRecipes.map(recipe => ( */}
                    {shoppingListByRecipes.map(recipe => (
                    <View key={recipe.recipeId || 'general'} style={{ marginBottom: 10 }}>
                        <Text type='caption'>{recipe.recipeTitle || t('General')}</Text>
                        {recipe.ingredients.map((item: IIngredientForShoppingList) => (
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
                    ))}

                    {/* Adding ingredient */}
                    <Pressable onPress={() => !isSentReq && setShowAddIngredient(true)}>
                        <Text type='link'>{t('Add an ingredient')}</Text>
                    </Pressable>
    
                    { showAddIngredient && <AddIngredientModal
                        isVisible={showAddIngredient}
                        hideAndClear={() => setShowAddIngredient(false)}
                        onSubmit={onAddIngredient}
                    /> }

                </ScrollView>

                {/* Buttons */}
                <View style={[s.buttons, { width: Dimensions.get('window').width - 20}]}>
                    <Button disabled={isSentReq} style={{ flex: 1 }} size='large' text={t('Clear')} onPress={clearChecked} />
                    <Button disabled={isSentReq} style={{ flex: 1 }} size='large' text={t('Share')} onPress={() => console.log('Share')} />
                    <Button disabled={isSentReq} style={{ flex: 1 }} size='large' text={t('Copy')} onPress={() => console.log('Copy')} />
                </View>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        gap: 9,
        maxHeight: Dimensions.get('window').height - 220
    },
    /* modes: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    modeActiveWrapper: {
        backgroundColor: Colors.mainColor,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    modeActiveText: {
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
        color: Colors.white,
    }, */
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        marginEnd: 10,
        flexWrap: 'wrap',
    }
})