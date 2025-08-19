import { useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useGlobalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { ChoiceItem, Text, View } from "@/components/base/BaseComponents"
import ImageLibrary from '@/components/ImageLibrary'
import { theme, isLight } from '@/constants/Theme'
import IRecipe from '@/interfaces/Recipe'
import { calculateForPortions } from '@/services/calculates'

interface Props {
    recipe: IRecipe | undefined
    onBack: () => void
}

export default function CookingIngredientsTab ({ recipe, onBack }: Props) {
    const { t } = useTranslation()
    const globQuery = useGlobalSearchParams()

    const [checkedIngredients, setCheckedIngredients] = useState<number[]>([])

    const toggleIngredient = (itemId: number) => {
        setCheckedIngredients(checkedIngredients.includes(itemId)
            ? checkedIngredients.filter(id => id !== itemId)
            : [...checkedIngredients, itemId]
        )
    }

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={{ marginTop: 40 }}>
            <Pressable onPress={onBack}>
                <Image source={isLight() ? backIconLight : backIconDark} style={s.simpleBackButton} />
            </Pressable>
            <Text type="subtitle" style={[theme.centerAlign, {marginTop: 100, marginBottom: 65}]}>{t('Get the ingredients')}</Text>
            <Text type='caption'>{t('Ingredients')}</Text>

            {recipe && recipe.ingredients.map((ingredient, index) => (
                <ChoiceItem
                    key={index}
                    id={ingredient.id}
                    img={ImageLibrary.icons[ingredient.category.icon as keyof typeof ImageLibrary.icons]}
                    text={ingredient.ingredientTitle!}
                    checked={checkedIngredients.includes(ingredient.id)}
                    quantity={calculateForPortions(ingredient, recipe.portions, Number(globQuery.portions))}
                    onPress={() => toggleIngredient(ingredient.id)}
                />
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    simpleBackButton: {
        width: 16,
        height: 16,
    },
})