import { Image, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ScrollView, Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { theme } from '@/constants/Theme'

interface IAchievement {
    id: number
    title: string
    goal: number
    progress: number
}

const achievementsFake: IAchievement[] = [
    {
        id: 1,
        title: 'Cooked recipes',
        goal: 5,
        progress: 3,
    },
    {
        id: 2,
        title: 'Cooked recipes',
        goal: 50,
        progress: 15,
    },
    {
        id: 3,
        title: 'Comments',
        goal: 20,
        progress: 5,
    },
    {
        id: 4,
        title: 'Comments',
        goal: 120,
        progress: 57,
    },
]

function Achievement({achievement}: {achievement: IAchievement}) {
    const { t } = useTranslation()

    const circleImg = require('@/assets/images/achievement-in-progress.png')
    const progress = achievement.progress / achievement.goal * 100
    return (
        <View style={s.achievementCard}>
            <View style={s.achievementCircle}> 
                <Image source={circleImg} style={s.achievementImg} />
                <Text style={[theme.bold, s.achievementGoal]}>{achievement.goal}</Text>
            </View>
            <Text>{t(achievement.title)}</Text>
            <View style={s.achievementProgressLine}>
                <View style={[s.achievementProgress, {width: `${progress}%`}]}/>
            </View>

        </View>
    )
}

export default function Achievements({style}: {style?: any}) {
    const { t } = useTranslation()

    const [achievements, setAchievements] = useState<IAchievement[]>([])

    useEffect(() => {
        // TODO recive achievements from server, filter needed
        // get('/achievements').then(res => setAchievements(res))
        setAchievements(achievementsFake)
    }, [])

    return (
        <View style={s.container}>
            <Text type="caption" style={{ marginBottom: 12 }}>{t('Achievements')}</Text>

            <ScrollView style={[style]} horizontal>
                {achievements.map((achievement) => <Achievement key={achievement.id} achievement={achievement} />)}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    achievementCard: {
        width: 132,
        gap: 8,
        marginRight: 8,
        borderRadius: 10,
        shadowColor: "#ccc",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 10,
        marginVertical: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementCircle: {
        width: 69,
        height: 69,
    },
    achievementImg: {
        width: 69,
        height: 69,
    },
    achievementGoal: {
        marginHorizontal: 'auto',
        marginTop: -47,
        height: 28,
        lineHeight: 28,
        fontSize: 24,
        color: Colors.grey,
    },
    achievementTitle: {
        height: 2,
        width: '100%',
        fontFamily: 'DMSans-Medium',
        fontWeight: '500',
    },
    achievementProgressLine: {
        width: 104,
        height: 3,
        borderRadius: 2,
        zIndex: 1,
        backgroundColor: Colors.lightGrey,
    },
    achievementProgress: {
        height: 3,
        zIndex: 2,
        borderRadius: 2,
        backgroundColor: Colors.mainColor,
    },
})