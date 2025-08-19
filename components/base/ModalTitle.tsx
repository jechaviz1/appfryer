import { Image, Pressable } from 'react-native'
import { Text } from '@/components/base/Text'
import { View } from '@/components/base/View'
import { theme } from '@/constants/Theme'
import { isLight } from '@/constants/Theme'

export function ModalTitle({ title, onHide }: { title: string, onHide: () => void }) {
    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.modalTopbarWrap}>
            <Pressable onPress={() => onHide()} style={theme.modalTopbarInner} >
                <Image
                    source={isLight() ? backIconLight : backIconDark}
                    style={{ width: 16, height: 16 }}
                />
                <Text type="subtitle">{title}</Text>
            </Pressable>
        </View>
    )
}