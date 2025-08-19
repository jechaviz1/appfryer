import { Pressable } from 'react-native'

import { Text, View } from '@/components/base/BaseComponents'
import { theme } from '@/constants/Theme'
import IRecipe from '@/interfaces/Recipe'

interface Props {
    recipe: IRecipe
}

export default function Badges({recipe}: Props) {
    if (!recipe.badges || recipe.badges.length === 0) {
        return null
    }

    return (
        <View style={theme.badges}>
            {recipe.badges.map(badge => (
                <Pressable
                    key={badge}
                    style={theme.recipeBadge}
                    // onPress={() => router.push({
                    //     pathname: '/(pages)/feed',
                    //     params: { filterCategories: category.id, title: category.title } })}
                >
                    <Text style={theme.recipeBadgeText}>{badge}</Text>
                </Pressable>
            ))}
        </View>
    )
}