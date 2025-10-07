import { useEffect, useState } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"

import IComment from "@/interfaces/Comment"
import { Button, Text, TextInput, View } from "@/components/base/BaseComponents"
import { post } from "@/services/apiRequests"
import { useAuth } from "@/contexts/authContext"
import { Colors } from "@/constants/Colors"
import { getBgColor } from "@/constants/Theme"

interface CommentBoxProps {
    recipeId: number
    commentId?: number
    onSuccess: (comment: IComment) => void
    onCancel: () => void
}

interface ICommentData {
    text: string
    parentCommentId?: number
}

const maxLength = 250

export default function CommentBox({ recipeId, commentId, onSuccess, onCancel }: CommentBoxProps) {
    const [comment, setComment] = useState<string>("")
    const [commentError, setCommentError] = useState<string>("")
    const [isButtonDisabled, setButtonDisabled] = useState<boolean>(false)

    const { user } = useAuth()
    const { t } = useTranslation()

    useEffect(() => {
        if (comment.length >= maxLength) {
            setCommentError(`Comment must be no more than ${maxLength} characters`)
        }
    }, [comment])

    const onPressPost = () => {
        setButtonDisabled(true)
        if (comment === '') {
            setButtonDisabled(false)
            return
        }
        setCommentError("")
        const data: ICommentData = {
            text: comment,
        }
        if (commentId) {
            data.parentCommentId = commentId
        }
        post({url: `/recipe/${recipeId}/comment/create`, data, token: user?.token})
            .then((postedComment) => {
                onSuccess(postedComment)
                setButtonDisabled(false)
            })
            .catch((e) => {
                setButtonDisabled(false)
                setCommentError(e.response.data.message)
            })
    }

    return (
        <View style={s.container}>
            <TextInput
                styleContainer={s.inputContainer}
                placeholder={t('Write a comment...')}
                value={comment}
                styleTextInput={s.input}
                multiline
                maxLength={maxLength}
                onChangeText={(val) => {
                    setButtonDisabled(false)
                    setCommentError("")
                    setComment(val)
                }}
            />
            {commentError !== '' && (
                <Text style={{ color: 'red' }}>{commentError}</Text>
            )}

            <View style={s.buttons}>
                <Button
                    text={t('Post')}
                    onPress={onPressPost}
                    disabled={isButtonDisabled}
                    isWide={false}
                    size="small"
                    style={s.postButton}
                />

                <Pressable onPress={onCancel}>
                    <Text>{t('Cancel')}</Text>
                </Pressable>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginBottom: 20,
        backgroundColor: getBgColor(),
    },
    inputContainer: {
        backgroundColor: 'white',
        height: 72,
    },
    input: {
        height: 72,
        paddingVertical: 8,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        marginEnd: 10,
    },
    postButton: {
        paddingHorizontal: 10,
    },
})