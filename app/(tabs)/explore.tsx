import { useCallback, useState, useEffect } from 'react'
import { Image, Pressable, StyleSheet, FlatList, Alert, Dimensions } from "react-native"
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

import { IngredientButton, ScrollView, Text, View, TextInput } from "@/components/base/BaseComponents"
import Search from "@/components/Search"
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import Categories from '@/components/Categories'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { theme, isLight, getBgColor } from '@/constants/Theme'
import { Colors } from "@/constants/Colors"
import IPrefItem from '@/interfaces/PrefItem'
import IRecipe from '@/interfaces/Recipe'
import { MediaType} from '@/interfaces/Media'

const window = Dimensions.get('window')

const seasonalProdsFake: IPrefItem[] = [
    {
        id: 5,
        icon: 'melons',
        title: 'Melon',
    },
    {
        id: 6,
        icon: 'eggplant',
        title: 'Eggplant',
    },
    {
        id: 7,
        icon: 'parsley',
        title: 'Parsley',
    },
]



export default function SearchScreen() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useTranslation()
    
    const { searchFilters, setSearchFilters } = useSearchFilters()
    const [fridgeProds, setFridgeProds] = useState<IPrefItem[]>([])
    const [seasonalProds, setSeasonalProds] = useState<IPrefItem[]>([])
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [recipesForYou, setRecipesForYou] = useState<IRecipeCard[]>([])
    const [recipesOfMonth, setRecipesOfMonth] = useState<IRecipeCard[]>([])
    
    
    // Bookmark state management
    const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<number>>(new Set())
    const [disableBookmarkAction, setDisableBookmarkAction] = useState<boolean>(false)

    const modifyRecipesForCards = useCallback((recipes: IRecipe[]) => {
        return recipes.map((r: IRecipe) => {
            const img = r.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname,
                cntLikes: r.cntLikes,
                cntComments: r.cntComments,
            }
        })
    }, [])

    const fetchRecipes = useCallback((type: string, setRecipes: (recipes: IRecipeCard[]) => void) => {
        post({
            url: '/feed',
            data: { type },
            token: user?.token
        })
            .then((recipes: IRecipe[]) => {
                setRecipes(modifyRecipesForCards(recipes))
                
                // Update bookmark state for fetched recipes
                recipes.forEach((recipe: IRecipe) => {
                    if (recipe.isSaved) {
                        setBookmarkedRecipes(prev => new Set(prev).add(recipe.id))
                    }
                })
            })
            .catch(logError)
    }, [])

    // Toggle bookmark functionality
    const toggleBookmark = useCallback((recipeId: number) => {
        if (disableBookmarkAction) {
            return
        }

        const isCurrentlyBookmarked = bookmarkedRecipes.has(recipeId)
        const url = `/recipe/${recipeId}/${isCurrentlyBookmarked ? 'unsave' : 'save'}`

        setDisableBookmarkAction(true)
        post({ url, token: user?.token })
            .then((response) => {
                if (response.isSaved) {
                    setBookmarkedRecipes(prev => new Set(prev).add(recipeId))
                } else {
                    setBookmarkedRecipes(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(recipeId)
                        return newSet
                    })
                }
                setDisableBookmarkAction(false)
            })
            .catch((error) => {
                logError(error)
                setDisableBookmarkAction(false)
                // Show error message to user
                Alert.alert(
                    'Error', 
                    t('Could not update bookmark. Please try again.')
                )
            })
    }, [disableBookmarkAction, bookmarkedRecipes, user?.token, t])

    useFocusEffect(useCallback(() => {
        // get({url: '/ingredient/seasonal', token: user?.token})
        //     .then((data: IPrefItem[]) => setSeasonalProds(data))
        //     .catch(logError)

        fetchRecipes('recipesForYou', setRecipesForYou)
        fetchRecipes('recipesOfMonth', setRecipesOfMonth)

        setSeasonalProds(seasonalProdsFake)
        
        // Reset bookmark states when component focuses
        setBookmarkedRecipes(new Set())
    }, []))

    const onSelectIngredientForFridge = useCallback((ingredient: IPrefItem) => {
        setFridgeProds([...fridgeProds, ingredient])
        let newIngredients: IPrefItem[] = [...searchFilters?.explore?.ingredients || []]
        newIngredients.push(ingredient)

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [fridgeProds, searchFilters])

    const toggleIngredient = useCallback((ingredient: IPrefItem) => {
        let newIngredients = [...searchFilters?.explore?.ingredients || []]
        if (newIngredients.filter((item: { id: number }) => item.id === ingredient.id).length > 0) {
            newIngredients = newIngredients.filter((item: { id: number }) => item.id !== ingredient.id)
        } else {
            newIngredients.push({
                id: ingredient.id,
                title: ingredient.title,
                icon: ingredient.icon,
            })
        }

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [searchFilters])

    const removeIngredient = useCallback((ingredient: IPrefItem) => {
        setFridgeProds(fridgeProds.filter(item => item.id !== ingredient.id))

        let newIngredients: IPrefItem[] = [...searchFilters?.explore?.ingredients || []]
        newIngredients = newIngredients.filter(item => item.id !== ingredient.id)

        setSearchFilters({
            ...searchFilters,
            explore: {
                ...searchFilters?.explore,
                ingredients: newIngredients
            }
        })
    }, [fridgeProds, searchFilters])

    const categoryTextColor = isLight() ? Colors.grey : Colors.lightGrey
    const circlePlus = require('@/assets/icons/circle-plus.png')

    // Category tabs data
    const [categoryTabs, setCategoryTabs] = useState([
        { id: 'all', title: t('All'), selected: true },
        { id: 'month', title: t('Recipes of the month'), selected: false },
        { id: 'seasonal', title: t('Seasonal ingredient'), selected: false }
    ])

    const handleCategorySelect = useCallback((selectedId: string) => {
        setCategoryTabs(prev => prev.map(tab => ({
            ...tab,
            selected: tab.id === selectedId
        })))
        
        // Clear current list when switching categories
        setRecipesForYou([])
        
        // Handle category selection logic
        if (selectedId === 'month') {
            // Show recipes of the month
            fetchRecipes('recipesOfMonth', setRecipesForYou)
        } else if (selectedId === 'seasonal') {
            // Show seasonal recipes
            fetchRecipes('recipesForYou', setRecipesForYou)
        } else {
            // Show all recipes
            fetchRecipes('recipesForYou', setRecipesForYou)
        }
    }, [fetchRecipes])

    const handleSearchResults = useCallback((recipes: IRecipe[]) => {
        setRecipesForYou(modifyRecipesForCards(recipes))
    }, [modifyRecipesForCards])

    const handleFilterResults = useCallback((filteredRecipes: IRecipe[]) => {
        setRecipesForYou(modifyRecipesForCards(filteredRecipes))
    }, [modifyRecipesForCards])

    // no debounced search needed; Search component handles submission

    const renderRecipeCard = ({ item }: { item: any }) => {
        return (
            <RecipeCard 
                recipe={item}
                bookmarkedRecipes={bookmarkedRecipes}
                toggleBookmark={toggleBookmark}
                disableBookmarkAction={disableBookmarkAction}
            />
        )
    }

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView>
                <View style={theme.mainContainer}>
                    {/* Search Section */}
                    <Search page="explore" onSearch={handleSearchResults} />

                    {/* Category Tabs */}
                    <View style={s.categoriesSection}>
                        <FlatList
                            data={categoryTabs}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <Pressable 
                                    style={[s.categoryItem, item.selected && s.categoryItemSelected]}
                                    onPress={() => handleCategorySelect(item.id)}
                                >
                                    <Text style={[s.categoryText, item.selected && s.categoryTextSelected]}>
                                        {item.title}
                                    </Text>
                                </Pressable>
                            )}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={s.categoriesList}
                        />
                    </View>

                    {/* Recipe Feed */}
                    <View style={s.feedSection}>
                        {recipesForYou.length > 0 ? (
                            <FlatList
                                data={recipesForYou}
                                renderItem={renderRecipeCard}
                                keyExtractor={(item) => item.id.toString()}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                                contentContainerStyle={s.recipesList}
                            />
                        ) : (
                            <View style={s.emptyState}>
                                <Text style={s.emptyStateText}>{t('No recipes available')}</Text>
                                <Text style={s.emptyStateSubtext}>{t('Come back later to see new recipes')}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    // Search Section - EXACTLY same as home page
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        borderRadius: 16,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: '#8a8a8a',
    },
    searchInput: {
        flex: 1,
        color: Colors.black,
        borderWidth: 0,
        paddingHorizontal: 10,
        height: 42,
    },
    searchTextInput: {
        fontSize: 16,
        fontFamily: 'Poppins',
        color: Colors.greyTextColor,
    },
    filterButton: {
        width: 32,
        height: 32,
        backgroundColor: '#F6ECE2',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    filterIcon: {
        width: 20,
        height: 20,
        tintColor: '#8a8a8a',
    },

    // Categories Section - EXACTLY same as home page
    categoriesSection: {
        marginBottom: 24,
        backgroundColor: getBgColor(),
    },
    categoriesList: {
        gap: 10,
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
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        lineHeight: 18,
    },
    categoryTextSelected: {

    },
    // Feed Section
    feedSection: {
        marginBottom: 24,
        backgroundColor: getBgColor(),
    },
    recipesList: {
        gap: 16,
    },

    searchResultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
        fontFamily: 'Poppins-Bold',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.grey,
        fontFamily: 'Poppins-Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: Colors.greyTextColor,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
    loadingState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    loadingStateText: {
        fontSize: 16,
        color: Colors.grey,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },

    // Legacy styles for backward compatibility
    productSection: {
        marginTop: 20,
        gap: 13,
    },
    productTitlePart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    products: {
        flexDirection: 'row',
        gap: 10,
    },
})