import { useCallback, useState, useEffect } from 'react'
import { Image, Pressable, StyleSheet, FlatList, Alert, Dimensions } from "react-native"
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

import { IngredientButton, ScrollView, Text, View, TextInput } from "@/components/base/BaseComponents"
import Search from "@/components/Search"
import Filters from "@/components/modals/Filters"
import IngredientSearchInput from "@/components/IngredientSearchInput"
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import RecipeOfMonth from '@/components/RecipeOfMonth'
import Challenges from '@/components/Challenges'
import Achievements from '@/components/Achievements'
import Categories from '@/components/Categories'
import Diets from '@/components/Diets'
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

    const [searchResults, setSearchResults] = useState<IRecipeCard[]>([])
    const [recipesForYou, setRecipesForYou] = useState<IRecipeCard[]>([])
    const [recipesOfMonth, setRecipesOfMonth] = useState<IRecipeCard[]>([])
    const [searchText, setSearchText] = useState<string>('')
    const [isSearching, setIsSearching] = useState<boolean>(false)
    
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
                profileName: r.userFullname
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
        
        // Clear search when changing categories
        setSearchText('')
        setSearchResults([])
        
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

    const handleSearch = useCallback(() => {
        if (searchText.trim()) {
            setIsSearching(true)
            // Use existing search logic
            post({
                url: '/feed',
                data: { filterTitle: searchText.trim() },
                token: user?.token
            })
                .then((recipes: IRecipe[]) => {
                    setSearchResults(modifyRecipesForCards(recipes))
                    setIsSearching(false)
                })
                .catch((error) => {
                    logError(error)
                    setIsSearching(false)
                    Alert.alert('Error', t('Search could not be completed. Please try again.'))
                })
        } else {
            // Clear search results
            setSearchResults([])
        }
    }, [searchText, user?.token, modifyRecipesForCards])

    const handleFilterResults = useCallback((filteredRecipes: IRecipe[]) => {
        setRecipesForYou(modifyRecipesForCards(filteredRecipes))
        // Clear search results when filters are applied
        setSearchResults([])
        setSearchText('')
    }, [modifyRecipesForCards])

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchText.trim()) {
                handleSearch()
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchText, handleSearch])

    const renderRecipeCard = ({ item }: { item: any }) => {
        // Handle both API data and mock data structures
        const isApiData = 'profileName' in item && !('category' in item)
        
        return (
            <Pressable 
                style={[s.recipeCard, { width: window.width - 30 }]}
                onPress={() => {
                    // Navigate to recipe detail page
                    router.push(`/(pages)/recipe/${item.id}`)
                }}
            >
                {item.image && item.image.trim() !== '' ? (
                    <Image source={{ uri: item.image }} style={s.recipeImage} />
                ) : (
                    <View style={[s.recipeImage, s.placeholderImage]} />
                )}
                <LinearGradient
                    colors={["#000000", "rgba(217, 217, 217, 0)"]}
                    locations={[0.04, 1]}       // 4.07% and 100%
                    start={{ x: 0.5, y: 0 }}    // top center
                    end={{ x: 0.5, y: 1 }}      // bottom center
                    style={s.recipeCardHeader}
                >
                    <View style={s.recipeCardUser}>
                        <Image source={require('@/assets/icons/person-round.png')} style={s.userIcon} />
                        <View style={s.recipeCardUserInfo}>
                            <Text style={s.recipeUserName}>{item.profileName}</Text>
                            <Text style={s.userCategory}>
                                {isApiData ? t('Recipe') : (item.category || t('Recipe'))}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={s.recipeCardFooter}>
                    <View style={s.footerSection}>
                        <View style={s.engagementMetrics}>
                            <Pressable 
                                style={s.metricItem}
                                onPress={() => {
                                    console.log('Like toggled for recipe:', item.id)
                                }}
                            >
                                <Image source={require('@/assets/icons/liked.png')} style={s.metricIcon} />
                                <Text style={s.metricText}>
                                    {isApiData ? '0' : (item.likes || '0')}
                                </Text>
                            </Pressable>
                            <Pressable 
                                style={s.metricItem}
                                onPress={() => {
                                    console.log('Comment pressed for recipe:', item.id)
                                }}
                            >
                                <Image source={require('@/assets/icons/chat-box.png')} style={s.metricIcon} />
                                <Text style={s.metricText}>
                                    {isApiData ? '0' : (item.comments || '0')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={s.footerSection}>
                        <View style={s.paginationDots}>
                            <View style={[s.dot, s.dotActive]} />
                            <View style={[s.dot, s.dotInactive]} />
                            <View style={[s.dot, s.dotInactive]} />
                        </View>
                    </View>
                    <View style={s.footerSection}>
                        <Pressable 
                            style={s.bookmarkBtn}
                            onPress={() => toggleBookmark(item.id)}
                            disabled={disableBookmarkAction}
                        >
                            <Image 
                                source={
                                    bookmarkedRecipes.has(item.id)
                                        ? require('@/assets/icons/ribbon-filled.png')
                                        : require('@/assets/icons/ribbon.png')
                                } 
                                style={[
                                    s.bookmarkIcon,
                                    disableBookmarkAction && s.bookmarkIconDisabled
                                ]} 
                            />
                        </Pressable>
                    </View>
                </View>
                
                <Text style={s.recipeTitle}>{item.title}</Text>
                <Text style={s.recipeTime}>
                    {isApiData ? t('Just published') : (item.timeAgo || t('Just published'))}
                </Text>
            </Pressable>
        )
    }

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <Filters 
                    isVisible={showFilters} 
                    onHide={() => setShowFilters(false)} 
                    page="explore" 
                    onSubmit={handleFilterResults}
                />
                {/* Search Section */}
                <View style={s.searchSection}>
                    <View style={s.searchContainer}>
                        <Image source={require('@/assets/icons/search.png')} style={s.searchIcon} />
                        <TextInput
                            styleContainer={s.searchInput}
                            styleTextInput={s.searchTextInput}
                            placeholder={t('Search recipes')}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor={Colors.grey}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                    </View>
                    <Pressable 
                        style={s.filterButton}
                        onPress={() => setShowFilters(true)}
                    >
                        <Image source={require('@/assets/icons/filter-dark.png')} style={s.filterIcon} />
                    </Pressable>
                </View>

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
                    {isSearching ? (
                        <View style={s.loadingState}>
                            <Text style={s.loadingStateText}>{t('Searching recipes...')}</Text>
                        </View>
                    ) : searchResults.length > 0 ? (
                        <View>
                            <Text style={s.searchResultsTitle}>{t('Search results')}</Text>
                            <FlatList
                                data={searchResults}
                                renderItem={renderRecipeCard}
                                keyExtractor={(item) => item.id.toString()}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                                contentContainerStyle={s.recipesList}
                            />
                        </View>
                    ) : searchText.length > 0 ? (
                        <View style={s.emptyState}>
                            <Text style={s.emptyStateText}>{t('No recipes found')}</Text>
                            <Text style={s.emptyStateSubtext}>{t('Try with other search terms')}</Text>
                        </View>
                    ) : (
                        recipesForYou.length > 0 ? (
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
                        )
                    )}
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

    // Recipe Card - EXACTLY same as home page
    recipeCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
    },
    recipeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        position: 'absolute',
        width: '100%',
        zIndex: 2,
        height: 160,
    },
    recipeCardUser: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'transparent',
    },
    recipeCardUserInfo: {
        backgroundColor: 'transparent',
    },
    userIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        tintColor: Colors.white,
    },
    recipeUserName: {
        fontSize: 16,
        lineHeight: 22,
        color: Colors.white,
        fontFamily: 'Poppins-SemiBold',
        backgroundColor: 'transparent',
    },
    userCategory: {
        fontSize: 13,
        lineHeight: 17,
        color: Colors.white,
        fontFamily: 'Poppins',
        backgroundColor: 'transparent',
    },
    bookmarkBtn: {
        flexDirection: 'row',
        padding: 6,
        justifyContent: 'flex-end',
        borderRadius: 4,
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
    },
    bookmarkIconDisabled: {
        opacity: 0.5,
    },
    recipeImage: {
        width: '100%',
        height: 450,
        backgroundColor: '#f5f5f5',
    },
    placeholderImage: {
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
    },
    footerSection: {
        flex: 1,
        justifyContent: 'center',
    },
    engagementMetrics: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricIcon: {
        width: 24,
        height: 24,
    },
    metricText: {
        fontSize: 14,
        lineHeight: 18,
        color: '#919191',
        fontFamily: 'Poppins',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: Colors.mainColor,
    },
    dotInactive: {
        backgroundColor: '#e0e0e0',
    },
    recipeTitle: {
        fontSize: 16,
        color: Colors.black,
        marginBottom: 6,
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        lineHeight: 22,
    },
    recipeTime: {
        fontSize: 13,
        color: '#919191',
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        paddingBottom: 16,
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