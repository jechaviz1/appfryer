import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Image, ImageBackground, Pressable, Share, StyleSheet, useWindowDimensions, Dimensions, Alert } from 'react-native'
import { useRouter, useGlobalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import Modal from 'react-native-modal'
import DatePicker from 'react-native-date-picker'
// import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'

import { BackButton, Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import SavedRecipe from '@/components/modals/SavedRecipe'
import CommentBox from '@/components/CommentBox'
import Comment from '@/components/Comment'
import Ingredients from '@/components/Ingredients'
import Instructions from '@/components/Instructions'
import RecipeCard from '@/components/RecipeCard'
import Categories from '@/components/Categories'
import NutritionalValues from '@/components/NutritionalValues'
import Badges from '@/components/Badges'
import { useAuth } from '@/contexts/authContext'
import { useAppState } from '@/contexts/appStateContext'
import { dateToDisplay, timeFromMinutes } from '@/services/datetime'
import { get, post } from '@/services/apiRequests'
import { IRecipeCard } from '@/components/RecipeCard'
import IComment from '@/interfaces/Comment'
import IMedia, { MediaType } from '@/interfaces/Media'
import IRecipe from '@/interfaces/Recipe'
import { logError } from '@/services/utils'
import IFolder from '@/interfaces/Folder'
import { Colors, weeklyColors } from '@/constants/Colors'
import { theme, isLight, getBgColor } from '@/constants/Theme'
import Header from '@/components/Header'

const { width: screenWidth } = Dimensions.get('window')

export default function RecipeScreen() {
    const globQuery = useGlobalSearchParams()
    const { user } = useAuth()
    const router = useRouter()
    const { i18n, t } = useTranslation()
    const { appState, setAppState } = useAppState()
    const { height } = useWindowDimensions()

    const [isFetched, setFetched] = useState<boolean>(false)
    const [recipe, setRecipe] = useState<IRecipe>()
    const [showAddToPlanModal, setShowAddToPlanModal] = useState<boolean>(false)
    const [showSeeCalendarModal, setShowSeeCalendarModal] = useState<boolean>(false)
    const [openDatePicker, setOpenDatePicker] = useState<boolean>(false)
    const [planDate, setPlanDate] = useState<Date>(new Date())
    const [planType, setPlanType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>()
    const [planError, setPlanError] = useState<string>('')
    const [titleImageUrl, setTitleImageUrl] = useState<string>()
    const [isLiked, setIsLiked] = useState<boolean>(false)
    const [disableLikeAction, setDisableLikeAction] = useState<boolean>(false)
    const [isSaved, setIsSaved] = useState<boolean>(false)
    const [disableSaveAction, setDisableSaveAction] = useState<boolean>(false)
    const [displayFolders, setDisplayFolders] = useState<boolean>(false)
    const [actualPortions, setActualPortions] = useState<number>(0)

    const [sortedComments, setSortedComments] = useState<IComment[]>([])
    const [showingCommentBox, setShowingCommentBox] = useState<boolean>(false)

    const [recipesOfMonth, setRecipesOfMonth] = useState<IRecipeCard[]>([])
    const [trendingSlideIndex, setTrendingSlideIndex] = useState<number>(0)

	// Bookmark state for child RecipeCard list
	const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<number>>(new Set())
	const [disableBookmarkActionCards, setDisableBookmarkActionCards] = useState<boolean>(false)

    const [activeTab, setActiveTab] = useState<number>(0)
    const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(0)
    const tabsRef = useRef<FlatList<string>>(null)
    const trendingFlatListRef = useRef<FlatList>(null)

    const getProfileUrl = useCallback(() => {
        return recipe?.userId === user?.id ? '/(tabs)/profile' : '/(pages)/profile'
    }, [recipe, user])
    const getProfileImg = useCallback(() => {
        return recipe?.userProfileImageThumb ? {uri: recipe.userProfileImageThumb} : require('@/assets/images/icon.png')
    }, [recipe])

	// Toggle bookmark for carousel RecipeCard items
	const toggleBookmark = useCallback((recipeId: number) => {
		if (disableBookmarkActionCards) {
			return
		}

		const isBookmarked = bookmarkedRecipes.has(recipeId)
		const url = `/recipe/${recipeId}/${isBookmarked ? 'unsave' : 'save'}`

		setDisableBookmarkActionCards(true)
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
				setDisableBookmarkActionCards(false)
			})
			.catch((error) => {
				logError(error)
				setDisableBookmarkActionCards(false)
				Alert.alert(
					'Error',
					t('Could not update bookmark. Please try again.')
				)
			})
	}, [disableBookmarkActionCards, bookmarkedRecipes, user?.token, t])

	const renderRecipeCard = ({ item }: { item: any }) => {
		return (
			<RecipeCard 
				recipe={item}
				bookmarkedRecipes={bookmarkedRecipes}
				toggleBookmark={toggleBookmark}
				disableBookmarkAction={disableBookmarkActionCards}
			/>
		)
	}

    const fetchRecipe = useCallback(async (id: number) => {
        const localRecipeStr = await AsyncStorage.getItem(`recipe/${id}`)
        if (localRecipeStr) {
            const localRecipe: IRecipe = JSON.parse(localRecipeStr)
            setRecipe(localRecipe)
            setIsLiked(localRecipe.isLiked)
            setIsSaved(localRecipe.isSaved)
            setActualPortions(localRecipe.portions)
            return
        }

        get({url: `/recipe/${id}`, token: user?.token})
            .then(retrievedRecipe => {
                setRecipe(retrievedRecipe)
                setIsLiked(retrievedRecipe.isLiked)
                setIsSaved(retrievedRecipe.isSaved)
                setActualPortions(retrievedRecipe.portions)
            })
            .catch(logError)
    }, [])

    const fetchRecipesOfMonth = useCallback(() => {
        return post({
            url: '/feed',
            data: { type: 'recipesOfMonth' },
            token: user?.token
        })
            .then((recs: IRecipe[]) => {
				// initialize bookmark state for saved recipes
				const savedIds = recs.filter(r => r.isSaved).map(r => r.id)
				setBookmarkedRecipes(prev => {
					const next = new Set(prev)
					savedIds.forEach(id => next.add(id))
					return next
				})
                const recipes4Cards: IRecipeCard[] = recs.map((r: IRecipe) => {
                    const image = r.medias.find(media => media.type == MediaType.IMAGE)
                    return { 
                        id: r.id, 
                        title: r.title, 
                        image: image?.url || '', 
                        profileName: r.userFullname,
                        cntLikes: r.cntLikes,
                        cntComments: r.cntComments,
                    }
                })
                return recipes4Cards
            })
            .catch(e => {
                logError(e)
                return []
            })
    }, [])

    useEffect(() => {
        if (isFetched) {
            return
        }
        fetchRecipesOfMonth()
            .then(r => setRecipesOfMonth(r))
        fetchRecipe(Number(globQuery.id))
            .then(() => setFetched(true))
    }, [globQuery.id, isFetched])

    useEffect(() => {
        if (recipe && recipe.medias.length > 0) {
            const imageMedia: IMedia | undefined = recipe.medias.find(media => media.type == MediaType.IMAGE)
            imageMedia && setTitleImageUrl(imageMedia.url)
        }
        if (recipe?.comments) {
            const initComments = recipe.comments.map((c: IComment) => c)
            const comments: IComment[] = []

            function findRepliesFor(id: number) {
                const replies = initComments.filter(rc => rc.parentId === id)
                if (replies.length > 0) {
                    replies.forEach(rc => {
                        comments.push(rc)
                        findRepliesFor(rc.id)
                    })
                }
            }
            initComments.filter(c => c.depth === 0).forEach(c => {
                comments.push(c)
                findRepliesFor(c.id)
                setSortedComments(comments)
            })
        }
    }, [recipe])

    useEffect(() => {
        tabsRef.current?.scrollToIndex({
            index: activeTab,
            animated: true,
        })
    }, [activeTab])

    const onHideAddToPlanModal = useCallback(() => {
        setShowAddToPlanModal(false)
    }, [])

    const onHideSeeCalendarModal = useCallback(() => {
        setShowSeeCalendarModal(false)
    }, [])

    const onSaveRecipeToWeeklyPlan = useCallback(() => {
        post({
            url: '/plan/edit',
            data: {
                action: 'add',
                mealDate: planDate.toISOString().split('T')[0],
                mealType: planType,
                recipeId: recipe!.id
            },
            token: user?.token
        })
            .then(() => {
                onHideAddToPlanModal()
                setShowSeeCalendarModal(true)
            })
            .catch(e => {
                logError(e)
                setPlanError(e?.response?.data?.message ?? 'Something went wrong')
            })
    }, [planDate, planType, recipe])

    const onShare = useCallback(() => {
        if (!recipe) {
            return
        }
        
        Share.share({
            // message: Linking.createURL(`recipe/${recipe.id}`), // like appfryer://recipe/1
            message: t('Check out this recipe!') + ' ' + process.env.EXPO_PUBLIC_URL + (`/recipe/${recipe.id}`),
            title: recipe.title,
        })
        // Sharing.shareAsync('https://appfryer.com/recipe/' + recipe.id, {
        //     dialogTitle: recipe.title,
        //     UTI: 'public.html',
        // })
        //     .catch(logError)
    }, [recipe])

    const toggleLikeRecipe = useCallback(() => {
        if (!recipe || disableLikeAction) {
            return
        }

        setDisableLikeAction(true)
        post({
            url: `/recipe/${recipe.id}/${isLiked ? 'unlike' : 'like'}`,
            token: user?.token
        })
            .then((response) => {
                setIsLiked(response.isLiked)
                setDisableLikeAction(false)
            })
            .catch(e => {
                logError(e)
                setDisableLikeAction(false)
            })
    }, [disableLikeAction, isLiked, recipe])

    const toggleSaveRecipe = useCallback((action?: 'save' | 'unsave') => {
        if (!recipe || disableSaveAction) {
            return
        }
        if (action === 'save' && isSaved) {
            return
        }
        const url = `/recipe/${recipe.id}/`
            + (action ?? (isSaved ? 'unsave' : 'save'))

        setDisableSaveAction(true)
        post({ url, token: user?.token })
            .then((response) => {
                setIsSaved(response.isSaved)
                setDisableSaveAction(false)
                if (response.isSaved) {
                    setDisplayFolders(true)
                    return
                }
                // on unsave
                setRecipe({...recipe, folders: []})
                AsyncStorage.removeItem(`recipe/${recipe.id}`)
            })
            .catch(e => {
                logError(e)
                setDisableSaveAction(false)
            })
    }, [disableSaveAction, isSaved, recipe])

    const onSaveLocal = useCallback(() => {
        setIsSaved(true)
        toggleSaveRecipe('save')
    }, [])

    const renderTab = useCallback((tab: { item: string, index: number }) => {
        switch (tab.item) {
            case 'ingredients':
                if (activeTab !== 0) {
                    return null
                }
                return <Ingredients
                    ingredients={recipe!.ingredients}
                    portionsInRecipe={recipe!.portions}
                    actualPortions={actualPortions}
                    setActualPortions={setActualPortions}
                />
            case 'instructions':
                if (activeTab !== 1) {
                    return null
                }
                return <Instructions steps={recipe!.cookingSteps} />
            default:
                return null
            
        }
    }, [activeTab, recipe, actualPortions])

    const setRate = useCallback((rating: number) => {
        post({
            url: `/recipe/${recipe?.id}/rating`,
            data: { rating },
            token: user?.token,
        })
            .then((response) => {
                setRecipe({...recipe, ...response})
            })
            .catch(logError)
    }, [recipe])

    const redirectToRecipeCooking = useCallback(() => {
        setAppState({ ...appState, actualRecipe: recipe })

        router.push({
            pathname: '/(pages)/start-cooking',
            params: { id: recipe?.id, portions: actualPortions }
        })
    }, [actualPortions, recipe])

    const onPostComment = useCallback((comment: IComment) => {
        if (!recipe?.id || !recipe?.userId || !recipe?.userProfileImageThumb) {
            return
        }
        setRecipe({...recipe, comments: [...recipe?.comments || [], comment]})
        setShowingCommentBox(false)
    }, [recipe?.comments])

    if (!recipe) {
        return null
    }

    const greyTextColor = isLight() ? Colors.grey : Colors.lightGrey

    return (
        <View style={s.container}>
            {/* Modals - keeping existing logic */}
            {showAddToPlanModal && <Modal
                isVisible={showAddToPlanModal}
                style={[theme.modal, s.modalView, {backgroundColor: getBgColor(), marginTop: height * 0.39}]}
                onModalHide={onHideAddToPlanModal}
                onBackdropPress={onHideAddToPlanModal}
            >
                <ScrollView style={{flex: 1}}>
                    <Text type='caption' style={s.modalText}>{t('Add recipe to weekly plan')}</Text>

                    <Text style={s.modalText}>{t('Plan date')}</Text>
                    <Button
                        text={dateToDisplay(planDate, i18n.language)}
                        onPress={() => setOpenDatePicker(true)}
                        preIcon={require('@/assets/icons/edit-white.png')}
                        style={{ marginBottom: 16, gap: 10 }}
                    />
                    <DatePicker
                        modal
                        date={planDate}
                        open={openDatePicker}
                        mode='date'
                        minimumDate={new Date()}
                        maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                        onConfirm={(date: Date) => {
                            setPlanError('')
                            setPlanDate(date)
                            setOpenDatePicker(false)
                        }}
                        onCancel={() => setOpenDatePicker(false)}
                    />

                    {Object.keys(weeklyColors).map((key, index) => (
                        <Button
                            key={index}
                            text={t(key)}
                            onPress={() => {
                                setPlanError('')
                                setPlanType(key as 'breakfast' | 'lunch' | 'dinner' | 'snack')
                            }}
                            style={{
                                backgroundColor: weeklyColors[key as keyof typeof weeklyColors] + (planType === key ? 'cc' : '30'),
                                marginVertical: '1.7%',
                            }}
                            textStyle={{
                                color: planType === key ? Colors.black : weeklyColors[key as keyof typeof weeklyColors],
                                textTransform: 'capitalize',
                            }}
                        />
                    ))}

                    {planError !== '' ? <Text type="error" style={s.modalText}>{planError}</Text> : null}

                    <View style={s.modalButtons}>
                        <Pressable>
                            <Text type="link" onPress={onHideAddToPlanModal}>{t('Cancel')}</Text>
                        </Pressable>
                        <Button
                            text={t('Save')}
                            disabled={!planDate || !planType}
                            onPress={onSaveRecipeToWeeklyPlan}
                            isWide={false}
                            style={{ paddingHorizontal: 30 }}
                        />
                    </View>
                </ScrollView>
            </Modal> }

            {showSeeCalendarModal && <Modal
                isVisible={showSeeCalendarModal}
                style={[theme.modal, s.modalView, {backgroundColor: getBgColor(), marginTop: height * 0.80}]}
                onModalHide={onHideSeeCalendarModal}
                onBackdropPress={onHideSeeCalendarModal}
            >
                <View>
                    <Button
                        text={t('See calendar')}
                        onPress={() => {
                            onHideSeeCalendarModal()
                            router.push('/(pages)/weekly-plan')
                        }}
                        isWide={true}
                        size='large'
                        preIcon={require('@/assets/icons/calendar-white.png')}
                        style={{ marginVertical: 16, gap: 10 }}
                        textStyle={{ fontSize: 18}}
                    />
                </View>
            </Modal> }

            { displayFolders && <SavedRecipe
                isVisible={displayFolders}
                recipeId={recipe.id}
                onHide={() => setDisplayFolders(false)}
                inFolders={recipe.folders}
                onUpdateFolders={(folders: IFolder[]) => setRecipe({...recipe, folders})}
            /> }

            <View style={theme.statusBarHeight} />

            {/* Dark Header */}
            <Header
                title={t('Recipe Details')}
                onBack={() => router.back()}
                rightIconSource={require('@/assets/icons/share.png')}
                onRightPress={onShare}
            />

            <ScrollView style={s.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Main Image Section */}
                <View style={s.imageSection}>
                                <Image
                        source={titleImageUrl ? { uri: titleImageUrl } : require('@/assets/images/icon.png')} 
                        style={s.mainImage} 
                    />
                    
                    {/* Bottom Gradient Overlay */}
                    <LinearGradient
                        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)"]}
                        locations={[0, 1]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={s.bottomGradient}
                    />
                    
                    {/* Action Buttons - Top Right */}
                    <View style={s.actionButtons}>
                        <Pressable style={s.actionButton} onPress={toggleLikeRecipe}>
                            <Image
                                source={isLiked
                                    ? require('@/assets/icons/liked.png')
                                    : require('@/assets/icons/like.png')
                                }
                                style={s.actionButtonIcon}
                            />
                        </Pressable>
                        <Pressable style={s.actionButton} onPress={() => toggleSaveRecipe()}>
                            <Image
                                source={isSaved
                                    ? require('@/assets/icons/ribbon-filled.png')
                                    : require('@/assets/icons/ribbon.png')
                                }
                                style={s.actionButtonIcon}
                            />
                        </Pressable>
                </View>

                    {/* Thumbnail Gallery - Left Center */}
                    <View style={s.thumbnailGallery}>
                        {recipe.medias.slice(0, 4).map((media, index) => {
                            if (media.type !== MediaType.IMAGE) return null
                            return (
                                <Pressable key={index} onPress={() => {
                                    setTitleImageUrl(media.url)
                                    setSelectedThumbnailIndex(index)
                                }}>
                                    <Image 
                                        source={{ uri: media.url }} 
                                        style={[
                                            s.thumbnailImage,
                                            selectedThumbnailIndex === index && s.thumbnailImageActive
                                        ]} 
                                    />
                        </Pressable>
                            )
                        })}
                    </View>

                    {/* Pagination Dots */}
                    <View style={s.paginationDots}>
                        {recipe.medias.filter(media => media.type === MediaType.IMAGE).slice(0, 4).map((media, index) => (
                        <Pressable
                            key={index}
                                onPress={() => {
                                    setTitleImageUrl(media.url)
                                    setSelectedThumbnailIndex(index)
                                }}
                            >
                                <View 
                                    style={[
                                        s.dot, 
                                        index === selectedThumbnailIndex ? s.dotActive : s.dotInactive
                                    ]} 
                                />
                        </Pressable>
                    ))}
                    </View>
                </View>

                {/* Recipe Tags */}
                <View style={s.tagsContainer}>
                    {recipe.categories.slice(0, 3).map((category, index) => (
                        <View key={index} style={s.tag}>
                            <Text style={s.tagText}>{category.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Usage Count */}
                <View style={s.usageContainer}>
                    <Image source={require('@/assets/icons/fire-akar.png')} style={s.usageIcon} />
                    <Text style={s.usageText}>{t('This recipe has been used 23 times')}</Text>
                </View>

                {/* Author & Rating */}
                <View style={s.authorContainer}>
                    <View style={s.authorInfo}>
                        <Text style={s.byText}>{t('By')}:</Text>
                        <Image source={require('@/assets/icons/person-round.png')} style={s.userIcon} />
                        <Text style={s.authorText}>{recipe.userFullname}</Text>
                    </View>
                    <Text>|</Text>
                    <View style={s.ratingContainer}>
                        <View style={s.starsContainer}>
                            {Array.from({length: 5}, (_, index) => (
                                <Image
                                    key={index}
                                    source={
                                        index < Math.floor(recipe.avgRating || 0)
                                            ? require('@/assets/icons/star-fill-78.png')
                                            : require('@/assets/icons/star-grey-78.png')
                                    }
                                    style={s.starIcon}
                                />
                            ))}
                        </View>
                        <Text style={s.ratingText}>{recipe.avgRating || 0}/5</Text>
                    </View>
                </View>

                {/* Recipe Title */}
                <Text style={s.recipeTitle}>{recipe.title}</Text>

                {/* Recipe Description */}
                {recipe.description && (
                    <Text style={s.recipeDescription}>{recipe.description}</Text>
                )}

                {/* Key Metrics */}
                <View style={s.metricsContainer}>
                    <View style={s.metricItem}>
                        <Image source={require('@/assets/icons/clock.png')} style={s.metricIcon} />
                        <Text style={s.metricValue}>{recipe.timeCooking || 25}</Text>
                        <Text style={s.metricLabel}>Min</Text>
                    </View>
                    <View style={s.verticalLine} />
                    <View style={s.metricItem}>
                        <Image source={require('@/assets/icons/star.png')} style={s.metricIcon} />
                        <Text style={s.metricValue}>{t('Easy')}</Text>
                        <Text style={s.metricLabel}>{t('Level')}</Text>
                    </View>
                    <View style={s.verticalLine} />
                    <View style={s.metricItem}>
                        <Image source={require('@/assets/icons/fire-akar.png')} style={s.metricIcon} />
                        <Text style={s.metricValue}>{recipe.calories || 244}</Text>
                        <Text style={s.metricLabel}>Cal</Text>
                    </View>
                    <View style={s.verticalLine} />
                    <View style={s.metricItem}>
                        <Image source={require('@/assets/icons/cart.png')} style={s.metricIcon} />
                        <Text style={s.metricValue}>{recipe.ingredients?.length || 5}</Text>
                        <Text style={s.metricLabel}>{t('Ingredients')}</Text>
                    </View>
                </View>

                {/* Ingredients and Instructions Tabs */}
                <View style={s.tabsContainer}>
                    <View style={s.tabContent}>
                        {activeTab === 0 ? (
                            <View style={s.ingredientsSection}>
                                <Text style={s.sectionTitle}>{t('Ingredients for the recipe')}</Text>
                                
                                {/* Portion Selector */}
                                <View style={s.portionSelector}>
                                    <Pressable style={s.portionButton} onPress={() => setActualPortions(Math.max(1, actualPortions - 1))}>
                                        <Text style={s.portionButtonText}>-</Text>
                                    </Pressable>
                                    <View style={s.portionContainer}>
                                        <Text style={s.portionText}>{actualPortions} {t('portions')}</Text>
                                    </View>
                                    <Pressable style={s.portionButton} onPress={() => setActualPortions(actualPortions + 1)}>
                                        <Text style={s.portionButtonText}>+</Text>
                                    </Pressable>
                                </View>

                                {/* Ingredients List */}
                                <View style={s.ingredientsList}>
                                    {recipe.ingredients?.slice(0, 4).map((ingredient, index) => (
                                        <View key={index} style={s.ingredientCard}>
                                            <Pressable onPress={() => router.push({ pathname: '/(pages)/ingredient', params: { id: ingredient.ingredientId } })}>
                                                <Image
                                                    source={{ uri: ingredient.category?.photo || ingredient.category?.thumb || 'https://via.placeholder.com/50' }} 
                                                    style={s.ingredientImage} 
                                                />
                                            </Pressable>
                                            <Pressable style={s.ingredientInfo} onPress={() => router.push({ pathname: '/(pages)/ingredient', params: { id: ingredient.ingredientId } })}>
                                                <Text style={s.ingredientName}>{ingredient.ingredientTitle || ingredient.title}</Text>
                                                <Text style={s.ingredientAmount}>{ingredient.cnt} {ingredient.measureTitle}</Text>
                                            </Pressable>
                                            <Pressable style={[s.ingredientAddButton, index === 1 && s.ingredientAddedButton]}>
                                                <Text style={[s.addButtonText, index === 1 && s.addedButtonText]}>
                                                    {index === 1 ? t('Added') : t('Add')}
                                                </Text>
                                                <Image 
                                                    source={index === 1 ? require('@/assets/icons/checkmark.png') : require('@/assets/icons/shopping-bag.png')} 
                                                    style={[s.addButtonIcon, index === 1 && s.addedButtonIcon]} 
                                                />
                                            </Pressable>    
                                            <Pressable onPress={() => router.push({ pathname: '/(pages)/ingredient', params: { id: ingredient.ingredientId } })}>
                                                <Image source={require('@/assets/icons/chevron-right-neutral-grey.png')} style={s.navigationArrow} />
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={s.instructionsSection}>
                                <Instructions steps={recipe.cookingSteps} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={s.mainActionButtons}>
                    <Button
                        text={t('Start cooking')}
                        onPress={redirectToRecipeCooking}
                        style={s.cookButton}
                        textStyle={s.cookButtonText}
                        size="small"
                        postIcon={require('@/assets/icons/next-2.png')}
                    />
                    <Button
                        text={t('Add to weekly plan')}
                        onPress={() => setShowAddToPlanModal(true)}
                        style={s.planButton}
                        textStyle={s.planButtonText}
                        size="medium"
                        postIcon={require('@/assets/icons/calendar-2.png')}
                    />
                </View>

                {/* Premium Subscription Card */}
                {!user?.isPremium && (
                    <ImageBackground 
                        source={require('@/assets/images/premium-illustration.png')} 
                        style={s.premiumCard}
                        imageStyle={s.premiumBackgroundImage}
                    >
                        <Image source={require('@/assets/icons/premium.png')} style={s.premiumIcon} />
                        <Text style={s.premiumTitle}>{t('Subscribe to Premium!')}</Text>
                        <Text style={s.premiumDescription}>
                            {t('Subscribe to view nutritional values and macronutrients for each recipe, adjust quantities and macronutrients, and enjoy an ad-free experience.')}
                        </Text>
                    </ImageBackground>
                )}

                {/* Nutritional Values Component */}
                <View style={s.section}>
                    <NutritionalValues 
                        isPremium={true}
                        recipe={recipe}
                        nutrientsInit={recipe?.nutrients}
                        setRecipe={setRecipe}
                        onSaveLocal={onSaveLocal}
                    />
                </View>

                {/* Recipes of the Month Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Recipes of the month')}</Text>
                        <Pressable>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    {recipesOfMonth.length === 0 ? (
                        <View style={s.emptyState}>
                            <Text style={s.emptyStateText}>
                                {user?.token ? t('Loading recipes...') : t('Please sign in to see recipes')}
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
                                    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 36))
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

                {/* Categories */}
                <View style={s.categoriesSection}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Categories')}</Text>
                        <Pressable>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    <Categories style={s.categoriesContainer} />
                </View>

                {/* Comments Section */}
                {/* <View style={s.commentsSection}>
                    <Text style={s.sectionTitle}>{t('Comments')}</Text>
                    {sortedComments.map(comment => (
                        <Comment key={comment.id} comment={comment} />
                    ))}
                    {showingCommentBox
                        ? <CommentBox
                            recipeId={recipe.id}
                            onSuccess={onPostComment}
                            onCancel={() => setShowingCommentBox(false)}
                        />
                        : <Pressable onPress={() => setShowingCommentBox(true)}>
                            <Text style={s.writeCommentText}>{t('Write a comment...')}</Text>
                        </Pressable>
                    }
                </View> */}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    // Container
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: getBgColor(),
    },

    // Dark Header (from my-space.tsx)
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
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
    },
    addIcon: {
        width: 26,
        height: 26,
        tintColor: Colors.white,
    },

    // Main Image Section
    imageSection: {
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: 357,
        resizeMode: 'cover',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    thumbnailGallery: {
        position: 'absolute',
        left: 24,
        top: '50%',
        transform: [{ translateY: -100 }], // Center vertically (half of total height)
        flexDirection: 'column',
        gap: 8,
        backgroundColor: 'transparent',
    },
    thumbnailImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    thumbnailImageActive: {
        opacity: 0.4,
        borderColor: '#C28040',
    },
    actionButtons: {
        position: 'absolute',
        right: 24,
        top: 20,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'transparent',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonIcon: {
        width: 20,
        height: 20,
    },
    paginationDots: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 'transparent',
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

    // Tags
    tagsContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 24,
        paddingTop: 19,
        paddingBottom: 16,
        backgroundColor: Colors.white,
    },
    tag: {
        width: 110,
        height: 32,
        borderRadius: 18,
        backgroundColor: '#F6ECE2',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 16, // 100% of font size
        color: '#C28040',
    },

    // Usage Count
    usageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 6,
    },
    usageIcon: {
        width: 16,
        height: 16,
    },
    usageText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20, // 100% of font size
        color: "#C28040",
    },

    // Author & Rating
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 6,
        backgroundColor: Colors.white,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.white,
    },
    byText: {
        
    },
    userIcon: {
        width: 16,
        height: 16,
        tintColor: Colors.grey,
    },
    authorText: {
        color: Colors.grey,
        fontSize: 14,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    starIcon: {
        width: 16,
        height: 16,
    },
    ratingText: {
        color: Colors.grey,
        fontSize: 14,
        fontWeight: '500',
    },

    // Recipe Title
    recipeTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        lineHeight: 25, // 100% of font size
        color: '#000000',
        paddingHorizontal: 20,
        paddingBottom: 8,
        backgroundColor: Colors.white,
    },

    // Recipe Description
    recipeDescription: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 22,
        color: '#6C7278',
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: Colors.white,
    },

    // Key Metrics
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    metricItem: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    verticalLine: {
        width: 1,
        height: 75,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    metricIcon: {
        width: 15,
        height: 15,
        marginBottom: 2,
        tintColor: '#4F4240',
    },
    metricValue: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22, // 100% of font size
        textAlign: 'center',
        color: Colors.black,
    },
    metricLabel: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18, // 100% of font size
        textAlign: 'center',
        color: '#6C7278',
    },

    // Tabs
    tabsContainer: {
        paddingTop: 19,
        paddingBottom: 32,
        backgroundColor: getBgColor(),
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    tabsHeader: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginHorizontal: 20,
        padding: 4,
        minHeight: 50,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.mainColor,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
    activeTabText: {
        color: Colors.white,
    },
    inactiveTabText: {
        color: Colors.grey,
    },
    tabContent: {
        paddingHorizontal: 20,
        backgroundColor: getBgColor(),
    },

    // Ingredients Section
    ingredientsSection: {
        marginBottom: 0,
        backgroundColor: getBgColor(),
    },
    instructionsSection: {
        marginBottom: 0,
        backgroundColor: getBgColor(),
    },
    portionSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginVertical: 20,
        backgroundColor: getBgColor(),
    },
    portionButton: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#F6ECE2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    portionButtonText: {
        color: '#C28040',
        fontSize: 19,
        lineHeight: 22,
        fontWeight: 'bold',
    },
    portionText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
        color: '#1B1A1D',
        textAlign: 'center',
    },
    portionContainer: {
        width: 117,
        height: 40,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    ingredientsList: {
        gap: 12,
        backgroundColor: getBgColor(),
    },
    ingredientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 8,
    },
    ingredientImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    ingredientInfo: {
        flex: 1,
        marginLeft: 4,
    },
    ingredientName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#1B1A1D',
        marginBottom: 4,
    },
    ingredientAmount: {
        fontFamily: 'Poppins',
        fontSize: 14,
        color: '#6C7278',
    },
    ingredientAddButton: {
        height: 34,
        borderRadius: 18,
        gap: 10,
        borderWidth: 1,
        padding: 10,
        borderColor: '#EFF0F6',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginRight: 8,
    },
    addButtonText: {
        fontFamily: 'Poppins',
        fontSize: 14,
        lineHeight: 16, // 100% of font size
        color: '#6C7278',
    },
    addButtonIcon: {
        width: 18,
        height: 18,
        tintColor: '#6C7278',
    },
    ingredientAddedButton: {
        backgroundColor: '#F6ECE2',
        borderColor: '#F6ECE2',
    },
    addedButtonText: {
        color: '#C28040',
    },
    addedButtonIcon: {
        tintColor: '#C28040',
    },
    navigationArrow: {
        width: 9,
        height: 17,
        tintColor: '#C28040',
    },

    // Main Action Buttons
    mainActionButtons: {
        paddingHorizontal: 50,
        gap: 12,
        marginBottom: 32,
        backgroundColor: getBgColor(),
    },
    cookButton: {
        backgroundColor: '#C28040',
        borderRadius: 12,
        height: 53,
    },
    cookButtonText: {
        color: Colors.white,
        fontSize: 16,
        lineHeight: 18,
        paddingRight: 11,
    },
    planButton: {
        backgroundColor: '#C28040',
        borderRadius: 12,
        height: 53,
    },
    planButtonText: {
        color: Colors.white,
        fontSize: 16,
        lineHeight: 18,
        paddingRight: 11,
    },

    // Premium Card
    premiumCard: {
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingBottom: 24,
        marginHorizontal: 24,
        marginBottom: 32,
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 200,
        justifyContent: 'center',
    },
    premiumBackgroundImage: {
        borderRadius: 16,
        resizeMode: 'cover',
    },
    premiumIcon: {
        width: 143,
        height: 95,
    },
    premiumTitle: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 22, // 100% of font size
        textAlign: 'center',
        color: Colors.white,
        marginBottom: 12,
    },
    premiumDescription: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18, // 100% of font size
        textAlign: 'center',
        color: Colors.white,
    },

    // Section Styles (from Home Page)
    section: {
        paddingHorizontal: 24,
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
    },
    seeAllText: {
        fontSize: 14,
        color: Colors.mainColor,
        fontWeight: '500',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.grey,
        textAlign: 'center',
    },
    recipesList: {},
    slidePaginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
        backgroundColor: getBgColor(),
    },
    slideDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoriesSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
        backgroundColor: getBgColor(),
    },
    categoriesContainer: {
        marginTop: 16,
        backgroundColor: getBgColor(),
    },
    modalView: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 20,
        margin: 20,
    },
    modalText: {
        fontSize: 16,
        color: Colors.black,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
})