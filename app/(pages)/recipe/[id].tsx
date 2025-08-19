import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Image, Pressable, Share, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter, useGlobalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import Modal from 'react-native-modal'
import DatePicker from 'react-native-date-picker'
// import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { BackButton, Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import SavedRecipe from '@/components/modals/SavedRecipe'
import CommentBox from '@/components/CommentBox'
import Comment from '@/components/Comment'
import Ingredients from '@/components/Ingredients'
import Instructions from '@/components/Instructions'
import RecipeOfMonth from '@/components/RecipeOfMonth'
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

    const [activeTab, setActiveTab] = useState<number>(0)
    const tabsRef = useRef<FlatList<string>>(null)

    const getProfileUrl = useCallback(() => {
        return recipe?.userId === user?.id ? '/(tabs)/profile' : '/(pages)/profile'
    }, [recipe, user])
    const getProfileImg = useCallback(() => {
        return recipe?.userProfileImageThumb ? {uri: recipe.userProfileImageThumb} : require('@/assets/images/icon.png')
    }, [recipe])

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
                const recipes4Cards: IRecipeCard[] = recs.map((r: IRecipe) => {
                    const image = r.medias.find(media => media.type == MediaType.IMAGE)
                    return { id: r.id, title: r.title, image: image?.url || '', profileName: r.userFullname }
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
        <View style={theme.container}>
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

            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                { displayFolders && <SavedRecipe
                    isVisible={displayFolders}
                    recipeId={recipe.id}
                    onHide={() => setDisplayFolders(false)}
                    inFolders={recipe.folders}
                    onUpdateFolders={(folders: IFolder[]) => setRecipe({...recipe, folders})}
                /> }
                <View style={s.titleImageWrapper}>
                    <Image source={titleImageUrl ? { uri: titleImageUrl } : require('@/assets/images/icon.png')} style={s.titleImage} />
                    <BackButton />

                    <View style={s.gallery}>
                        {recipe.medias.map((media, index) => {
                            if (media.type != MediaType.IMAGE || media.url === titleImageUrl) {
                                return null
                            }
                            return (<Pressable key={index} onPress={() => setTitleImageUrl(media.url)}>
                                <Image
                                    source={{ uri: media.url }}
                                    style={s.galleryImage}
                                />
                            </Pressable>)
                        })}
                    </View>
                </View>

                {/* Badges */}
                <Badges recipe={recipe} />

                {/* Title and buttons */}
                <View style={s.titleWrapper}>
                    <Text type="subtitle" style={s.title}>{recipe.title}</Text>
                    <View style={s.titleButtons}>
                        <Pressable style={s.titleButton} onPress={onShare}>
                            <Image
                                source={isLight() ? require('@/assets/icons/share-dark.png') : require('@/assets/icons/share.png')}
                                style={s.titleButtonImg}
                            />
                        </Pressable>
                        <Pressable style={s.titleButton} onPress={toggleLikeRecipe}>
                            <Image
                                source={isLiked
                                    ? require('@/assets/icons/liked.png')
                                    : (isLight() ? require('@/assets/icons/like-dark.png') : require('@/assets/icons/like.png'))
                                }
                                style={s.titleButtonImg}
                            />
                        </Pressable>
                        <Pressable style={s.titleButton} onPress={() => toggleSaveRecipe()}>
                            <Image
                                source={isSaved
                                    ? require('@/assets/icons/ribbon-filled.png')
                                    : (isLight() ? require('@/assets/icons/ribbon-dark.png') : require('@/assets/icons/ribbon.png'))
                                }
                                style={s.titleButtonImg}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Folders */}
                {isSaved && <View style={s.recipeFolders}>
                    <Button
                        text={t('Edit')}
                        preIcon={require('@/assets/icons/folder-white.png')}
                        onPress={() => setDisplayFolders(true)}
                        isWide={false}
                        size='small'
                        style={s.recipeFolderButton}
                        textStyle={{ fontSize: 12, paddingLeft: 6 }}
                    />
                    {recipe.folders.map((folder, index) => (
                        <Pressable
                            key={index}
                            style={s.recipeFolder}
                            onPress={() => router.push({ pathname: '/(pages)/feed', params: { filterFolder: folder.id, title: folder.title } })}
                        >
                            <Text style={s.recipeFolderText}>{folder.title}</Text>
                        </Pressable>
                    ))}
                </View> }

                {/* Categories */}
                <View style={s.recipeCategories}>
                    {recipe.categories.map((category, index) => (
                        <Pressable
                            key={index}
                            style={s.recipeCategory}
                            onPress={() => router.push({
                                pathname: '/(pages)/feed',
                                params: { filterCategories: category.id, title: category.title } })}
                        >
                            <Text style={s.recipeCategoryText}>{category.title}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Details */}
                <View style={s.recipeDetails}>
                    { recipe.avgRating ? <View style={s.recipeDetail}>
                        <Image source={require('@/assets/icons/star.png')} style={s.recipeDetailImg}/>
                        <Text style={s.recipeDetailText}>{recipe.avgRating}</Text>
                    </View> : null }
                    { recipe.timeCooking ? <View style={s.recipeDetail}>
                        <Image source={require('@/assets/icons/clock.png')} style={s.recipeDetailImg}/>
                        <Text style={s.recipeDetailText}>{timeFromMinutes(recipe.timeCooking)}</Text>
                    </View> : null }
                    { recipe.calories ? <View style={s.recipeDetail}>
                        <Image source={require('@/assets/icons/fire-akar.png')} style={s.recipeDetailImg}/>
                        <Text style={s.recipeDetailText}>{recipe.calories} {t('cal')}</Text>
                    </View> : null }
                    { recipe.ingredients ? <View style={s.recipeDetail}>
                        <Image source={require('@/assets/icons/cart.png')} style={s.recipeDetailImg}/>
                        <Text style={s.recipeDetailText}>{recipe.ingredients.length} {t('Ingredients')}</Text>
                    </View> : null }
                </View>

                {/* Description */}
                { recipe.description ? <View style={s.recipeDescription}>
                    <Text type="caption">{t('Description')}</Text>
                    <Text style={[s.recipeDescriptionText, {color: isLight() ? Colors.grey : Colors.lightGrey }]}>{recipe.description}</Text>
                </View> : null }

                {/* Recipe info */}
                <View style={s.recipeInfo}>
                    <View style={s.recipeInfoItem}>
                        <Text type='caption'>{t('Created by')}</Text>
                        <Pressable style={s.recipeInfoItemUser} onPress={() => recipe.userId && router.push({ pathname: getProfileUrl(), params: { userId: recipe.userId } })}>
                            <Image source={getProfileImg()} style={s.recipeInfoItemImg}/>
                            <Text type='link'>{recipe.userFullname}</Text>
                        </Pressable>
                    </View>
                    <View style={s.recipeInfoItem}>
                        <Text type='caption'>{t('Recipe used')}</Text>
                        <Text type='link'>{t('{{count}} times', {count: 23})}</Text>
                    </View>
                </View>

                {/* Nutritional values */}
                <NutritionalValues
                    isPremium={user?.isPremium || false}
                    recipe={recipe}
                    setRecipe={setRecipe}
                    onSaveLocal={onSaveLocal}
                />

                {/* Ingredients and instructions */}
                <View style={theme.tabs}>
                    <Pressable style={[theme.tabCaptionWrapper, activeTab === 0 ? theme.activeTab : {}]} onPress={() => setActiveTab(0)}>
                        <Text style={[theme.tabCaption, { color: activeTab === 0 ? Colors.mainColor : greyTextColor }]}>{t('Ingredients')}</Text>
                    </Pressable>
                    <Pressable style={[theme.tabCaptionWrapper, activeTab === 1 ? theme.activeTab : {}]} onPress={() => setActiveTab(1)}>
                        <Text style={[theme.tabCaption, { color: activeTab === 1 ? Colors.mainColor : greyTextColor }]}>{t('Instructions')}</Text>
                    </Pressable>
                </View>
                <View>
                    <FlatList
                        ref={tabsRef}
                        data={['ingredients', 'instructions']}
                        renderItem={renderTab}
                        initialScrollIndex={activeTab}
                        horizontal
                        style={theme.tabsFlatList}
                        pagingEnabled
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Rate recipe */}
                <View style={s.rateRecipe}>
                    <Text type="caption" style={{ marginBottom: 12 }}>{t('Rate recipe')}</Text>
                    <View style={theme.rateRecipeStars}>
                        {Array.from({length: 5}, (_, index) => (
                            <Pressable key={index} onPress={() => setRate(index + 1)}>
                                <Image
                                    source={
                                        recipe.userRating && recipe.userRating >= index + 1
                                            ? require('@/assets/icons/star-fill-78.png')
                                            : isLight()
                                                ? require('@/assets/icons/star-grey-78.png')
                                                : require('@/assets/icons/star-78.png')}
                                    style={theme.rateRecipeStar}
                                />
                            </Pressable>    
                        ))}
                    </View>
                </View>

                {/* Start recipe */}
                <View style={s.startRecipeButtons}>
                    <Button
                        preIcon={require('@/assets/icons/calendar.png')}
                        onPress={() => setShowAddToPlanModal(true)}
                        isWide={false}
                        style={s.calendarButton}
                    />
                    <Button
                        text={t('Start recipe')}
                        onPress={redirectToRecipeCooking}
                        isWide={false}
                        size='small'
                        preIcon={require('@/assets/icons/video-triangle.png')}
                        style={s.startRecipeButton}
                        textStyle={theme.bold}
                    />
                </View>

                {/* Comments */}
                <Text type="caption" style={{ marginTop: 20, marginBottom: 6 }}>{t('Comments')}</Text>
                <View style={{ marginBottom: 12 }}>
                    {/* comments from feed */}
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
                            <Text type='link' style={theme.bold}>{t('Write a comment...')}</Text>
                        </Pressable>
                    }

                </View>

                {/* Recipes of the month */}
                <Text type="caption" style={{ marginTop: 20, marginBottom: 6 }}>{t('Recipes of the month')}</Text>
                <ScrollView horizontal style={{ marginBottom: 12 }}>
                    {recipesOfMonth.map(recipe => (
                        <RecipeOfMonth key={recipe.id} recipe={recipe} />
                    ))}
                </ScrollView>

                {/* Categories */}
                <Categories />
                
                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    modalView: {
        justifyContent: 'flex-start',
        paddingTop: 16,
    },
    modalText: {
        textAlign: 'center',
        marginVertical: 12,
    },
    datePicker: {
        justifyContent: 'flex-start',
        gap: 20,
    },
    modalError: {
        color: Colors.mainColor,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: '2%',
    },
    titleImageWrapper: {
        position: 'relative',
        marginBottom: 8,
    },
    titleImage: {
        width: '100%',
        height: 328,
        marginBottom: 12,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    backButton: {
        position: 'absolute',
        top: 18,
        left: 18,
    },
    gallery: {
        position: 'absolute',
        bottom: 32,
        left: 14,
        flexDirection: 'row',
        gap: 8,
        backgroundColor: 'transparent',
    },
    galleryImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    titleWrapper: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 8,
    },
    title: {
        flex: 1,
    },
    titleButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    titleButton: {
        width: 35,
        height: 35,
        borderRadius: 10,
        borderColor: '#d9d9d9',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleButtonImg: {
        width: 16,
        height: 16,
    },
    recipeFolders: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    recipeFolder: {
        backgroundColor: Colors.purple + '30',
        borderRadius: 6,
        paddingHorizontal: 8,
    },
    recipeFolderText: {
        color: Colors.purple,
        fontSize: 12,
    },
    recipeFolderButton: {
        paddingHorizontal: 8,
        paddingVertical: 0,
        height: 22,
    },
    recipeCategories: {
        flexDirection: 'row',
        gap: 8,
    },
    recipeCategory: {
        backgroundColor: Colors.mainColorLight,
        borderRadius: 6,
        paddingHorizontal: 8,
    },
    recipeCategoryText: {
        color: Colors.mainColor,
        fontSize: 12,
    },
    recipeDetails: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 16,
    },
    recipeDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recipeDetailImg: {
        width: 14,
        height: 14,
    },
    recipeDetailText: {
        fontSize: 12,
    },
    recipeDescription: {
        marginTop: 20,
    },
    recipeDescriptionText: {
        fontSize: 14,
        marginTop: 6,
    },
    recipeInfo: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    recipeInfoItem: {
        minWidth: 120,
    },
    recipeInfoItemUser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    recipeInfoItemImg: {
        width: 21,
        height: 21,
        borderRadius: 100,
    },
    rateRecipe: {
        marginTop: 20,
    },
    startRecipeButtons: {
        marginTop: 26,
        marginBottom: 20,
        flex: 1,
        flexDirection: 'row',
        gap: 14,
    },
    calendarButton: {
        backgroundColor: Colors.mainColorLight,
        width: 50,
        height: 50,
    },
    startRecipeButton: {
        flex: 1,
        height: 50,
        gap: 10,
    },
})