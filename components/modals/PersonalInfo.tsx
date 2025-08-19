import { StyleSheet } from "react-native"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { ModalTitle, Text, TextInput, View, Button } from "@/components/base/BaseComponents"
import { validateName, validateEmail } from "@/services/validators"
import { useAuth } from "@/contexts/authContext"
import { theme, getBgColor } from "@/constants/Theme"
import { post } from "@/services/apiRequests"

export default function PersonalInfo({ isVisible, onHide }: { isVisible: boolean, onHide: () => void }) {
    const person = require('@/assets/icons/login-person.png')
    const envelope = require('@/assets/icons/login-envelope.png')
    const lockOn = require('@/assets/icons/login-lock-on.png')

    const { user, setUser } = useAuth()
    const { t } = useTranslation()

    const [oldFullname, setOldFullname] = useState<string>('')
    const [oldEmail, setOldEmail] = useState<string>('')
    const [fullname, setFullname] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [needToShowPassword, setNeedToShowPassword] = useState<boolean>(false)
    const [password, setPassword] = useState<string>('')
    const [nameError, setNameError] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')
    const [isButtonDisabled, setButtonDisabled] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string>('')

    useEffect(() => {
        if (user) {
            setFullname(user.fullname)
            setEmail(user.email)
            setOldFullname(user.fullname)
            setOldEmail(user.email)
        }
    }, [])

    const onBlurName = () => {
        if (!validateName(fullname)) {
            setNameError(t('Please enter a valid name'))
            return false
        }
        setNameError('')
        return true
    }
    const onBlurEmail = () => {
        if (!validateEmail(email)) {
            setEmailError(t('Please enter a valid email address'))
            return false
        }
        setEmailError('')
        if (oldEmail !== email) {
            setNeedToShowPassword(true)
            setPassword('')
            return true
        }
        setNeedToShowPassword(false)
        return true
    }

    const onSave = () => {
        if (!onBlurName() || !onBlurEmail()) {
            return
        }
        const data: { fullname?: string, email?: string, oldPassword?: string} = {}
        if (fullname !== oldFullname) {
            data.fullname = fullname
        }
        if (email !== oldEmail) {
            data.email = email
            if (password === '') {
                setSaveError(t('Please enter your current password'))
                return
            }
            data.oldPassword = password
        }

        if (Object.keys(data).length === 0) {
            onHide()
            return
        }

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

    return (
        <Modal
            isVisible={isVisible}
            onModalHide={onHide}
            style={[theme.modal, { backgroundColor: getBgColor(), justifyContent: 'flex-start' }]}
        >
            <ModalTitle title={t('Personal Info')} onHide={onHide} />
            <View style={s.loginFieldsContainer}>
                <TextInput
                    startIcon={person}
                    autoCorrect={false}
                    inputMode='text'
                    maxLength={30}
                    autoCapitalize='none'
                    placeholder={t('Name')}
                    textContentType='name'
                    value={fullname}
                    onChangeText={text => {
                        setFullname(text)
                        setNameError('')
                    }}
                    onBlur={onBlurName}
                />
                {nameError !== '' && <Text type='error'>{nameError}</Text>}
                <TextInput
                    startIcon={envelope}
                    autoCorrect={false}
                    inputMode='email'
                    keyboardType='email-address'
                    autoCapitalize='none'
                    placeholder={t('Email')}
                    textContentType='emailAddress'
                    value={email}
                    onChangeText={text => {
                        setEmail(text)
                        setEmailError('')
                    }}
                    onBlur={onBlurEmail}
                />
                {emailError !== '' && <Text type='error'>{emailError}</Text>}

                {needToShowPassword &&
                <TextInput
                    startIcon={lockOn}
                    autoCorrect={false}
                    autoCapitalize='none'
                    textContentType='password'
                    placeholder={t('Current password')}
                    secureTextEntry
                    value={password}
                    onChangeText={text => {
                        setPassword(text)
                        setSaveError('')
                    }}
                /> }
            </View>
            {saveError !== '' && <Text type='error' style={{ marginBottom: 16, marginTop: 8 }}>{saveError}</Text> }
            <Button disabled={isButtonDisabled} text={t('Save')} onPress={onSave} />
        </Modal>
    )
}

const s = StyleSheet.create({
    loginFieldsContainer: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
    },
})