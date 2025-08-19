import { useCallback } from 'react'
import { Platform, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/base/BaseComponents'
import { theme } from '@/constants/Theme'

interface Props {
    id?: number
    fullname?: string
}

export default function LinkToProfile({id, fullname}: Props) {
    const router = useRouter()

    const getVerticalOffset = useCallback(() => {
            let offset: number
            switch (Platform.OS) {
                case 'ios':
                    offset = -8
                    break
                case 'android':
                    offset = -9.5
                    break
                default:
                    offset = -8
                    break
            }
            return offset
        }, [])

    return (
        <Pressable
            onPress={() => id && router.push({
                pathname: '/(pages)/profile',
                params: {userId: id}})
            }
            style={{ marginVertical: 0 }}
        >
            <Text type='link' style={[theme.bold, { paddingHorizontal: 2, marginVertical: getVerticalOffset() }]}> {fullname}</Text>
        </Pressable>
    )
}