import { useCallback, useState } from 'react'
import { Image, Pressable } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from "expo-router"
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/contexts/authContext'
import { ScrollView, Text, View } from "@/components/base/BaseComponents"
import PersonalInfo from '@/components/modals/PersonalInfo'
import ProfileScreen from '@/components/ProfileScreen'
import { get, post } from '@/services/apiRequests'
import { theme, isLight } from '@/constants/Theme'
import IRecipe from '@/interfaces/Recipe'
import { logError } from '@/services/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

    const editIconLight = require('@/assets/icons/edit.png')
    const editIconDark = require('@/assets/icons/edit-light.png')
    const gearIconLight = require('@/assets/icons/gear.png')
    const gearIconDark = require('@/assets/icons/gear-light.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <PersonalInfo isVisible={showPersonalInfo} onHide={() => setShowPersonalInfo(false)} />
                <View style={[theme.titleContainer, { gap: 20 }]}>
                    <Text style={{ flex: 1 }} type='subtitle'>{t('Your profile')}</Text>
                    <Pressable onPress={() => setShowPersonalInfo(true)}>
                        <Image source={isLight() ? editIconLight : editIconDark} style={{ width: 23, height: 23 }} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/(settings)/settings')}>
                        <Image source={isLight() ? gearIconLight : gearIconDark} style={{ width: 23, height: 23 }} />
                    </Pressable>
                </View>
                <ProfileScreen page='me' person={user} initRecipes={ownRecipes}/>
            </ScrollView>
        </View>
    )
}
