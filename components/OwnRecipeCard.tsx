import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text, View } from '@/components/base/BaseComponents'
import { isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { timeFromMinutes } from '@/services/datetime'
import IRecipe, { RecipeStatus } from '@/interfaces/Recipe'
import IMedia, { MediaType } from '@/interfaces/Media'

interface Props {
    recipe: IRecipe
    onHide?: () => void
}

export default function OwnRecipeCard({recipe, onHide}: Props) {
    const router = useRouter()
    const { t } = useTranslation()
    const [titleImageUrl, setTitleImageUrl] = useState<string>('')

    useEffect(() => {
        if (recipe && recipe.medias.length > 0) {
            const imageMedia: IMedia | undefined = recipe.medias.find(media => media.type == MediaType.IMAGE)
            imageMedia && setTitleImageUrl(imageMedia.urlThumb ?? imageMedia.url)
        }
    }, [])

    const onPress = useCallback(() => {
        if (onHide) {
            onHide()
        }

        if (recipe.status === RecipeStatus.DRAFT) {
            return router.push({
                pathname: '/(create)/new-recipe',
                params: { id: recipe.id }
            })
        }
        router.push({
            pathname: `/(pages)/recipe/${recipe.id}` as '(pages)/recipe/[:id]',
            // params: { id: recipe.id },
        })
    }, [])

    return (
        <View style={s.recipeCard}>
            <Pressable onPress={onPress}>
                <View>
                    {titleImageUrl
                        ? <Image source={{ uri: titleImageUrl }} style={s.recipeCardImg} />
                        : <View style={s.recipeCardImg} />
                    }
                    {recipe.status === RecipeStatus.DRAFT && (<View style={[s.recipeMark, s.recipeDraft]}>
                        <Text style={s.recipeTypeText}>{t('Draft')}</Text>
                    </View> )}
                    <View style={[s.recipeMark, s.recipeReactions]}>
                        <Image source={require('@/assets/icons/liked.png')} style={s.interactImg} />
                        <Text style={[s.recipeTypeText, {marginRight: 4}]}>{recipe.cntLikes}</Text>
                        <Image source={require('@/assets/icons/comment-white.png')} style={s.interactImg} />
                        <Text style={s.recipeTypeText}>{recipe.cntComments}</Text>
                    </View>
                    <Text>{recipe.title}</Text>
                    <View style={s.detailsContainer}>
                        <Image source={require('@/assets/icons/clock.png')} style={s.detailIcon}/>
                        <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{timeFromMinutes(recipe.timeCooking)}</Text>
                        
                        {recipe.avgRating && <Image source={require('@/assets/icons/star.png')} style={s.detailIcon}/>}
                        {recipe.avgRating && <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{recipe.avgRating}</Text>}
                    </View>
                </View>
            </Pressable>
        </View>
    )
}

const s = StyleSheet.create({
    recipeCard: {
        position: 'relative',
        maxWidth: '48%',
        minWidth: '47%',
    },
    recipeCardImg: {
        minWidth: 150,
        aspectRatio: 1,
        borderRadius: 14,
    },
    recipeMark: {
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 8,
        backgroundColor: Colors.disabledButton,
    },
    recipeDraft: {
        position: 'absolute',
        top: 8,
        left: 9,
    },
    interactImg: {
        width: 16,
        height: 16,
    },
    recipeReactions: {
        position: 'absolute',
        top: 8,
        right: 9,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 2,
    },
    recipeTypeText: {
        color: Colors.white,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    detailIcon: {
        width: 14,
        height: 14,
    },
    detailText: {
        fontSize: 13,
        marginEnd: 8,
    },
})