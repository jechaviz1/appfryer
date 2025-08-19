import { useEffect, useState } from "react"
import { Image, Pressable, StyleSheet } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from "expo-router"
import { useTranslation } from 'react-i18next'

import { Text, View } from '@/components/base/BaseComponents'
import { Colors } from "@/constants/Colors"
import { theme } from '@/constants/Theme'
import { get } from '@/services/apiRequests'
import { IDietBrief } from '@/interfaces/Diet'
import { useAuth } from '@/contexts/authContext'
import { logError } from '@/services/utils'

function DietCard({ diet }: { diet: IDietBrief }) {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <View style={s.dietCard}>
            <Pressable onPress={() => router.push({ pathname: '/(pages)/diet', params: { id: diet.id } })}>
                {/* TODO: use the default image if the diet doesn't have a photo */}
                <Image source={{ uri: diet.photo ?? 'https://picsum.photos/600' }} style={s.dietCardImg} />
                <LinearGradient
                    colors={['#00000000', '#000000b2']}
                    style={s.dietCardGradient}
                />
                <Text type="caption" style={[theme.bold, s.dietCardTitle]}>{t(diet.title)}</Text>
            </Pressable>
            
        </View>
    )
}

export default function Diets({ style }: { style?: any }) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [diets, setDiets] = useState<IDietBrief[]>([])

    useEffect(() => {
        get({url: '/meta/diets', token: user?.token})
            .then(setDiets)
            .catch(logError)
    }, [])

    return (
        <View style={[style, s.container]}>
            <Text type="caption" style={{ marginBottom: 12 }}>{t('Diets')}</Text>

            {diets.map((diet, index) => <DietCard key={index} diet={diet} />)}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginTop: 24,
        gap: 14,
    },
    dietCard: {
        width: '100%',
        height: 141,
        borderRadius: 14,
    },
    dietCardImg: {
        width: '100%',
        height: 141,
        borderRadius: 14,
        resizeMode: 'cover',
    },
    dietCardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 14,
    },
    dietCardTitle: {
        position: 'absolute',
        bottom: 16,
        left: 15,
        paddingRight: 15,
        color: Colors.white,
        zIndex: 6,
    },
})