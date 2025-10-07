import { StyleSheet } from "react-native"
import { useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { ModalTitle, Text, TextInput, View, Button } from "@/components/base/BaseComponents"
import { validatePassword } from "@/services/validators"
import { useAuth } from "@/contexts/authContext"
import { post } from "@/services/apiRequests"
import { theme, getBgColor } from "@/constants/Theme"

export default function ChangePassword({ isVisible, onHide }: { isVisible: boolean, onHide: () => void }) {
    const { user, setUser } = useAuth()
    const { t } = useTranslation()
    
    const [oldPassword, setOldPassword] = useState<string>('')
    const [newPassword, setNewPassword] = useState<string>('')
    const [newPasswordError, setNewPasswordError] = useState<string>('')
    const [isButtonDisabled, setButtonDisabled] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string>('')
    
    const onBlurNewPassword = () => {
        if (!validatePassword(newPassword)) {
            setNewPasswordError(t('Password must be at least 6 characters long'))
            return false
        }
        setNewPasswordError('')
        return true
    }
    
    const onSave = () => {
        if (!onBlurNewPassword()) {
            return
        }
        if (oldPassword === newPassword) {
            setNewPasswordError(t('Password must not be the same as the old one'))
            return
        }
        const data = {oldPassword, newPassword}
        
        setButtonDisabled(true)
        post({url: '/profile/update', data, token: user?.token})
        .then(response => {
            AsyncStorage.setItem('user', JSON.stringify({ ...user, ...response }))
            .catch(e => console.log('Error: AsyncStorage.setItem("user")', e))
            setUser({ ...user, ...response })
            onHide()
        })
        .catch(e => {
            if (e.response) {
                console.log(e.response.status, e.response.data)
                setButtonDisabled(false)
                return setSaveError(e.response.data.message)
            }
            console.log(e)
        })
    }

    
    const lockOn = require('@/assets/icons/login-lock-on.png')
    
    return (
        <Modal
            isVisible={isVisible}
            onModalHide={onHide}
            style={[theme.modal, { backgroundColor: getBgColor(), justifyContent: 'flex-start' }]}
        >
            <ModalTitle title={t('Change password')} onHide={onHide}/>

            <View style={s.passwordsFieldsContainer}>
                <TextInput
                    startIcon={lockOn}
                    autoCorrect={false}
                    autoCapitalize='none'
                    textContentType='password'
                    placeholder={t('Old password')}
                    secureTextEntry
                    value={oldPassword}
                    onChangeText={text => {
                        setOldPassword(text)
                        setSaveError('')
                    }}
                />
                <TextInput
                    startIcon={lockOn}
                    autoCorrect={false}
                    autoCapitalize='none'
                    textContentType='password'
                    placeholder={t('New password')}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={text => {
                        setNewPassword(text)
                        setSaveError('')
                    }}
                    onBlur={onBlurNewPassword}
                />
                {newPasswordError !== '' && <Text type='error'>{newPasswordError}</Text>}
            </View>
            {saveError !== '' && <Text type='error' style={{ marginBottom: 16, marginTop: 8 }}>{saveError}</Text> }
            <Button disabled={isButtonDisabled} text={t('Save')} onPress={onSave} />
        </Modal>
    )
}

const s = StyleSheet.create({
    passwordsFieldsContainer: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
        backgroundColor: getBgColor(),
    },
})