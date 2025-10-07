import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet, FlatList, Dimensions } from "react-native"
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import Modal from "react-native-modal"

import { ScrollView, Text, View } from "@/components/base/BaseComponents"
import ImageLibrary from '@/components/ImageLibrary'
import AddIngredientModal from '@/components/modals/AddIngredientModal'
import { IRecipeCard } from '@/components/RecipeCard'
import Folders from '@/components/modals/Folders'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { theme, getBgColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { MediaType } from '@/interfaces/Media'
import IIngredinent from '@/interfaces/Ingredient'
import IRecipe from '@/interfaces/Recipe'
import { logError } from '@/services/utils'
import Header from '@/components/Header'
import IFolder from '@/interfaces/Folder'
import Constants from 'expo-constants'

interface IInterest {
    id?: number
    title: string
    checked: boolean
}

interface IExtendedRecipeCard extends IRecipeCard {
    ingredientsCount?: number
    avgRating?: number
}

interface Props {
    isVisible: boolean
    onHide: () => void
}

export default function RecipeLists({ isVisible, onHide }: Props) {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()

    const [showFolders, setShowFolders] = useState(false)
    const [showAddIngredient, setShowAddIngredient] = useState(false)
    const [interests, setInterests] = useState<IInterest[]>([])
    const [savedRecipes, setSavedRecipes] = useState<IExtendedRecipeCard[]>([])
    const [disableSaveAction, setDisableSaveAction] = useState<boolean>(false)

    const fetchInterests = useCallback(async () => {
        const prefs = await AsyncStorage.getItem('preferences')
        if (prefs) {
            const prefsTmp = JSON.parse(prefs)
            const interestsTmp = prefsTmp.find((p: any) => p.name === 'interests')
            if (interestsTmp) {
                return setInterests(
                    [{ title: 'All', checked: true }]
                        .concat(interestsTmp.items.map((i: any) => ({ id: i.id, title: i.title, checked: false })))
                )
            }
        }

        const fetchedInterests: IInterest[] = await get({ url: '/meta/interests', token: user?.token })
        setInterests(
            [{ title: 'All', checked: true }]
                .concat(fetchedInterests.map((i) => ({ id: i.id, title: i.title, checked: false })))
        )
    }, [])

    const fetchSavedRecipes = useCallback(async () => {
        // TODO: get saved recipes firstly from AsyncStorage and then from the server
        const recipes: IRecipe[] = await post({ url: '/feed', data: { type: 'saved' }, token: user?.token })

        const savedRecipes: IExtendedRecipeCard[] = recipes.map((r: IRecipe) => {
            const img = r.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname,
                ingredientsCount: r.ingredients?.length || 0,
                avgRating: r.avgRating || 0
            }
        })

        setSavedRecipes(savedRecipes)
    }, [])


    useFocusEffect(
        useCallback(() => {
            fetchInterests()
            fetchSavedRecipes()
        }, [])
    )

    const toggleInterest = useCallback((i: IInterest) => {
        if (i.title === 'All') {
            const newInterests = interests.map((item: IInterest) => {
                return { ...item, checked: item.title === 'All' }
            })
            setInterests(newInterests)
            return
        }
        const index = interests.findIndex((item: IInterest) => item.title === i.title)
        if (index === -1) {
            return
        }
        const newInterests = [...interests]
        newInterests[0].checked = false
        newInterests[index].checked = !newInterests[index].checked
        setInterests(newInterests)
    }, [interests])

    const onAddIngredient = useCallback((ingredient: IIngredinent) => {
        post({
            url: '/shoppingList/add/ingredient',
            token: user?.token,
            data: {
                ingredientId: ingredient.id,
                measureId: ingredient.measureId,
                cnt: ingredient.cnt,
            }
        })
            .then(newShoppingList => {
            })
            .catch(logError);
    }, [])

    const toggleSaveRecipe = useCallback((recipeId: number) => {
        if (disableSaveAction) {
            return
        }
        setDisableSaveAction(true)
        post({
            url: `/recipe/${recipeId}/unsave`,
            token: user?.token
        })
            .then(() => {
                // Remove the recipe from the saved recipes list
                setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
                setDisableSaveAction(false)
            })
            .catch(e => {
                console.error(e.response?.data)
                logError(e)
                setDisableSaveAction(false)
            })
    }, [disableSaveAction])

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onHide}
            style={[theme.modal]}
            coverScreen={true}
            hasBackdrop={false}
        >
            <View style={s.container}>
                { showFolders && <Folders
                    isVisible={showFolders}
                    onHide={() => setShowFolders(false)}
                /> }
                
                {/* Dark Header */}
                <Header
                    title={t('Saved recipes')}
                    onBack={onHide}
                    rightIconSource={require('@/assets/icons/add.png')}
                    onRightPress={() => setShowFolders(true)}
                />

                {/* Category Tabs */}
                <View style={s.categoriesSection}>
                    <FlatList
                        data={interests}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Pressable 
                                style={[s.categoryItem, item.checked && s.categoryItemSelected]}
                                onPress={() => toggleInterest(item)}
                            >
                                <Text style={[s.categoryText, item.checked && s.categoryTextSelected]}>
                                    {item.title}
                                </Text>
                            </Pressable>
                        )}
                        keyExtractor={(item) => item.title}
                        contentContainerStyle={s.categoriesList}
                    />
                </View>

                {/* Main Content */}
                <ScrollView style={s.mainContent} showsVerticalScrollIndicator={false}>
                    {/* Saved recipes */}
                    <View style={s.section}>
                        <View style={s.recipesContainer}>
                            {savedRecipes.map(recipe => (
                                <Pressable 
                                    key={recipe.id} 
                                    style={s.recipeCard}
                                    onPress={() => router.push({
                                        pathname: `/(pages)/recipe/${recipe.id}` as "(pages)/recipe/[:id]"
                                    })}
                                >
                                    <View style={s.recipeImageContainer}>
                                        <Image 
                                            source={recipe.image ? { uri: recipe.image } : ImageLibrary.recipe}
                                            style={s.recipeImage}
                                        />
                                        <View style={s.playButton}>
                                            <Image source={require('@/assets/icons/video-play.png')} style={s.playIcon} />
                                        </View>
                                    </View>
                                    <View style={s.recipeContent}>
                                        <View style={s.recipeHeader}>
                                            <Text style={s.recipeTitle}>{recipe.title}</Text>
                                            <Pressable 
                                                style={s.bookmarkBtn}
                                                onPress={() => !disableSaveAction && toggleSaveRecipe(recipe.id)}
                                                disabled={disableSaveAction}
                                            >
                                                <Image 
                                                    source={require('@/assets/icons/ribbon-filled.png')} 
                                                    style={[
                                                        s.bookmarkBtnIcon,
                                                        disableSaveAction && { opacity: 0.5 }
                                                    ]} 
                                                />
                                            </Pressable>
                                        </View>
                                        <Text style={s.ingredientsText}>
                                            {recipe.ingredientsCount} {recipe.ingredientsCount === 1 ? t('ingredient') : t('ingredients')}
                                        </Text>
                                        <View style={s.bottomRow}>
                                            <View style={s.authorContainer}>
                                                <Image source={require('@/assets/icons/person-round.png')} style={s.authorIcon} />
                                                <Text style={s.authorText}>{recipe.profileName}</Text>
                                            </View>
                                            <View style={s.ratingContainer}>
                                                <Text style={s.ratingText}>{recipe.avgRating?.toFixed(1) || '0.0'}</Text>
                                                <Text style={s.starIcon}>⭐</Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {showAddIngredient && <AddIngredientModal
                        isVisible={showAddIngredient}
                        hideAndClear={() => setShowAddIngredient(false)}
                        onSubmit={onAddIngredient}
                    /> }

                    <View style={{ marginTop: 80 }} />
                </ScrollView>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: Dimensions.get('window').height - Constants.statusBarHeight - 74,
    },
    header: {
        backgroundColor: '#4F4240',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        height: 54
    },
    backButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        width: 13,
        height: 23,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIcon: {
        width: 30,
        height: 30,
    },
    // Categories Section - Same as Explore page
    categoriesSection: {
        marginVertical: 23,
        backgroundColor: getBgColor(),
    },
    categoriesList: {
        gap: 10,
        paddingHorizontal: 24,
    },
    categoryItem: {
        color: '#6C7278',
        backgroundColor: Colors.white,
        alignItems: 'center',
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 6.5,
        minWidth: 67,
        borderColor: '#EFF0F6',
        borderWidth: 1,
    },
    categoryItemSelected: {
        backgroundColor: '#F6ECE2',
        borderColor: Colors.mainColor,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 13,
        color: '#6C7278',
        fontFamily: 'Poppins',
        textAlign: 'center',
        lineHeight: 18,
    },
    categoryTextSelected: {
        color: Colors.mainColor,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: getBgColor(),
    },
    section: {
        backgroundColor: getBgColor(),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
    },
    seeAllText: {
        color: '#C79F7B',
        fontSize: 14,
        fontWeight: '600',
    },
    recipesContainer: {
        gap: 14,
        backgroundColor: getBgColor(),
    },
    recipeCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 3,
        flexDirection: 'row',
    },
    recipeImageContainer: {
        marginRight: 16,
        position: 'relative',
    },
    recipeImage: {
        width: 63,
        height: 79,
        backgroundColor: '#F5F5F5',
        borderRadius: 5,
        resizeMode: 'cover',
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: -12 }, { translateY: -12 }],
        backgroundColor: 'transparent',
    },
    playIcon: {
        width: 24,
        height: 24,
    },
    recipeContent: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    recipeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    recipeTitle: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
        flex: 1,
        marginRight: 10,
    },
    ingredientsText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 16,
        color: '#C28040',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorIcon: {
        width: 14,
        height: 14,
        marginRight: 6,
        tintColor: '#8D8D8D',
    },
    authorText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 17,
        color: '#8D8D8D',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'right',
        color: '#1B1A1D',
        marginRight: 4,
    },
    starIcon: {
        fontSize: 13,
        color: '#FFD700',
    },
    bookmarkBtn: {
        flexDirection: 'row',
        padding: 6,
        justifyContent: 'flex-end',
    },
    bookmarkBtnIcon: {
        width: 12,
        height: 15,
        tintColor: '#C79F7B',
    },
    horizontalScroll: {
        marginLeft: -20,
        paddingLeft: 20,
    },
    shoppingListContainer: {
        marginBottom: 15,
    },
    addIngredientButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    addIngredientText: {
        color: '#C79F7B',
        fontSize: 14,
        fontWeight: '500',
    },
})