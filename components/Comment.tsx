import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import IComment from '@/interfaces/Comment'
import { Text, View } from '@/components/base/BaseComponents'
import CommentBox from '@/components/CommentBox'
import { timeSince } from '@/services/datetime'
import { Colors } from '@/constants/Colors'
import { getBgColor } from '@/constants/Theme'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'

export default function Comment({ comment }: { comment: IComment }) {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useTranslation()
    
    const [offset] = useState<number>(comment.depth < 4 ? comment.depth : 3)
    const [isLiked, setIsLiked] = useState<boolean>(comment.isLiked)
    const [disableLikeAction, setDisableLikeAction] = useState<boolean>(false)
    const [cntLikes, setCntLikes] = useState<number>(comment.cntLikes)
    const [showingCommentBox, setShowingCommentBox] = useState<boolean>(false)
    const [postedComments, setPostedComments] = useState<IComment[]>([])

    const toggleLikeComment = useCallback(() => {
        if (disableLikeAction) {
            return
        }
        setDisableLikeAction(true)
        post({
            url: `/recipe/${comment.recipeId}/comment/${comment.id}/${isLiked ? 'unlike' : 'like'}`,
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
    }, [disableLikeAction, user?.token, isLiked, cntLikes])

    const onPostComment = useCallback((comment: IComment) => {
        setPostedComments([comment, ...postedComments])
        setShowingCommentBox(false)
    }, [comment, postedComments, showingCommentBox])

    const getProfileImg = useCallback(() => {
        return comment.userProfileImageThumb ? { uri: comment.userProfileImageThumb } : require('@/assets/images/icon.png')
    }, [comment.userProfileImageThumb])

    return (
        <View style={[s.container, {marginLeft: 50 * offset}]}>
            <Pressable onPress={() => comment.userId !== null && router.push({ pathname: '/(pages)/profile', params: { userId: comment.userId } })}>
                <Image
                    source={getProfileImg()}
                    style={s.profileImg}
                />
            </Pressable>
            <View style={s.main}>
                <View style={s.nameDate}>
                    <Pressable onPress={() => comment.userId !== null && router.push({ pathname: '/(pages)/profile', params: { userId: comment.userId } })}>
                        <Text style={s.name}>{comment.userFullname}</Text>
                    </Pressable>
                    <Text style={s.date}> · {timeSince(new Date(comment.createdAt))}</Text>
                </View>
                <Text style={s.text}>{comment.text}</Text>
                <View style={s.interactionsContainer}>
                    <Pressable onPress={toggleLikeComment}>
                        <Image source={isLiked ? require('@/assets/icons/liked.png') : require('@/assets/icons/like.png')} style={s.interactImg}/>
                    </Pressable>
                    <Text style={s.interactText}>{cntLikes}</Text>
                    <Image source={require('@/assets/icons/comment.png')} style={s.interactImg}/>
                    <Text style={s.interactText}>{comment.cntReplies}</Text>
                    <Pressable onPress={() => setShowingCommentBox(true)}>
                        <Text style={s.interactAnswer}>{t('Answer')}</Text>
                    </Pressable>

                </View>
                {showingCommentBox && (
                    <CommentBox
                        recipeId={comment.recipeId}
                        commentId={comment.id}
                        onSuccess={onPostComment}
                        onCancel={() => setShowingCommentBox(false)}
                    />
                )}
                {/* replies posted by user */}
                {postedComments.length > 0 && (
                    <View style={s.postedCommentsContainer}>
                        {postedComments.map(comment => (
                            <Comment key={comment.id} comment={comment} />
                        ))}
                    </View>
                )}
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: getBgColor(),
    },
    profileImg: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    main: {
        flex: 1,
        backgroundColor: getBgColor(),
    },
    nameDate: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: getBgColor(),
    },
    name: {
        fontSize: 13,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
    },
    date: {
        fontSize: 13,
    },
    text: {
        fontSize: 13,
        lineHeight: 20,
    },
    interactionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: getBgColor(),
    },
    interactImg: {
        width: 16,
        height: 16,
    },
    interactText: {
        fontSize: 12,
        marginEnd: 16,
    },
    interactAnswer: {
        fontSize: 13,
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
        color: Colors.mainColor,
    },
    postedCommentsContainer: {
        marginTop: 10,
        gap: 10,
        marginLeft: -50,
        marginBottom: -20,
    },
})