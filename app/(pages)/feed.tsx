import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'

import { ModalTitle, ScrollView, View } from "@/components/base/BaseComponents"
import RecipeBrief from '@/components/RecipeBrief'
import { prepareGlobQueryToUrl, post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { theme } from '@/constants/Theme'
import IRecipe from '@/interfaces/Recipe'
import IFolder from '@/interfaces/Folder'
import { logError } from '@/services/utils'

interface FeedData {
    type?: string
    filterFolder?: number
    filterDiets?: string
    filterCategories?: string
    filterIngredientCategories?: string
    filterRating?: string
    filterPreparationTime?: string
    filterTitle?: string // ?
}

export default function RecipesFeed() {
    const { user, setUser } = useAuth()
    const router = useRouter()
    const globQuery = useGlobalSearchParams()

    const [title, setTitle] = useState<string>('')
    const [recipes, setRecipes] = useState<IRecipe[]>([])

    useEffect(() => {
        if (globQuery.title) {
            setTitle((globQuery.title && typeof globQuery.title === 'string' ? globQuery.title : globQuery.title[0]) || '')
        }

        const data = prepareGlobQueryToUrl(globQuery)
        post({ url: '/feed', data: Object.keys(data).length > 0 ? data : undefined, token: user?.token })
            .then((recipes) => setRecipes(recipes))
            .catch(e => console.error(e.response.data))

    }, [])

    const toggleFollowing = (userId: number, isFollowing: boolean) => {
        post({
            url: `/profile/${userId}/${isFollowing ? 'unfollow' : 'follow'}`,
            token: user?.token,
        })
            .then((curUser) => {
                setUser({...user, ...curUser})
                const updRecipes = recipes.map((recipe: IRecipe) => {
                    if (recipe.userId === userId) {
                        return {...recipe, userIsFollowing: !isFollowing}
                    }
                    return recipe
                })
                setRecipes(updRecipes)
            })
            .catch(logError)
    }

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title={title} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/my_space')} />
                <ScrollView style={{marginBottom: 180}}>
                    <View style={s.recipes}>
                        {recipes.map(recipe => (
                            <RecipeBrief
                                key={recipe.id}
                                recipe={recipe}
                                toggleFollowing={toggleFollowing}
                                onUpdateFolders={(folders: IFolder[]) => {
                                    const updRecipes = recipes.map((r: IRecipe) => r.id === recipe.id
                                        ? {...r, isSaved: true, folders}
                                        : r)
                                    setRecipes(updRecipes)
                                }}
                                onUnsave={() => {
                                    const updRecipes = recipes.map((r: IRecipe) => r.id === recipe.id
                                        ? {...r, folders: [], isSaved: false}
                                        : r)
                                    setRecipes(updRecipes)
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    recipes: {
        gap: 8,
        marginBottom: 60,
    },
})