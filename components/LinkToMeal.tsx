import { useCallback } from 'react'
import { Platform, Pressable } from 'react-native'
import { Href, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/base/BaseComponents'
import { useSettings } from '@/contexts/settingsContext'

interface Props {
    mealDate?: string
    mealType?: string
}

export default function LinkToMeal({mealDate, mealType}: Props) {
    const router = useRouter()
    const { settings } = useSettings()
    const { t } = useTranslation()

    const getLinkToWeeklyPlan = useCallback(() => {
        const linkToWeeklyPlan: Href<string | object> = { pathname: '/(pages)/weekly-plan' }
        if (mealDate) {
            const now = new Date()
            const date = new Date(mealDate)
            // last 4 weeks
            if (now.getTime() > date.getTime() && now.getTime() - date.getTime() < 1000 * 60 * 60 * 24 * 28) {
                linkToWeeklyPlan.params = { date: mealDate}
            }
            // next 4 weeks
            if (now.getTime() < date.getTime() && now.getTime() - date.getTime() > -1000 * 60 * 60 * 24 * 28) {
                linkToWeeklyPlan.params = { date: mealDate}
            }
        }
        return linkToWeeklyPlan
    }, [])

    const getVerticalOffset = useCallback(() => {
            let offset: number
            switch (Platform.OS) {
                case 'ios':
                    offset = -4
                    break
                case 'android':
                    offset = -10
                    break
                default:
                    offset = -8
                    break
            }
            return offset
        }, [])

    return (
        <Pressable
            onPress={() => router.push(getLinkToWeeklyPlan())}
        >
            <Text type='link' style={{ paddingHorizontal: 2, marginVertical: getVerticalOffset() }}>
                {mealDate && new Date(mealDate).toLocaleDateString(settings?.language ?? 'en')}{' '}
                {t('for {{mealType}}', {mealType})}
            </Text>
        </Pressable>
    )
}