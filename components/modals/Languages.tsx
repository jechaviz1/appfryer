import { useEffect, useState } from "react"
import { Pressable, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import Modal from "react-native-modal"

import { Button, Text, View } from "@/components/base/BaseComponents"
import { theme, getBgColor } from "@/constants/Theme"

interface Props {
    isVisible: boolean
    onHide: () => void
    languages: Record<string, string>
}
export default function Languages({isVisible, onHide, languages}: Props) {
    const { i18n } = useTranslation()

    return <Modal
        isVisible={isVisible}
        style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
        onModalHide={onHide}
        onBackdropPress={onHide}
    >
        <View style={s.modalLanguages}>
            {Object.entries(languages).map(([key, value]) => (
                <Button
                    key={key}
                    disabled={key === i18n.language}
                    text={value}
                    style={s.languageItem}
                    textStyle={{textAlign: 'center'}}
                    onPress={() => {
                        i18n.changeLanguage(key)
                        onHide()
                    }}
                />
            ))}
        </View>
    </Modal>
}

const s = StyleSheet.create({
    modal: {
        marginTop: '140%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalLanguages: {
        gap: 16,
        width: '100%',
    },
    languageItem: {
        textAlign: 'center',
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
    },
})