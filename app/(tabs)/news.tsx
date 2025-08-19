import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { IngredientButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Notifications from '@/components/modals/Notifications'
import Stories from '@/components/Stories'
import Search from '@/components/Search'
import RecipeBrief from '@/components/RecipeBrief'
import { theme, isLight } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { useAppState } from '@/contexts/appStateContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IPrefItem from "@/interfaces/PrefItem"
import IRecipe from '@/interfaces/Recipe'
import IFolder from '@/interfaces/Folder'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'

const storiesFake = [
    { id: 1, image: 'https://picsum.photos/200', name: 'Shiovan', link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 2, image: 'https://picsum.photos/200', name: 'Marcia Hernandez', link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 3, image: 'https://picsum.photos/200', name: 'Greg Egan', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
    { id: 4, image: 'https://picsum.photos/200', name: 'Emma', viewed: true, link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 5, image: 'https://picsum.photos/200', name: 'Jaime', viewed: true, link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 6, image: 'https://picsum.photos/200', name: 'Miguel', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
]

export default function NewsScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user, setUser } = useAuth()
    const { searchFilters, setSearchFilters } = useSearchFilters()

    const [tabs] = useState([
        {title: 'New', icon: require('@/assets/icons/lightning.png'), type: 'new'},
        {title: 'Trend', icon: require('@/assets/icons/fire.png'), type: 'trend'},
        {title: 'Seasonal', icon: require('@/assets/icons/leaf.png'), type: 'seasonal'},
    ])

    const [activetab, setActiveTab] = useState<number>(0)
    const [recipes, setRecipes] = useState<IRecipe[]>([])

    useFocusEffect(useCallback(() => {
        if (!user) {
            return
        }

        post({url: '/feed', token: user?.token})
            .then(setRecipes)
            .catch(e => logError(e, 'Failed to get feed'))
    }, []))

    const onChangeTab = useCallback((index: number) => {
        setActiveTab(index)
        setSearchFilters({
            ...searchFilters,
            home: {
                ...searchFilters?.home,
                ingredients: [],
                type: tabs[index].type
            }
        })
        post({
            url: '/feed',
            data: { type: tabs[index].type },
            token: user?.token
        })
            .then(setRecipes)
            .catch(e => logError(e, 'Failed to get feed'))
    }, [searchFilters?.home])

    const removeIngredient = useCallback((index: number) => {
        if (!searchFilters?.home.ingredients) {
            return
        }
        setSearchFilters({
            ...searchFilters,
            home: {
                ...searchFilters?.home,
                ingredients: searchFilters.home.ingredients.filter((item: { id: number }) => item.id !== index)
            }
        })
    }, [searchFilters?.home?.ingredients])

    const toggleFollowing = useCallback((userId: number, isFollowing: boolean) => {
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
    }, [recipes])

    const categoryTextColor = isLight() ? Colors.grey : Colors.lightGrey

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={[theme.titleContainer, { marginBottom: 20 }]}>
                    <Text type="subtitle">{t('News')}</Text>
                </View>
                <View style={s.topSide}>
                    {/* <Stories storiesArray={storiesFake} /> */}

                    <Search page="news" onSearch={recipes => setRecipes(recipes)}/>
                    {searchFilters?.news?.ingredients?.length > 0 && (<View style={s.selectedIngredients}>
                        { searchFilters?.news.ingredients.map((item: IPrefItem) => (
                            <IngredientButton
                                key={item.id}
                                ingredient={item}
                                needRemoveIcon={true}
                                onPress={() => removeIngredient(item.id)}
                            />
                        ))}
                    </View> )}

                    <View style={theme.catTabs}>
                        {tabs.map((tab, index) => (
                            <Pressable key={tab.type} style={theme.catTabWrapper} onPress={() => onChangeTab(index)}>
                                <View style={theme.catTab}>
                                    <Image source={tab.icon} style={theme.catTabImg} />
                                    <Text style={[{color: categoryTextColor}, activetab === index ? theme.catTabTextActive : {}]}>{t(tab.title)}</Text>
                                </View>
                                <View style={[theme.catTabBottomLine, activetab === index ? theme.catTabActive : {}]}/>
                            </Pressable>
                            
                        ))}
                    </View>

                    <View style={s.recipes}>
                        {recipes.map(recipe => <RecipeBrief
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
                        />)}
                    </View>

                </View>
                
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    topSide: {
        gap: 20,
    },
    selectedIngredients: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        columnGap: 16,
        rowGap: 8,
    },
    recipes: {
        gap: 8,
        marginBottom: 60,
    },
})
