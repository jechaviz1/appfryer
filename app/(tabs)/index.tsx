import { useCallback, useEffect, useState, useRef } from 'react'
import { Image, Pressable, StyleSheet, FlatList, Dimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'

import { Button, ScrollView, Text, View, TextInput } from "@/components/base/BaseComponents"
import Notifications from '@/components/modals/Notifications'
import Filters from '@/components/modals/Filters'
import Stories from '@/components/Stories'
import Categories from '@/components/Categories'
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import { theme, isLight, getBgColor } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { useAppState } from '@/contexts/appStateContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IRecipe from '@/interfaces/Recipe'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'
import { t } from 'i18next'
import { MediaType } from '@/interfaces/Media'

const storiesFake = [
    { id: 1, image: 'https://picsum.photos/200', name: 'Shiovan', link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 2, image: 'https://picsum.photos/200', name: 'Marcia Hernandez', link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 3, image: 'https://picsum.photos/200', name: 'Greg Egan', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
    { id: 4, image: 'https://picsum.photos/200', name: 'Emma', viewed: true, link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 5, image: 'https://picsum.photos/200', name: 'Jaime', viewed: true, link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 6, image: 'https://picsum.photos/200', name: 'Miguel', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
]



const weeklyDays = [
    { id: 1, day: t('Sun'), date: '23', selected: false },
    { id: 2, day: t('Mon'), date: '24', selected: false },
    { id: 3, day: t('Tue'), date: '25', selected: true },
    { id: 4, day: t('Wed'), date: '26', selected: false },
    { id: 5, day: t('Thu'), date: '27', selected: false },
    { id: 6, day: t('Fri'), date: '28', selected: false },
    { id: 7, day: t('Sat'), date: '29', selected: false },
]



export default function HomeScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user, setUser } = useAuth()
    const { searchFilters, setSearchFilters } = useSearchFilters()
    const { appState, setAppState } = useAppState()

    const [avatar, setAvatar] = useState<any>()
    const [showNotifications, setShowNotifications] = useState<boolean>(false)
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [searchText, setSearchText] = useState<string>('')
    const [recipesForYou, setRecipesForYou] = useState<any[]>([])
    const [recipesOfMonth, setRecipesOfMonth] = useState<any[]>([])
    const [recommendationsSlideIndex, setRecommendationsSlideIndex] = useState<number>(0)
    const [trendingSlideIndex, setTrendingSlideIndex] = useState<number>(0)

    const recommendationsFlatListRef = useRef<FlatList>(null)
    const trendingFlatListRef = useRef<FlatList>(null)

    const modifyRecipesForCards = useCallback((recipes: IRecipe[]) => {
        return recipes.map((r: IRecipe) => {
            const img = r.medias.find(media => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname,
                category: r.categoryName,
                likes: r.cntLikes,
                comments: r.cntComments,
                timeAgo: t('35 minutes ago'), // This could be calculated from createdAt
                bookmarked: r.isSaved
            }
        })
    }, [])

    const fetchRecipes = useCallback((type: string, setRecipes: (recipes: any[]) => void) => {
        if (!user?.token) return
        
        post({
            url: '/feed',
            data: { type },
            token: user.token
        })
            .then((recipes: IRecipe[]) => {
                setRecipes(modifyRecipesForCards(recipes))
            })
            .catch((error) => {
                logError(error)
                setRecipes([])
            })
    }, [user?.token, modifyRecipesForCards])

    const handleSearchSubmit = useCallback(() => {
        if (searchText.trim()) {
            const searchData = {
                ...searchFilters?.home,
                filterTitle: searchText.trim()
            }
            
            post({
                url: '/feed',
                data: searchData,
                token: user?.token
            })
                .then((recipes: IRecipe[]) => {
                    setRecipesForYou(modifyRecipesForCards(recipes))
                })
                .catch(logError)
        }
    }, [searchText, searchFilters, user?.token, modifyRecipesForCards])

    const handleFilterResults = useCallback((filteredRecipes: IRecipe[]) => {
        setRecipesForYou(modifyRecipesForCards(filteredRecipes))
    }, [modifyRecipesForCards])

    const window = Dimensions.get('window')
    
    useEffect(() => {
        if (user?.token) {
            fetchRecipes('recipesForYou', setRecipesForYou)
            fetchRecipes('recipesOfMonth', setRecipesOfMonth)
        } else {
            setRecipesForYou([])
            setRecipesOfMonth([])
        }
    }, [user?.token, fetchRecipes])

    useFocusEffect(useCallback(() => {
        if (user?.token) {
            fetchRecipes('recipesForYou', setRecipesForYou)
            fetchRecipes('recipesOfMonth', setRecipesOfMonth)
        }
    }, [user?.token, fetchRecipes]))
    
    const [tabs] = useState([
        {title: 'New', icon: require('@/assets/icons/lightning.png'), type: 'new'},
        {title: 'Trend', icon: require('@/assets/icons/fire.png'), type: 'trend'},
        {title: 'Seasonal', icon: require('@/assets/icons/leaf.png'), type: 'seasonal'},
    ])

    useFocusEffect(useCallback(() => {
        if (!user) {
            return
        }
        
        get({url: '/profile/me', token: user?.token})
            .then(userData => setUser({...user, ...userData}))
            .catch(e => logError(e, 'Failed to get user data'))
    }, []))

    useEffect(() => {
        user?.profileImageThumb
            ? setAvatar({uri: user.profileImageThumb})
            : setAvatar(require('@/assets/images/icon.png'))
    }, [user])

    const bellIcon = isLight() ? require('@/assets/icons/bell-black.png') : require('@/assets/icons/bell-white.png')

    const renderRecipeCard = ({ item }: { item: any }) => {
        return (
            <RecipeCard 
                recipe={item}
            />
        )
    }

    const renderDayItem = ({ item }: { item: any }) => (
        <Pressable 
            style={[s.dayItem, item.selected && s.dayItemSelected]}
            onPress={() => console.log('Day selected:', item.day)}
        >
            <Text style={[s.dayText, item.selected && s.dayTextSelected]}>{item.day}</Text>
            <Text style={[s.dateText, item.selected && s.dateTextSelected]}>{item.date}</Text>
        </Pressable>
    )

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <Notifications isVisible={showNotifications} onHide={() => setShowNotifications(false)} />
                <Filters 
                    isVisible={showFilters} 
                    onHide={() => setShowFilters(false)} 
                    page="home" 
                    onSubmit={handleFilterResults}
                />

                {/* Header Section */}
                <View style={s.header}>
                    <View style={s.greetingSection}>
                        <Text style={[s.greeting, { color: isLight() ? Colors.grey : Colors.lightGrey }]}>{t('Hello,')}</Text>
                        <Text style={s.userName}>{user?.fullname || t('User')}</Text>
                    </View>
                    <Pressable onPress={() => {
                        setShowNotifications(true)
                        setAppState({ ...appState, isNewNotifications: false })
                    }}>
                        <Image source={avatar} style={s.profileImage} />
                        { appState.isNewNotifications && <View style={s.notificationMarker} />}
                    </Pressable>
                </View>

                {/* Search Bar */}
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
                            onSubmitEditing={handleSearchSubmit}
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

                {/* Categories */}
                <Categories style={s.categoriesSection} />

                {/* Hero Banner */}
                <Pressable style={s.heroBanner} onPress={() => router.navigate('/(pages)/quiz')}>
                    <Image
                        source={require('@/assets/images/quiz-banner.png')}
                        style={s.heroBannerImage}
                        resizeMode="cover"
                    />
                    <View style={s.heroBannerOverlay}>
                        <View style={s.heroBannerContent}>
                            <View style={s.heroLeftSection}>
                                <Image 
                                    source={require('@/assets/images/quiz-person.png')} 
                                    style={s.heroPersonImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={s.heroRightSection}>
                                <View style={s.heroIconContainer}>
                                    <Image 
                                        source={require('@/assets/images/quiz-icon.png')} 
                                        style={s.heroBowlIcon}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text type="subtitle" style={s.heroText}>{t('What would you like to eat?')}</Text>
                            </View>
                        </View>
                    </View>
                </Pressable>

                {/* Recommendations Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Recommendations for you')}</Text>
                        <Pressable>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    {recipesForYou.length === 0 ? (
                        <View style={s.emptyState}>
                            <Text style={s.emptyStateText}>
                                {user?.token ? t('Loading recommendations...') : t('Please sign in to see recommendations')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                ref={recommendationsFlatListRef}
                                data={recipesForYou}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={renderRecipeCard}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={s.recipesList}
                                pagingEnabled={true}
                                onMomentumScrollEnd={(event) => {
                                    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (window.width - 36))
                                    setRecommendationsSlideIndex(slideIndex)
                                }}
                            />
                            {recipesForYou.length > 1 && (
                                <View style={s.slidePaginationDots}>
                                    {recipesForYou.map((_, index) => (
                                        <Pressable 
                                            key={index}
                                            style={[s.slideDot, recommendationsSlideIndex === index ? s.dotActive : s.dotInactive]}
                                            onPress={() => {
                                                setRecommendationsSlideIndex(index)
                                                recommendationsFlatListRef.current?.scrollToIndex({ index, animated: true })
                                            }}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
                
                {/* Weekly Plan Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Weekly plan')}</Text>
                        <Pressable>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    <FlatList
                        data={weeklyDays}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderDayItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={s.daysList}
                    />
                </View>

                {/* Trending Recipes Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Trending recipes')}</Text>
                        <Pressable>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    {recipesOfMonth.length === 0 ? (
                        <View style={s.emptyState}>
                            <Text style={s.emptyStateText}>
                                {user?.token ? t('Loading trending recipes...') : t('Please sign in to see trending recipes')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                ref={trendingFlatListRef}
                                data={recipesOfMonth}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={renderRecipeCard}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={s.recipesList}
                                pagingEnabled={true}
                                onMomentumScrollEnd={(event) => {
                                    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (window.width - 36))
                                    setTrendingSlideIndex(slideIndex)
                                }}
                            />
                            {recipesOfMonth.length > 1 && (
                                <View style={s.slidePaginationDots}>
                                    {recipesOfMonth.map((_, index) => (
                                        <Pressable 
                                            key={index}
                                            style={[s.slideDot, trendingSlideIndex === index ? s.dotActive : s.dotInactive]}
                                            onPress={() => {
                                                setTrendingSlideIndex(index)
                                                trendingFlatListRef.current?.scrollToIndex({ index, animated: true })
                                            }}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    // Header Section
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: getBgColor(),
    },
    greetingSection: {
        flex: 1,
        backgroundColor: getBgColor(),
    },
    greeting: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.grey,
        fontFamily: 'Poppins',
        marginBottom: 8,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.black,
        fontFamily: 'Poppins-SemiBold',
        lineHeight: 20,
    },
    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: Colors.mainColor,
    },
    notificationMarker: {
        position: 'absolute',
        top: 4,
        right: 0,
        width: 12,
        height: 12,
        borderWidth: 2,
        borderRadius: 6,
        backgroundColor: 'red',
        borderColor: Colors.white,
    },

    // Search Section
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

    // Categories Section
    categoriesSection: {
        marginBottom: 24,
        backgroundColor: getBgColor(),
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: Colors.grey,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },

    // Hero Banner
    heroBanner: {
        position: 'relative',
        height: 116,
        borderRadius: 10,
        marginBottom: 24,
        overflow: 'hidden',
    },
    heroBannerImage: {
        width: '100%',
        height: '100%',
    },
    heroBannerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroBannerContent: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
    },
    heroLeftSection: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingRight: 16,
        backgroundColor: 'transparent',
    },
    heroPersonImage: {
        width: 130,
        height: 150,
        position: 'absolute',
    },
    heroRightSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    heroIconContainer: {
        backgroundColor: 'transparent',
    },
    heroBowlIcon: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    heroText: {
        fontSize: 20,
        color: Colors.white,
        fontFamily: 'Poppins-Bold',
        lineHeight: 22,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    heroIcon: {
        width: 24,
        height: 24,
        marginBottom: 8,
    },

    // Section Styles
    section: {
        marginBottom: 24,
        backgroundColor: getBgColor(),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: getBgColor(),
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
        fontFamily: 'Poppins-Bold',
        backgroundColor: getBgColor(),
    },
    seeAllText: {
        fontSize: 14,
        color: Colors.mainColor,
        fontFamily: 'Poppins-Medium',
        backgroundColor: getBgColor(),
    },

    // Recipe Cards
    recipesList: {},
    slidePaginationDots: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: getBgColor(),
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        marginTop: 36,
        marginBottom: 16,
    },
    slideDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    dotActive: {
        backgroundColor: Colors.mainColor,
    },
    dotInactive: {
        backgroundColor: '#e0e0e0',
    },

    // Weekly Plan
    daysList: {
        gap: 6,
    },
    dayItem: {
        alignItems: 'center',
        backgroundColor: '#FCEEE1',
        borderRadius: 14,
        paddingHorizontal: 3,
        paddingVertical: 3,
        minWidth: 46,
    },
    dayItemSelected: {
        backgroundColor: Colors.mainColor,
    },
    dayText: {
        fontSize: 12,
        color: Colors.grey,
        fontFamily: 'Poppins-Medium',
        padding: 10,
    },
    dayTextSelected: {
        color: Colors.white,
    },
    dateText: {
        fontSize: 16,
        color: '#B5B5B5',
        fontFamily: 'Poppins-SemiBold',
        padding: 10,
    },
    dateTextSelected: {
        backgroundColor: Colors.white,
        color: Colors.mainColor,
        padding: 10,
        borderRadius: 12,
    },
})
