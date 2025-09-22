import { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Text, View } from '@/components/base/BaseComponents'
import { getBgColor } from '@/constants/Theme'
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
        title: 'Master of the kitchen',
        image: require('@/assets/images/achievements/green-chef-badge.png'),
        description: 'Earn by completing one recipe each day for a week.',
    },
	{
		id: 2,
		title: 'Grill master',
		image: require('@/assets/images/achievements/carnivore-champion-badge.png'),
		description: 'Earn by completing one recipe each day for a week.',
	},
]

function ChallengeCard({challenge}: {challenge: IChallenge}) {
	const { t } = useTranslation()

	return (
		<Pressable style={s.challengeCard} onPress={() => console.log('Open challenge', challenge.id)}>
			<Image source={challenge.image} style={s.challengeCardImg}/>
			<View style={s.challengeCardText}>
				<Text style={s.challengeCardTitle}>{t(challenge.title)}</Text>
				<Text style={s.challengeCardDescription}>{t(challenge.description)}</Text>
			</View>
			<View style={s.chevronCircle}>
				<Image source={require('@/assets/icons/chevron-right-neutral-grey.png')} style={s.chevronIcon} />
			</View>
		</Pressable>
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
            {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
		</View>
    )
}

const s = StyleSheet.create({
    container: {
        marginTop: 10,
        backgroundColor: getBgColor(),
    },
    challengeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        borderRadius: 16,
        backgroundColor: Colors.white,
        marginTop: 10,
        paddingVertical: 22,
        paddingHorizontal: 10,
    },
    challengeCardImg: {
        width: 85,
        height: 85,
    },
    challengeCardText: {
        flex: 1,
        paddingRight: 12,
    },
    challengeCardTitle: {
        flexWrap: 'wrap',
		fontFamily: 'Poppins-Medium',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 22,
		letterSpacing: 0,
		color: '#1B1A1D',
        marginBottom: 4,
    },
    challengeCardDescription: {
        flexWrap: 'wrap',
		fontFamily: 'Poppins',
		fontWeight: '400',
		fontSize: 14,
		lineHeight: 19,
		letterSpacing: 0,
		color: '#6C7278',
    },
    chevronCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ECD8C4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronIcon: {
        width: 20,
        height: 28,
        tintColor: Colors.mainColor,
    },
})