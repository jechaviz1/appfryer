import { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import Modal from "react-native-modal"

import { Button, View } from "@/components/base/BaseComponents"
import { fetchMeasures } from "@/services/fetches"
import { useAuth } from "@/contexts/authContext"
import { IMeasure } from "@/interfaces/Ingredient"
import { theme, getBgColor } from "@/constants/Theme"

interface MeasureProps {
    isVisible: boolean
    onHide: () => void
    onSubmit: (measure: IMeasure) => void
}

export default function Measures({isVisible, onHide, onSubmit}: MeasureProps) {
    const { user } = useAuth()

    const [measures, setMeasures] = useState<IMeasure[]>([])

    useEffect(() => {
        fetchMeasures(setMeasures, user!.token)
    }, [])

    return (
        <Modal
            isVisible={isVisible}
            style={[theme.modal, s.modalMeasures, {backgroundColor: getBgColor()}]}
            onModalHide={onHide}
            onBackdropPress={onHide}
        >
            <View style={s.measuresWrapper}>
                {measures.map((m) => (
                    <Button
                        key={m.id}
                        text={m.title}
                        style={s.measureModalBtn}
                        onPress={() => {
                            onSubmit(m)
                            onHide()
                        }}
                    />
                ))}
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    modalMeasures: {
        marginTop: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 16,
    },
    measuresWrapper: {
        gap: 12,
    },
    measureModalBtn: {
        width: 120,
    },
})