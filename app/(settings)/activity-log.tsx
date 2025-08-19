import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, ModalTitle, ScrollView, Text, View } from "@/components/base/BaseComponents"
import LinkToProfile from '@/components/LinkToProfile'
import LinkToRecipe from '@/components/LinkToRecipe'
import { theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import IActivityLog from '@/interfaces/ActivityLog'
import { logError } from '@/services/utils'

const actionMap = {
    recipe_create: 'Created recipe',
    recipe_status: 'Changed status to',
    recipe_delete: 'Deleted recipe',
    recipe_view: 'Viewed recipe',
    recipe_like: 'Liked recipe',
    recipe_save: 'Saved recipe',
    recipe_rate: 'Rated recipe',
    comment_like: 'Liked comment',
    comment_create: 'Created comment',
    comment_reply: 'Replied to comment',
    profile_update: 'Profile updated',
    meal_plan_add: 'Meal plan - add',
    meal_plan_delete: 'Meal plan - delete',
    meal_plan_edit: 'Meal plan - edit',
    shopping_list_add_recipe: 'Shopping list - add from recipe',
    shopping_list_add_manual: 'Shopping list - add ingredient',
    shopping_list_delete: 'Shopping list - delete checked',
    user_follow: 'User - follow',
    user_unfollow: 'User - unfollow',
}

function ActivityRecord({ record }: { record: IActivityLog }) {
    const router = useRouter()
    const { t } = useTranslation()

    const getActionDescription = useCallback((record: IActivityLog): JSX.Element => {
        const displayIngredients = () => {
            const ingredients = (record.ingredients || []).map(ing => (
                <Pressable key={ing.id} onPress={() => router.push({
                    pathname: '/(pages)/ingredient',
                    params: {id: ing.id}
                })}>
                    <Text type='link'>{ing.title}</Text>
                </Pressable>
            ))
            return <View>{ingredients}</View>
        }

        switch (record.action) {
            case 'recipe_create':
            case 'recipe_delete':
            case 'recipe_view':
            case 'recipe_like':
            case 'recipe_save':
            case 'meal_plan_add':
            case 'meal_plan_delete':
            case 'meal_plan_edit':
            case 'shopping_list_delete':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text style={s.recordText}>{t(actionMap[record.action])}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                    </View>
                )
            case 'recipe_status':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{t(actionMap[record.action])} <Text style={theme.bold}>{record.statusTitle}</Text> {t('for')}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                    </View>
                )
            case 'recipe_rate':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{t(actionMap[record.action])} <Text style={theme.bold}>{record.rating}</Text> {t('for')}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                    </View>
                )
            case 'comment_like':
            case 'comment_create':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{t(actionMap[record.action])} {record.comment?.text} {t('for')}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                    </View>
                )
            case 'comment_reply':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{t(actionMap[record.action])} {record.replyToComment?.text}: {record.comment?.text} {t('for')}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                    </View>
                )
            case 'profile_update':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>
                            {t(actionMap[record.action])}
                            {record.fields ? t(' with fields: {{fields}}', { fields: record.fields }) : ''}
                        </Text>
                    </View>
                )
            case 'shopping_list_add_recipe':
            case 'shopping_list_add_manual':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{t(actionMap[record.action])}</Text>
                        <LinkToRecipe id={record.recipe?.id} title={record.recipe?.title} />
                        {displayIngredients()}
                    </View>
                )
            case 'user_follow':
            case 'user_unfollow':
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>
                            {t(actionMap[record.action])}
                            <LinkToProfile id={record.user?.id} fullname={record.user?.fullname} />
                        </Text>
                    </View>
                )
            default:
                return (
                    <View style={s.recordTextWrapper}>
                        <Text>{''}</Text>
                    </View>
                )
        }
    }, [])

    return (
        <View style={s.record}>
            {getActionDescription(record)}
            <Text style={s.createdAt}>{record.createdAt}</Text>
        </View>
    )
}

export default function RecipesFeed() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()

    const [records, setRecords] = useState<IActivityLog[]>([])
    const [isPossibleMore, setPossibleMore] = useState<boolean>(false)

    const loadMore = useCallback(() => {
        const filterLimit = 20
        const filterLastId = records.length > 0 ? records[records.length - 1].id : undefined

        post({
            url: '/profile/log',
            data: { filterLimit, filterLastId },
            token: user?.token
        })
            .then((recs) => {
                setPossibleMore(!(recs && recs.length < filterLimit))
                setRecords([...records, ...recs])
            })
            .catch(logError)
    }, [records])

    useEffect(() => {
        loadMore()
    }, [])

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title={t('Activity log')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')} />
                <ScrollView style={{ maxHeight: '72%' }}>
                    <View style={s.records}>
                        {records.map((record, i) => (
                            <ActivityRecord key={i} record={record} />
                        ))}
                    </View>
                </ScrollView>
                <View style={{flex: 1}}>
                    {isPossibleMore && <Button
                        text={t('Load more')}
                        onPress={loadMore}
                        style={{
                            marginTop: 16,
                            alignSelf: 'center',
                        }}
                    /> }
                </View>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    records: {
        gap: 16,
    },
    record: {
        gap: 0,
    },
    recordTextWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
    },
    recordText: {
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createdAt: {
        fontSize: 11,
        color: Colors.neutralGrey,
    },
})