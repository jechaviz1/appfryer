import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ChoiceItem, Text, View } from '@/components/base/BaseComponents'
import IIngredinent from '@/interfaces/Ingredient'
import { IShoppingListItemByRecipe } from '@/interfaces/ShoppingList'
import { Colors } from '@/constants/Colors'
import { theme, paddings } from '@/constants/Theme'
import { calculateForPortions } from '@/services/calculates'
import ImageLibrary from './ImageLibrary'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'

interface Props {
    ingredients: IIngredinent[]
    portionsInRecipe: number
    actualPortions: number
    setActualPortions: (arg0: number) => void
}

export default function Ingredients({ ingredients, portionsInRecipe, actualPortions, setActualPortions }: Props) {
    const { user } = useAuth()
    const { t } = useTranslation()
    const { width } = useWindowDimensions()

    const [selectedIngredients, setSelectedIngredients] = useState<IIngredinent[]>([])
    const [isSentReq, setSentReq] = useState<boolean>(false)

    const addToShoppingList = useCallback(() => {
        setSentReq(true)
        post({
            url: '/shoppingList/add/recipeIngredients',
            data: {
                ids: selectedIngredients.map(item => item.id),
                portions: actualPortions,
            },
            token: user?.token
        })
            .then((list: IShoppingListItemByRecipe[]) => {
                setSelectedIngredients([])
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [selectedIngredients, actualPortions])

    const increasePortions = useCallback(() => {
        if (actualPortions === 20) {
            return
        }
        setActualPortions(actualPortions + 1)
    }, [actualPortions])
    const decreasePortions = useCallback(() => {
        if (actualPortions === 1) {
            return
        }
        setActualPortions(actualPortions - 1)
    }, [actualPortions])

    const toggleItem = useCallback((ingredient: IIngredinent) => {
        selectedIngredients.includes(ingredient)
            ? setSelectedIngredients(prev => prev.filter(item => item !== ingredient))
            : setSelectedIngredients(prev => [...prev, ingredient])
    }, [selectedIngredients])

    return (
        <View style={[s.container, { width: width - paddings * 2 }]}>
            <View style={s.portionsWrapper}>
                <Pressable style={s.portionsSign} onPress={decreasePortions}>
                    <Text style={s.portionsSignText}>-</Text>
                </Pressable>
                <Text style={[theme.bold, s.portionsText]}>{t('{{actualPortions}} portions', {actualPortions})}</Text>
                <Pressable style={s.portionsSign} onPress={increasePortions}>
                    <Text style={s.portionsSignText}>+</Text>
                </Pressable>
            </View>
            <Text type="caption" style={{ marginBottom: 12 }}>{t('Pantry Ingredients')}</Text>

            {ingredients?.map((ingredient) => {
                return <ChoiceItem
                    id={ingredient.ingredientId}
                    key={ingredient.id}
                    img={ImageLibrary.icons[ingredient.category.icon as keyof typeof ImageLibrary.icons]}
                    text={ingredient.ingredientTitle!}
                    checked={selectedIngredients.includes(ingredient)}
                    quantity={calculateForPortions(ingredient, portionsInRecipe, actualPortions)}
                    info
                    onPress={() => toggleItem(ingredient)}
                />
            })}

            { selectedIngredients.length > 0
                ?   <Pressable disabled={isSentReq} onPress={addToShoppingList} >
                        <Text style={theme.bold} type="link">{t('Add to shopping list')}</Text>
                    </Pressable>
                : null}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginBottom: 24,
        position: 'relative',
    },
    portionsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 18,
    },
    portionsSign: {
        backgroundColor: Colors.mainColorLight,
        width: 24,
        height: 24,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    portionsSignText: {
        color: Colors.mainColor,
        fontSize: 18,
    },
    portionsText: {
        color: Colors.mainColor,
    },
})