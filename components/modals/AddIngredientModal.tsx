import { useEffect, useState } from "react"
import { Dimensions, Image, Pressable, StyleSheet } from "react-native"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { Button, Text, TextInput, View } from "@/components/base/BaseComponents"
import Measures from "@/components/modals/Measures"
import IngredientSearchInput from "@/components/IngredientSearchInput"
import { fetchMeasures } from "@/services/fetches"
import { useAuth } from "@/contexts/authContext"
import { theme, getBgColor } from "@/constants/Theme"
import IIngredinent, { IMeasure } from "@/interfaces/Ingredient"

interface AddIngredientModalProps {
    isVisible: boolean
    hideAndClear: () => void
    onSubmit: (ingredient: IIngredinent) => void
}

export default function AddIngredientModal({isVisible, hideAndClear, onSubmit}: AddIngredientModalProps) {
    const { t } = useTranslation()
    const { user } = useAuth()

    const [showMeasures, setShowMeasures] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState<IIngredinent | null>(null)
    const [measures, setMeasures] = useState<IMeasure[]>([])
    const [measure, setMeasure] = useState(1)
    const [cnt, setCnt] = useState<string>('')

    useEffect(() => {
        fetchMeasures(setMeasures, user!.token)
    }, [])
    
    const onAdd = () => {
        if (!selectedIngredient) {
            return
        }
        const ingredient = {
            ...selectedIngredient,
            measureId: measure,
            cnt: Number.parseFloat(cnt)
        }
        onSubmit(ingredient)
        // to init state
        setSelectedIngredient(null)
        setCnt('')
        setMeasure(1)
        hideAndClear()
    }
    const window = Dimensions.get('window')

    return (
        <Modal
            isVisible={isVisible}
            style={[theme.modal, s.modalView, {backgroundColor: getBgColor(), marginTop: window.height * 0.45}]}
            onModalHide={hideAndClear}
            onBackdropPress={hideAndClear}
        >
            {showMeasures && <Measures
                isVisible={showMeasures}
                onHide={() => setShowMeasures(false)}
                onSubmit={(m) => setMeasure(m.id)}
            />}

            <View style={[theme.section, {minHeight: 600}]}>
                {selectedIngredient !== null
                    ? <Pressable
                        onPress={() => setSelectedIngredient(null)}
                        style={s.titleWrapper}
                    >
                        <Text type="link" >{selectedIngredient.title}</Text>
                        <Image source={require('@/assets/icons/x.png')} style={{width: 24, height: 24}}/>
                    </Pressable>
                    : <View style={{ minHeight: 200 }}>
                        <IngredientSearchInput
                            placeholder={t('Add ingredient')}
                            type='ingredient'
                            selected={[]}
                            onSelectedIngredient={ing => setSelectedIngredient(ing as IIngredinent)}
                            textInputStyle={{ maxHeight: 50 }}
                        />
                    </View>
                }

                {/* Measure and count */}
                {selectedIngredient !== null ? <View style={s.measuresAndQnt}>
                    <Button
                        text={measures.find((m) => m.id === measure)?.title || ''}
                        shape='square'
                        disabled={!selectedIngredient}
                        style={s.measureBtn}
                        onPress={() => setShowMeasures(true)}
                    />
                    <TextInput
                        readOnly={!selectedIngredient}
                        styleContainer={s.cntInput}
                        styleTextInput={{ textAlign: 'center'}}
                        placeholder='0'
                        inputMode='numeric'
                        value={cnt}
                        onChangeText={setCnt}
                    />
                </View> : null}

                <View style={s.btns}>
                    <Pressable onPress={hideAndClear}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                    <Button
                        text={t('Add')}
                        disabled={!selectedIngredient || Number(cnt) <= 0}
                        isWide={false}
                        style={s.addBtn}
                        onPress={() => onAdd()}
                    />
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    modalView: {
        marginTop: '25%',
        justifyContent: 'flex-start',
        paddingTop: 16,
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        margin: 12,
        marginBottom: 24,
    },
    measuresAndQnt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    measureBtn: {
        maxWidth: '22%',
    },
    cntInput: {
        width: '14%',
        paddingHorizontal: 6,
    },
    btns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 120,
    },
    addBtn: {
        paddingHorizontal: 20,
    },
})