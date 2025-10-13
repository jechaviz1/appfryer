import { useCallback, useEffect, useState, useRef } from 'react'
import { Image, Pressable, StyleSheet, FlatList, Dimensions, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Notifications from '@/components/modals/Notifications'
import Search from '@/components/Search'
import Categories from '@/components/Categories'
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import { theme, isLight, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor, getShadowColor } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { useAppState } from '@/contexts/appStateContext'
import { useTheme } from '@/contexts/themeContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IRecipe from '@/interfaces/Recipe'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'
import { MediaType } from '@/interfaces/Media'

// Generate current week dates
const getCurrentWeek = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay) // Start from Sunday
    
    const weekDays = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        
        weekDays.push({
            id: i + 1,
            day: dayNames[i],
            date: date.getDate().toString(),
            selected: i === currentDay,
            fullDate: date
        })
    }
    
    return weekDays
}

const weeklyDays = getCurrentWeek()

export default function HomeScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user, setUser } = useAuth()
    const { searchFilters, setSearchFilters } = useSearchFilters()
    const { appState, setAppState } = useAppState()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [avatar, setAvatar] = useState<any>()
    const [showNotifications, setShowNotifications] = useState<boolean>(false)
    const [recipesForYou, setRecipesForYou] = useState<any[]>([])
    const [recipesOfMonth, setRecipesOfMonth] = useState<any[]>([])
    const [recommendationsSlideIndex, setRecommendationsSlideIndex] = useState<number>(0)
    const [trendingSlideIndex, setTrendingSlideIndex] = useState<number>(0)

	// Bookmark state for recipe cards
	const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<number>>(new Set())
	const [disableBookmarkAction, setDisableBookmarkAction] = useState<boolean>(false)

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
                cntLikes: r.cntLikes,
                cntComments: r.cntComments,
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
				// prime bookmark state from API result
				recipes.forEach((r: IRecipe) => {
					if (r.isSaved) {
						setBookmarkedRecipes(prev => {
							const next = new Set(prev)
							next.add(r.id)
							return next
						})
					}
				})
            })
            .catch((error) => {
                logError(error)
                setRecipes([])
            })
    }, [user?.token, modifyRecipesForCards])

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
					setBookmarkedRecipes(prev => {
						const next = new Set(prev)
						next.add(recipeId)
						return next
					})
				} else {
					setBookmarkedRecipes(prev => {
						const next = new Set(prev)
						next.delete(recipeId)
						return next
					})
				}
				setDisableBookmarkAction(false)
			})
			.catch((error) => {
				logError(error)
				setDisableBookmarkAction(false)
				Alert.alert(
					'Error',
					t('Could not update bookmark. Please try again.')
				)
			})
	}, [disableBookmarkAction, bookmarkedRecipes, user?.token, t])

    const handleSearchResults = useCallback((recipes: IRecipe[]) => {
        setRecipesForYou(modifyRecipesForCards(recipes))
    }, [modifyRecipesForCards])

    const window = Dimensions.get('window')
    
	useEffect(() => {
        if (user?.token) {
            fetchRecipes('recipesForYou', setRecipesForYou)
            fetchRecipes('recipesOfMonth', setRecipesOfMonth)
        } else {
            setRecipesForYou([])
            setRecipesOfMonth([])
			setBookmarkedRecipes(new Set())
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

    const handleNotificationPress = () => {
        setShowNotifications(true)
        setAppState({ ...appState, isNewNotifications: false })
    }

    const handleQuizPress = () => {
        router.navigate('/(pages)/quiz')
    }

    const handleSeeAllRecommendations = () => {
        // TODO: Navigate to recommendations page
    }

    const handleSeeAllWeeklyPlan = () => {
        // TODO: Navigate to weekly plan page
    }

    const handleSeeAllTrending = () => {
        // TODO: Navigate to trending page
    }

    const handleRecommendationsScrollEnd = (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (window.width - 36))
        setRecommendationsSlideIndex(slideIndex)
    }

    const handleTrendingScrollEnd = (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (window.width - 36))
        setTrendingSlideIndex(slideIndex)
    }

    const handleRecommendationDotPress = (index: number) => {
        setRecommendationsSlideIndex(index)
        recommendationsFlatListRef.current?.scrollToIndex({ index, animated: true })
    }

    const handleTrendingDotPress = (index: number) => {
        setTrendingSlideIndex(index)
        trendingFlatListRef.current?.scrollToIndex({ index, animated: true })
    }

    const handleDayPress = (item: any) => {
        console.log('Day selected:', item.day)
    }

    const renderDayItem = ({ item }: { item: any }) => (
        <Pressable 
            style={[s.dayItem, item.selected && s.dayItemSelected]}
            onPress={() => handleDayPress(item)}
        >
            <Text style={[s.dayText, item.selected && s.dayTextSelected]}>{item.day}</Text>
            <Text style={[s.dateText, item.selected && s.dateTextSelected]}>{item.date}</Text>
        </Pressable>
    )

    return (
        <View style={s.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView>
                <Notifications isVisible={showNotifications} onHide={() => setShowNotifications(false)} />
                <View style={s.mainContainer}>
                    {/* Header Section */}
                    <View style={s.header}>
                        <View style={s.greetingSection}>
                            <Text style={s.greeting}>{t('Hello,')}</Text>
                            <Text style={s.userName}>{user?.fullname || t('User')}</Text>
                        </View>
                        <Pressable onPress={handleNotificationPress}>
                            <Image source={avatar} style={s.profileImage} />
                            { appState.isNewNotifications && <View style={s.notificationMarker} />}
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <Search page="home" onSearch={handleSearchResults} />

                    {/* Categories */}
                    <Categories style={s.categoriesSection} />

                    {/* Hero Banner */}
                    <Pressable style={s.heroBanner} onPress={handleQuizPress}>
                        <Image
                            source={require('@/assets/images/quiz-banner.png')}
                            style={s.heroBannerImage}
                            resizeMode="cover"
                        />
                        <View style={s.heroBannerOverlay}>
                            <View style={s.heroBannerContent}>
                                <View style={s.heroLeftSection}>
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
                            <Pressable onPress={handleSeeAllRecommendations}>
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
                                    onMomentumScrollEnd={handleRecommendationsScrollEnd}
                                />
                                {recipesForYou.length > 1 && (
                                    <View style={s.slidePaginationDots}>
                                        {recipesForYou.map((_, index) => (
                                            <Pressable 
                                                key={index}
                                                style={[s.slideDot, recommendationsSlideIndex === index ? s.dotActive : s.dotInactive]}
                                                onPress={() => handleRecommendationDotPress(index)}
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
                            <Pressable onPress={handleSeeAllWeeklyPlan}>
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
                            <Pressable onPress={handleSeeAllTrending}>
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
                                    onMomentumScrollEnd={handleTrendingScrollEnd}
                                />
                                {recipesOfMonth.length > 1 && (
                                    <View style={s.slidePaginationDots}>
                                        {recipesOfMonth.map((_, index) => (
                                            <Pressable 
                                                key={index}
                                                style={[s.slideDot, trendingSlideIndex === index ? s.dotActive : s.dotInactive]}
                                                onPress={() => handleTrendingDotPress(index)}
                                            />
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    // Container
    container: {
        flex: 1,
        backgroundColor: getBgColor(),
    },
    mainContainer: {
        flex: 1,
        backgroundColor: getBgColor(),
        paddingHorizontal: 24,
        paddingTop: 20,
    },
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
        color: getSecondaryTextColor(),
        fontFamily: 'Poppins',
        marginBottom: 8,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: getTextColor(),
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


    // Categories Section
    categoriesSection: {
        marginTop: 20,
        marginBottom: 16,
        backgroundColor: getBgColor(),
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: isDark ? Colors.dark.emptyStateSubtext : Colors.light.emptyStateSubtext,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },

    // Hero Banner
    heroBanner: {
        position: 'relative',
        height: 120,
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
        color: getTextColor(),
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
        backgroundColor: isDark ? Colors.dark.borderColor : '#e0e0e0',
    },

    // Weekly Plan
    daysList: {
        gap: 6,
    },
    dayItem: {
        alignItems: 'center',
        backgroundColor: getCardBackground(),
        borderRadius: 14,
        paddingHorizontal: 3,
        paddingVertical: 3,
        width: 46,
    },
    dayItemSelected: {
        backgroundColor: Colors.mainColor,
    },
    dayText: {
        fontSize: 12,
        color: isDark ? Colors.dark.secondaryText : '#B5B5B5',
        fontFamily: 'Poppins-Medium',
        paddingVertical: 7,
    },
    dayTextSelected: {
        color: Colors.white,
    },
    dateText: {
        fontSize: 16,
        lineHeight: 22,
        color: isDark ? Colors.dark.secondaryText : '#B5B5B5',
        fontFamily: 'Poppins-SemiBold',
        padding: 10,
        minWidth: 38,
        textAlign: 'center',
    },
    dateTextSelected: {
        backgroundColor: isDark ? Colors.dark.cardBackground : Colors.white,
        color: Colors.mainColor,
        padding: 10,
        borderRadius: 12,
    },
})
