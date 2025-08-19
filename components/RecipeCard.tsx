import { Image, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text, View } from '@/components/base/BaseComponents'
import { theme } from '@/constants/Theme'

export interface IRecipeCard {
    id: number
    image: string
    title: string
    profileName: string
}

export default function RecipeCard({recipe}: {recipe: IRecipeCard}) {
    const { t } = useTranslation()

    return (
        <View style={s.recipeCard}>
            <Link href={{
                pathname: `/(pages)/recipe/${recipe.id}` as '(pages)/recipe/[:id]',
                // params: { id: `${recipe.id}`},
            }}>
                <View>
                    <Image source={recipe.image ? { uri: recipe.image } : undefined} style={s.recipeCardImg} />
                    <Text style={theme.bold}>{recipe.title}</Text>
                    <Text>{t('By {{profileName}}', {profileName: recipe.profileName})}</Text>
                </View>
            </Link>
        </View>
    )
}

const s = StyleSheet.create({
    recipeCard: {
        marginRight: 12,
        maxWidth: 160,
    },
    recipeCardImg: {
        width: 160,
        height: 204,
        borderRadius: 14,
    },
})