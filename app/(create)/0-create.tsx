import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import Modal from 'react-native-modal'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, ModalTitle, Text, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { getBgColor, isLight, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'

export default function CreateInitStep() {
    const { user } = useAuth()
    const { setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()

    const [isCreatingDisabled] = useState<boolean>(user?.isRoleCreator !== true)
    const [showModal, setShowModal] = useState<boolean>(false)

    // clean up the previous recipe state
    useEffect(() => {
        setRecipe({})
        setShowModal(isCreatingDisabled)
    }, [])

    const createRecipe = useCallback(() => {
        post({url: '/recipe/create', token: user?.token})
            .then((obtainedEmptyRecipe) => {
                setRecipe({...obtainedEmptyRecipe, id: obtainedEmptyRecipe.recipeId})
                router.replace(`/(create)/1-upload-media`)
            })
            .catch(logError)
    }, [])

    const hide = useCallback(() => {
        setShowModal(false)
        router.navigate(`/(tabs)/`)
    }, [showModal])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.container}>
            <Modal
                isVisible={showModal}
                style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
                onModalHide={hide}
                onBackdropPress={hide}
            >
                <View>
                    <ModalTitle title={t('You are not a creator')} onHide={hide}/>
                </View>
            </Modal>

            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.navigate('/(tabs)/')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <View style={s.main}>
                    <View style={s.iconWrapper}>
                        <Image
                            source={require('@/assets/icons/recipe.png')}
                            style={{ width: 44, height: 44 }}
                        />
                    </View>
                    <View style={s.textWrapper}>
                        <Text type="subtitle" style={s.text}>{t('Create a new recipe')}</Text>
                        <Text style={[s.text, { color: isLight() ? Colors.grey : Colors.lightGrey }]}>{t('Answer a few questions and we’ll create your new recipe.')}</Text>
                    </View>
                </View>

                <View style={s.btnWrapper}>
                    <Button text={t('Next')} onPress={createRecipe} />
                </View>

            </View>
        </View>
    )
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.60,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },
    topbarWrap: {
        marginBottom: 150,
        width: '100%',
        justifyContent: 'space-between',
    },
    topbarInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    main: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 116,
        height: 116,
        backgroundColor: Colors.mainColorLight,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrapper: {
        marginTop: 42,
        gap: 14,
    },
    text: {
        marginHorizontal: 56,
        textAlign: 'center',
    },
    btnWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        marginBottom: 82,
    },
})