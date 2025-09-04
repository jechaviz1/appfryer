import { Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { isLight } from '@/constants/Theme'

export interface StoryProps {
    id: number
    image: string
    name: string
    viewed?: boolean
    link: string
}

export default function Story ({ image, name, viewed = false }: StoryProps) {
    const borderColor = isLight() ? Colors.white : Colors.black
    const gradientCircle = viewed ? require('@/assets/images/grey-circle.png') : require('@/assets/images/gradient-circle.png')
    const gradientColors = viewed ? Colors.storyGradientViewed : Colors.storyGradient

    return (
        <View style={s.story}>
            <LinearGradient colors={gradientColors} style={s.circle}>
                {image && image.trim() !== '' ? (
                    <Image source={{uri: image}} style={[s.profileImg, {borderColor}]}/>
                ) : (
                    <View style={[s.profileImg, {borderColor}, s.placeholderProfileImg]} />
                )}
            </LinearGradient>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
        </View>
    )
}

const s = StyleSheet.create({
    story: {
        alignItems: 'center',
        marginLeft: 6,
        marginRight: 6,
        position: 'relative',
    },
    circle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
    },
    placeholderProfileImg: {
        backgroundColor: '#E0E0E0',
    },
    name: {
        width: 56,
        textAlign: 'center',
    },
})