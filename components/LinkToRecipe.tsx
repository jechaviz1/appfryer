import { useCallback } from 'react'
import { Platform, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/base/BaseComponents'
import { theme } from '@/constants/Theme'

interface Props {
    id?: number
    title?: string
}

export default function LinkToRecipe({id, title}: Props) {
    const router = useRouter()

    const getVerticalOffset = useCallback(() => {
        let offset: number
        switch (Platform.OS) {
            case 'ios':
                offset = -7
                break
            case 'android':
                offset = -9
                break
            default:
                offset = -8
                break
        }
        return offset
    }, [])

    return (
        <Pressable
            onPress={() => router.push({
                pathname: `/(pages)/recipe/${id}` as '(pages)/recipe/[:id]',
                // params: {id},
            })}
            style={{ marginVertical: 0 }}
        >
            <Text type='link' style={[theme.bold, { paddingHorizontal: 2, marginVertical: getVerticalOffset() }]}> {title}</Text>
        </Pressable>
    )
}