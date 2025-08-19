import { Image, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'

import { Text } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { theme } from '@/constants/Theme'

export interface IRecipeOfMonth {
    id: number
    image: string
    title: string
    profileName: string
}

export default function RecipeOfMonth({recipe}: {recipe: IRecipeOfMonth}) {
    const { t } = useTranslation()
    const router = useRouter()

    return (
        <Pressable style={s.recipeOfMonth} onPress={() => router.push({
            pathname: `/(pages)/recipe/${recipe.id}` as '(pages)/recipe/[:id]',
            // params: { id: recipe.id },
        } )}>
            <Image source={recipe.image ? { uri: recipe.image } : undefined} style={s.recipeOfMonthImg} />
            <LinearGradient colors={['#00000000', '#000000b2']} style={s.recipeOfMonthGradient} />
            <Text style={[theme.bold, s.recipeOfMonthTitle]}>{recipe.title}</Text>
            <Text style={s.recipeOfMonthAuthor}>{t('By {{profileName}}', {profileName: recipe.profileName})}</Text>
        </Pressable>
    )
}

const s = StyleSheet.create({
    recipeOfMonth: {
        marginRight: 12,
        position: 'relative',
    },
    recipeOfMonthImg: {
        width: 205,
        height: 194,
        borderRadius: 14,
        zIndex: 2,
    },
    recipeOfMonthGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 205,
        height: 194,
        borderRadius: 14,
        zIndex: 4,
    },
    recipeOfMonthTitle: {
        position: 'absolute',
        bottom: 36,
        left: 15,
        marginRight: 15,
        color: Colors.white,
        zIndex: 6,
    },
    recipeOfMonthAuthor: {
        position: 'absolute',
        bottom: 11,
        left: 15,
        color: Colors.white,
        zIndex: 6,
    },
})