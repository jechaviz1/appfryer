import { useEffect, useState } from 'react'
import { useGlobalSearchParams } from "expo-router"

import { useAuth } from '@/contexts/authContext'
import { BackButton, ScrollView, View } from "@/components/base/BaseComponents"
import { theme } from '@/constants/Theme'
import ProfileScreen from '@/components/ProfileScreen'
import { get, post } from '@/services/apiRequests'
import IRecipe from '@/interfaces/Recipe'
import { logError } from '@/services/utils'

export default function ProfilePageScreen() {
    const { user } = useAuth()
    const { userId } = useGlobalSearchParams()

    const [profile, setProfile] = useState({})
    const [recipes, setRecipes] = useState<IRecipe[]>([])

    useEffect(() => {
        get({url: `/profile/${userId}`, token: user?.token})
            .then(profileData => setProfile(profileData))
            .catch(logError)
        
        post({ url: '/feed', data: { filterUserId: userId }, token: user?.token })
            .then((recipesData: IRecipe[]) => {
                setRecipes(recipesData.filter(r => r.status !== 0))
            })
            .catch(logError)
    }, [])

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={{ minHeight: 60 }}>
                    <BackButton />
                </View>
                <ProfileScreen page='otherProfile' person={profile} initRecipes={recipes}/>
            </ScrollView>
        </View>
    )
}
