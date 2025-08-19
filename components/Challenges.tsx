import { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, ScrollView, Text, View } from '@/components/base/BaseComponents'
import { isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'

interface IChallenge {
    id: number
    title: string
    image: any
    description: string
}
const challengesFake: IChallenge[] = [
    {
        id: 1,
        title: 'Cooking Master',
        image: require('@/assets/images/cooking-master.png'),
        description: 'Earn this by completing a recipe every day for a week.',
    },
    {
        id: 2,
        title: 'Cooking Master',
        image: require('@/assets/images/cooking-master.png'),
        description: 'Earn this by completing a recipe every day for a week.',
    },
]

function ChallengeCard({challenge}: {challenge: IChallenge}) {
    const { t } = useTranslation()

    return (
        <View style={s.challengeCard}>
            <View style={s.challengeCardContent}>
                <Image source={challenge.image} style={s.challengeCardImg}/>
                <View style={s.challengeCardText}>
                    <Text type='defaultSemiBold' style={s.challengeCardTitle}>{t(challenge.title)}</Text>
                    <Text style={[s.challengeCardDescription, {color: isLight() ? Colors.grey : Colors.lightGrey}]}>{t(challenge.description)}</Text>
                </View>
            </View>
            <Button
                text={t('Get started')}
                shape='round'
                size='small'
                onPress={() => console.log('Get started')}
            />

        </View>
    )
}


export default function Challenges({style}: {style?: any}) {
    const { t } = useTranslation()

    const [challenges, setChallenges] = useState<IChallenge[]>([])

    useEffect(() => {
        // TODO recive challenges from server, filter needed
        // get('/challenges').then(setChallenges)
        setChallenges(challengesFake)
    }, [])

    return (
        <View style={[style, s.container]}>
            <Text type="caption" style={{ marginBottom: 12 }}>{t('Challenges')}</Text>

            <ScrollView horizontal>
                {challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    challengeCard: {
        width: 314,
        gap: 16,
        marginRight: 10,
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
    },
    challengeCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        overflow: 'hidden',
    },
    challengeCardImg: {
        marginLeft: 16,
        width: 69,
        height: 69,
    },
    challengeCardText: {
        maxWidth: 314 - 85 - 12 - 17,
        paddingRight: 17,
    },
    challengeCardTitle: {
        flexWrap: 'wrap',
        fontSize: 14,
    },
    challengeCardDescription: {
        flexWrap: 'wrap',
        fontSize: 13,
    },
})