import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/base/Text'
import { View } from "@/components/base/View"
import { Checkbox } from '@/components/base/Checkbox'

type ChoiceItemProps = {
    id: number,
    img: any,
    text: string,
    checked: boolean,
    quantity?: string,
    info?: boolean,
    onPress: () => void,
    style?: any,
}

export function ChoiceItem ({id, img, text, checked, quantity, info = false, onPress, style}: ChoiceItemProps) {
    const router = useRouter()

    return (
        <Pressable onPress={onPress}>
            <View style={[s.container, style]}>
                <Image source={img} style={s.image}/>
                <View style={{flex: 1}}>
                    <Text>{text}</Text>
                    {quantity && <Text type="link">{quantity}</Text>}
                </View>
                {info && <Pressable onPress={() => router.push({pathname: '/(pages)/ingredient', params: {id}})}>
                    <Image source={require('@/assets/icons/info-filled.png')} style={{width: 22, height: 22}}/>
                </Pressable>}
                <Checkbox checked={checked} onPress={onPress} style={s.checkbox} />
            </View>
        </Pressable>
    )
}

const s = StyleSheet.create({
    container: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: "#ccc",
        shadowOffset: {
            width: 10,
            height: 10,
        },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 10,
        borderRadius: 10,
    },
    image: {
        width: 26,
        height: 26,
    },
    checkbox: {
        width: 22,
        height: 22,
        alignSelf: 'flex-end',
    }
})