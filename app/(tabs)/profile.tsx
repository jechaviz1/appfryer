import { useCallback, useState } from 'react'
import { StyleSheet, ScrollView as RNScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from "expo-router"
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/contexts/authContext'
import { Text, View } from "@/components/base/BaseComponents"
import ProfileScreen from '@/components/ProfileScreen'
import { get, post } from '@/services/apiRequests'
import { theme, isLight, getBgColor } from '@/constants/Theme'
import IRecipe from '@/interfaces/Recipe'
import { logError } from '@/services/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '@/constants/Colors'
import Header from '@/components/Header'

export default function ProfileTabScreen() {
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { t } = useTranslation()

    const [showPersonalInfo, setShowPersonalInfo] = useState<boolean>(false)
    const [ownRecipes, setOwnRecipes] = useState<IRecipe[]>([])

    useFocusEffect(useCallback(() => {
        get({url: '/profile/me', token: user?.token})
            .then(userData => {
                setUser({...user, ...userData})
                AsyncStorage.setItem('user', JSON.stringify({...user, ...userData}))
            })
            .catch(logError)
        
        post({ url: '/feed', data: { type: 'own' }, token: user?.token })
            .then((recipes: IRecipe[]) => {
                setOwnRecipes(recipes.filter(r => r.status !== 0))
            })
            .catch(logError)
    }, []))

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            {/* Dark Header */}
            <Header
                title={t('Profile')}
                onBack={() => router.back()}
                rightIconSource={require('@/assets/icons/dots.png')}
                onRightPress={() => router.push('/(settings)/settings')}
            />
            <RNScrollView style={s.container}>
                <ProfileScreen page='me' person={user} initRecipes={ownRecipes}/>
            </RNScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        backgroundColor: getBgColor()
    },
})