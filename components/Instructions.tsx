import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { Text, View } from '@/components/base/BaseComponents'
import { IRecipeStep } from '@/interfaces/Recipe'

interface Props {
    steps: IRecipeStep[]
}

const fakeSteps: IRecipeStep[] = [
    {title: 'Step1', description: 'Description'},
    {title: 'Step2', description: 'Description'},
]

export default function Instructions({ steps }: Props) {
    const [preparedSteps] = useState<IRecipeStep[]>(steps ?? fakeSteps)

    return (
        <View style={[s.container]}>
            {preparedSteps.map((step, index) => (
                <View key={index}>
                    <Text type='caption'>{step.title}</Text>
                    <Text>{step.description}</Text>
                </View>
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        gap: 12,
        alignSelf: 'flex-start',
    }
})