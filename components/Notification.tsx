import { useCallback } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Href, useRouter } from 'expo-router'

import { Text, View } from '@/components/base/BaseComponents'
import LinkToMeal from '@/components/LinkToMeal'
import LinkToProfile from '@/components/LinkToProfile'
import LinkToRecipe from '@/components/LinkToRecipe'
import { timeSince } from '@/services/datetime'
import { useAuth } from '@/contexts/authContext'
import { Colors } from '@/constants/Colors'

export interface INotification {
    action: string
    isNew: boolean
    recipe?: {id: number, title: string}
    user?: {id: number, fullname: string, profileImageThumb: string}
    comment?: {id: number, text: string}
    rate?: number
    mealDate?: string
    mealType?: string
    createdAt: Date | string
}

export default function Notification({action, isNew, user, recipe, comment, rate, mealDate, mealType, createdAt}: INotification) {
    const router = useRouter()
    const { user: authUser } = useAuth()
    const { t } = useTranslation()

    const textElemByAction = useCallback(() => {

        switch (action) { 
            case 'new_follower':
                return <Text style={s.recordTextWrapper}>
                    <LinkToProfile id={user?.id} fullname={user?.fullname} />{' '}
                    {t('has started to follow you')}{' '}·{' '}
                    {timeSince(new Date(createdAt))}
                </Text>
            case 'recipe_from_followed':
                return <Text style={s.recordTextWrapper}>
                    <LinkToProfile id={user?.id} fullname={user?.fullname} />
                    {t('posted a new recipe')}{' '}
                    <LinkToRecipe id={recipe?.id} title={recipe?.title}/>{' '}·{' '}
                    {timeSince(new Date(createdAt))}
                </Text>
            case 'comment_on_your_recipe':
                return <Text style={s.recordTextWrapper}>
                    <LinkToProfile id={user?.id} fullname={user?.fullname} />
                    {t('commented on your recipe')}{' '}
                    <LinkToRecipe id={recipe?.id} title={recipe?.title}/>:{'\n'}
                    {comment?.text}{' '}·{' '}
                    {timeSince(new Date(createdAt))}
                </Text>
            case 'comment_on_your_liked_recipe':
                return <Text style={s.recordTextWrapper}>
                    <LinkToProfile id={user?.id} fullname={user?.fullname} />
                    {t('commented on recipe that you liked')}
                    <LinkToRecipe id={recipe?.id} title={recipe?.title}/>:{'\n'}
                    {comment?.text}{' '}·{' '}
                    {timeSince(new Date(createdAt))}
                </Text>
            case 'rated':
                return <View style={s.recordTextWrapper}>
                    <LinkToProfile id={user?.id} fullname={user?.fullname} />
                    <Text>
                        {' '}
                        {t('rated {{rate}} your recipe', {rate})}{' '}
                        <LinkToRecipe id={recipe?.id} title={recipe?.title}/>{' '}·{' '}
                        {timeSince(new Date(createdAt))}
                    </Text>
                </View>
            case 'planned_meal':
                return <Text style={s.recordTextWrapper}>
                    <LinkToRecipe id={recipe?.id} title={recipe?.title}/>{' '}
                    {t('has been added to your planned meals at')}
                    {' '}
                    <LinkToMeal mealDate={mealDate} mealType={mealType}/>
                    {' '}·{' '}
                    {timeSince(new Date(createdAt))}
                </Text>
            default:
                return <Text style={s.recordTextWrapper}>{action}</Text>
        }
    }, [action, mealDate])

    const getActionIcon = useCallback(() => {
        const icons: {[key: string]: any} = {
            recipe_from_followed: require('@/assets/icons/recipe.png'),
            comment_on_your_recipe: require('@/assets/icons/message-circle.png'),
            comment_on_your_liked_recipe: require('@/assets/icons/message-circle.png'),
            new_follower: require('@/assets/icons/person-add.png'),
            rated: require('@/assets/icons/star.png'),
            planned_meal: require('@/assets/icons/recipe.png'),
        }
        return icons[action]        
    }, [action])

    const getProfileImage = useCallback(() => {
        return user ?
            (user?.profileImageThumb ? {uri: user?.profileImageThumb} : require('@/assets/images/icon.png')) :
            authUser?.profileImageThumb ? {uri: authUser?.profileImageThumb} : require('@/assets/images/icon.png')
    }, [user, authUser])

    return (
        <View style={s.container}>
            {isNew && <View style={s.newMark} />}
            <Pressable
                onPress={() => user?.id !== null && router.push(user?.id
                    ? { pathname: '/(pages)/profile', params: {userId: user?.id} }
                    : { pathname: '/(tabs)/profile' })}
            >
                <Image
                    source={getProfileImage()}
                    style={s.img}
                />
            </Pressable>
            {textElemByAction()}
            <View style={s.iconWrap}>
                <Image source={getActionIcon()} style={s.icon} />
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    newMark: {
        position: 'absolute',
        top: 6,
        left: 40,
        width: 4,
        height: 4,
        borderRadius: 4,
        backgroundColor: Colors.mainColor,
    },
    recordTextWrapper: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
    },
    img: {
        width: 40,
        height: 40,
        borderRadius: 999,
    },
    text: {
        fontSize: 13,
        color: Colors.neutralGrey,
    },
    bold: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    iconWrap: {
        width: 29,
        height: 29,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#C3803A26',
    },
    icon: {
        width: 14,
        height: 14,
    }
})