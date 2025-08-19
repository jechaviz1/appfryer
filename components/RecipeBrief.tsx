import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { Dimensions, FlatList, Image, Pressable, Share, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Lines, Text, VideoPlayer, View } from '@/components/base/BaseComponents'
import Badges from '@/components/Badges'
import SavedRecipe from '@/components/modals/SavedRecipe'
import CommentBox from '@/components/CommentBox'
import Comment from '@/components/Comment'
import { useAuth } from '@/contexts/authContext'
import { timeFromMinutes, timeSince } from '@/services/datetime'
import IComment from '@/interfaces/Comment'
import IRecipe from '@/interfaces/Recipe'
import IMedia, { MediaType } from '@/interfaces/Media'
import IFolder from '@/interfaces/Folder'
import { Colors } from '@/constants/Colors'
import { isLight, paddings } from '@/constants/Theme'
import { post } from '@/services/apiRequests'

interface Props {
    recipe: IRecipe,
    toggleFollowing: (userId: number, isFollowing: boolean) => void
    onUpdateFolders: (folders: IFolder[]) => void
    onUnsave: () => void
}

export default function RecipeBrief({ recipe, toggleFollowing, onUpdateFolders, onUnsave }: Props) {
    const router = useRouter()

    const { user } = useAuth()
    const { t } = useTranslation()

    const [isFollowing, setIsFollowing] = useState<boolean | null | undefined>(recipe.userIsFollowing)
    const [isLiked, setIsLiked] = useState<boolean>(recipe.isLiked)
    const [disableLikeAction, setDisableLikeAction] = useState<boolean>(false)
    const [cntLikes, setCntLikes] = useState<number>(recipe.cntLikes)
    const [isSaved, setIsSaved] = useState<boolean>(recipe.isSaved)
    const [disableSaveAction, setDisableSaveAction] = useState<boolean>(false)
    const [displayFolders, setDisplayFolders] = useState<boolean>(false)
    const [showingCommentBox, setShowingCommentBox] = useState<boolean>(false)
    const [postedComments, setPostedComments] = useState<IComment[]>([])
    const [activeTab, setActiveTab] = useState<number>(0)

    const [window] = useState(Dimensions.get('window'))

    useEffect(() => {
        setIsLiked(recipe.isLiked)
        setIsFollowing(recipe.userIsFollowing)
        setIsSaved(recipe.isSaved)
    }, [recipe])

    const getProfileUrl = useCallback(() => {
        return recipe.userId === user?.id ? '/(tabs)/profile' : '/(pages)/profile'
    }, [recipe, user])
    const getProfileImg = useCallback(() => {
        return recipe.userProfileImageThumb ? {uri: recipe.userProfileImageThumb} : require('@/assets/images/icon.png')
    }, [recipe])

    const renderMedia = useCallback((slide: { item: IMedia, index: number }) => {
        return (
            <View style={[s.imageContainer, {width: window.width - paddings * 2 }]}>
                {slide.item.type == MediaType.VIDEO && slide.index === activeTab && (
                    <VideoPlayer
                        uri={slide.item.url}
                        style={[s.image]}
                        videoStyle={[s.videoStyle]}
                        isRendered={activeTab === slide.index}
                    />
                )}
                {slide.item.type == MediaType.IMAGE && (
                    <Pressable onPress={() => router.push({
                        pathname: `/(pages)/recipe/${recipe.id}` as "(pages)/recipe/[:id]",
                        // params: { id: `${recipe.id}`}
                    })}>
                        <Image
                            source={{ uri: slide.item.url }}
                            style={s.image}
                        />
                    </Pressable>
                )}
                <View style={s.lines}>
                    <Lines count={recipe.medias.length} current={slide.index} />
                </View>
            </View>
        )
    }, [activeTab])

    const toggleLikeRecipe = useCallback(() => {
        if (disableLikeAction) {
            return
        }
        setDisableLikeAction(true)
        post({
            url: `/recipe/${recipe.id}/${isLiked ? 'unlike' : 'like'}`,
            token: user?.token
        })
            .then((response) => {
                setDisableLikeAction(false)
                setIsLiked(response.isLiked)
                setCntLikes(response.cntLikes)
            })
            .catch(e => console.error(e.response.data))

        // immediately update the state, but after response from server it'll be updated
        setIsLiked(!isLiked)
        setCntLikes(isLiked ? cntLikes - 1 : cntLikes + 1)
    }, [disableLikeAction, isLiked, cntLikes])

    const toggleSaveRecipe = useCallback(() => {
        if (disableSaveAction) {
            return
        }
        setDisableSaveAction(true)
        post({
            url: `/recipe/${recipe.id}/${isSaved ? 'unsave' : 'save'}`,
            token: user?.token
        })
            .then((response) => {
                setIsSaved(response.isSaved)
                response.isSaved
                    ? setDisplayFolders(true)
                    : onUnsave()
                setDisableSaveAction(false)
            })
            .catch(e => console.error(e.response.data))
    }, [disableSaveAction, isSaved])

    const onShare = useCallback(() => {
        Share.share({
            message: t('Check out this recipe!') + ' ' + process.env.EXPO_PUBLIC_URL + (`/recipe/${recipe.id}`),
            title: recipe.title,
        })
    }, [])

    const onPostComment = useCallback((comment: IComment) => {
        setPostedComments([comment, ...postedComments])
        setShowingCommentBox(false)
    }, [postedComments])

    return (
        <View style={s.container}>
            {displayFolders && <SavedRecipe
                isVisible={displayFolders}
                recipeId={recipe.id}
                onHide={() => setDisplayFolders(false)}
                onUpdateFolders={onUpdateFolders}
                inFolders={recipe.folders}
            /> }
            <View style={s.header}>
                <Pressable onPress={() => recipe.userId && router.push({ pathname: getProfileUrl(), params: { userId: recipe.userId } })}>
                    <Image
                        source={getProfileImg()}
                        style={s.profileImg}
                    />
                </Pressable>
                <View>
                    <Pressable
                        style={s.nameDate}
                        onPress={() => router.push({ pathname: '/(pages)/profile', params: { userId: recipe.userId } })}
                    >
                        <Text style={s.profileName}>{recipe.userFullname}</Text>
                        <Text style={{ fontSize: 13 }}> · {timeSince(new Date(recipe.createdAt))}</Text>
                    </Pressable>
                    <View style={s.categories}>
                        {recipe.categories.map((category, index) => (
                            <Pressable
                                key={index}
                                onPress={() => router.push({
                                    pathname: '/(pages)/feed',
                                    params: { filterCategories: category.id, title: category.title }
                                })}
                            >
                                <Text key={index} style={s.categoryName}>{category.title}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <Text style={s.categoryName}>{recipe.categoryName}</Text>
                </View>
                {user?.isRoleCreator === true && isFollowing !== null && isFollowing !== undefined ? <Button
                    text={isFollowing ? t('Unfollow') : t('Follow')}
                    size='small'
                    shape='round'
                    onPress={() => toggleFollowing(recipe.userId, isFollowing ?? false)}
                    isWide={false}
                    style={isFollowing ? s.unfollowButton : s.followButton}
                    textStyle={{ fontSize: 13, color: isFollowing ? Colors.mainColor : Colors.white }}
                /> : null }
            </View>

            <Badges recipe={recipe} />

            <Pressable onPress={() => router.push({
                    pathname: `/(pages)/recipe/${recipe.id}` as "(pages)/recipe/[:id]",
                    // params: { id: `${recipe.id}`}
                })
            }>
                <View>
                    <Text style={s.title}>{recipe.title}</Text>
                    <View style={s.detailsContainer}>
                        <Image source={isLight() ? require('@/assets/icons/clock-grey.png') : require('@/assets/icons/clock.png')} style={s.detailIcon}/>
                        <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{timeFromMinutes(recipe.timeCooking)}</Text>
                        
                        {recipe.avgRating && <Image source={isLight() ? require('@/assets/icons/star-grey.png') : require('@/assets/icons/star.png')} style={s.detailIcon}/>}
                        {recipe.avgRating && <Text style={[s.detailText, {color: isLight() ? Colors.grey: Colors.lightGrey}]}>{recipe.avgRating}</Text>}
                    </View>
                </View>
            </Pressable>

            <FlatList
                data={recipe.medias}
                renderItem={renderMedia}
                initialScrollIndex={0}
                horizontal
                style={{ marginBottom: 10 }}
                pagingEnabled
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                maxToRenderPerBatch={1}
                removeClippedSubviews={true}
                onViewableItemsChanged={( changedItems ) => {
                    const visibleItems = changedItems.viewableItems.filter(item => item.isViewable)
                    visibleItems.length > 0 && setActiveTab(visibleItems[0]?.index || 0)
                }}
            />

            <View style={s.footer}>
                <View style={s.interactionsContainer}>
                    <Pressable onPress={toggleLikeRecipe}>
                        <Image source={isLiked ? require('@/assets/icons/liked.png') : require('@/assets/icons/like.png')} style={s.interactImg}/>
                    </Pressable>
                    <Text style={s.interactText}>{cntLikes}</Text>
                    <Image source={require('@/assets/icons/comment.png')} style={s.interactImg}/>
                    <Text style={s.interactText}>{recipe.cntComments}</Text>
                    <Pressable onPress={() => setShowingCommentBox(true)}>
                        <Text style={s.interactComment}>{t('Comment')}</Text>
                    </Pressable>
                </View>

                <View style={s.savedContainer}>
                    { isSaved && <Pressable onPress={() => setDisplayFolders(true)}>
                        <Image
                            source={require('@/assets/icons/folder.png')}
                            style={s.savedImg}
                        />
                    </Pressable> }
                    <Pressable onPress={toggleSaveRecipe}>
                        <Image
                            source={isSaved ? require('@/assets/icons/ribbon-filled.png') : require('@/assets/icons/ribbon.png')}
                            style={s.savedImg}
                        />
                    </Pressable>
                    <Pressable onPress={onShare}>
                        <Image source={require('@/assets/icons/share.png')} style={s.savedImg}/>
                    </Pressable>
                </View>
            </View>

            <View style={s.commentsContainer}>
                {showingCommentBox && (
                    <CommentBox
                        recipeId={recipe.id}
                        onSuccess={onPostComment}
                        onCancel={() => setShowingCommentBox(false)}
                    />
                )}
                {/* comments posted by user */}
                {postedComments.length > 0 && postedComments.map((comment, index) => (
                    <Comment key={index} comment={comment} />
                ))}
                {/* comments from feed */}
                {recipe.comments?.map((comment, index) => (
                    <Comment key={index} comment={comment} />
                ))}
            </View>
            <View style={s.bottomLine}/>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    nameDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImg: {
        width: 38,
        height: 38,
        borderRadius: 20,
    },
    profileName: {
        fontSize: 13,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
    },
    categories: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryName: {
        color: Colors.mainColor,
        fontSize: 13,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
    },
    unfollowButton: {
        marginLeft: 'auto',
        paddingHorizontal: 11,
        paddingVertical: 4,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.mainColor,
    },
    followButton: {
        marginLeft: 'auto',
        paddingHorizontal: 11,
        paddingVertical: 4,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    detailIcon: {
        width: 14,
        height: 14,
    },
    detailText: {
        fontSize: 13,
        marginEnd: 8,
    },
    title: {
        fontSize: 15,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
        marginBottom: 8,
    },
    imageContainer: {
        marginBottom: 10,
    },
    image: {
        width: '100%',
        overflow: 'hidden',
        aspectRatio: 1,
        borderRadius: 20,
    },
    videoStyle: {
        aspectRatio: 1,
        borderRadius: 20,
    },
    lines: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    interactionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    interactImg: {
        width: 16,
        height: 16,
    },
    interactText: {
        fontSize: 12,
        marginEnd: 16,
    },
    interactComment: {
        fontSize: 13,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
        color: Colors.mainColor,
    },
    savedContainer: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    savedImg: {
        width: 16,
        height: 16,
    },
    commentsContainer: {
        marginTop: 16,
    },
    bottomLine: {
        height: 20,
        width: Dimensions.get('window').width,
        marginHorizontal: -10,
    }
})