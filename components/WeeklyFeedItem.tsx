import { Image, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

import { Text, View } from '@/components/base/BaseComponents'
import { isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'

export interface IWeeklyFeed {
    id: number
    image: string
    title: string
    type: string
    rating: number | null
    time: number
}

export default function WeeklyFeedItem({recipe}: {recipe: IWeeklyFeed}) {
    return (
        <View style={s.recipeCard}>
            <Link href={{
                pathname: `/(pages)/recipe/${recipe.id}` as '(pages)/recipe/[:id]',
                // params: { id: `${recipe.id}`},
            }}>
                <View>
                    <Image source={{ uri: recipe.image }} style={s.recipeCardImg} />
                    <View style={s.recipeType}>
                        <Text style={s.recipeTypeText}>{recipe.type}</Text>
                    </View>
                    <Text>{recipe.title}</Text>
                    <View style={s.detailsContainer}>
                        <Image source={require('@/assets/icons/clock.png')} style={s.detailIcon}/>
                        <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{recipe.time} mn</Text>
                        
                        {recipe.rating && <Image source={require('@/assets/icons/star.png')} style={s.detailIcon}/>}
                        {recipe.rating && <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{recipe.rating}</Text>}
                    </View>
                </View>
            </Link>
        </View>
    )
}

const s = StyleSheet.create({
    recipeCard: {
        marginRight: 12,
        position: 'relative',
        maxWidth: 166,
    },
    recipeCardImg: {
        width: 166,
        height: 170,
        borderRadius: 14,
    },
    recipeType: {
        position: 'absolute',
        top: 8,
        right: 9,
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 10,
        backgroundColor: Colors.disabledButton,
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