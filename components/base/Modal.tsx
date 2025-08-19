import {
    Modal as ModalNative,
    ModalProps as ModalPropsNative,
    StyleSheet,
    ViewStyle,
} from "react-native"
import { useState } from "react"

import { theme } from "@/constants/Theme"
import { View } from "@/components/base/View"

type ModalProps = ModalPropsNative & {
    onHideModal?: () => void;
    style?: ViewStyle;
}

export function Modal({
    onHideModal,
    style,
    presentationStyle = undefined,
    ...rest
}: ModalProps) {
    const [visibleModal, setVisibleModal] = useState<boolean>(true)

    const hideModal = () => {
        setVisibleModal(!visibleModal)
        onHideModal && onHideModal()
    }

    return (
        <ModalNative
            animationType="slide"
            visible={visibleModal}
            onRequestClose={hideModal}
            presentationStyle={presentationStyle}
        >
            <View style={[theme.mainContainer, s.modalView, style]}>
                {rest.children}
            </View>
        </ModalNative>
    )
}

const s = StyleSheet.create({
    modalView: {
        justifyContent: 'center',
        alignItems: 'center',
    },
})