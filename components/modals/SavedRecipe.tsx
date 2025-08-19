import { useEffect, useState } from "react"
import { Dimensions, Image, Pressable, StyleSheet } from "react-native"
import Modal from "react-native-modal"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from "react-i18next"

import { Button, Text, TextInput, View } from "@/components/base/BaseComponents"
import { get, post } from "@/services/apiRequests"
import { useAuth } from '@/contexts/authContext'
import { logError } from "@/services/utils"
import IFolder from "@/interfaces/Folder"
import { Colors } from "@/constants/Colors"
import { theme, getBgColor, isLight } from "@/constants/Theme"

interface Props {
    isVisible: boolean
    recipeId: number
    onHide: () => void
    inFolders: IFolder[]
    onUpdateFolders: (folders: IFolder[]) => void
}

export default function SavedRecipe({ isVisible, recipeId, onHide, inFolders = [], onUpdateFolders }: Props) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [folders, setFolders] = useState<IFolder[]>([])
    const [markedFolders, setMarkedFolders] = useState<IFolder[]>(inFolders)
    const [showNewFolder, setShowNewFolder] = useState<boolean>(false)
    const [newFolder, setNewFolder] = useState<string>('')
    const [newFolderError, setNewFolderError] = useState<string>('')

    useEffect(() => {
        if (!isVisible) {
            return
        }

        AsyncStorage.getItem('userFolders')
            .then(userFoldersStr => {
                if (userFoldersStr) {
                    setFolders(JSON.parse(userFoldersStr) as IFolder[])
                }
                get({ url: '/profile/folders', token: user?.token})
                    .then(res => {
                        setFolders(res as IFolder[])
                        AsyncStorage.setItem('userFolders', JSON.stringify(res))
                    })
                    .catch(logError)
            })
            .catch(e => console.log('AsyncStorage: fetching user folders', e))
    }, [isVisible])

    const toggleFolder = (folder: IFolder) => {
        markedFolders.find((f: IFolder) => f.id === folder.id)
            ? setMarkedFolders(markedFolders.filter((f: IFolder) => f.id !== folder.id))
            : setMarkedFolders([...markedFolders, folder])
    }

    const resetNewFolder = () => {
        setShowNewFolder(false)
        setNewFolder('')
        setNewFolderError('')
    }
    const onAddNewFolder = () => {
        if (!newFolder) {
            return
        }
        if (folders.find((item: IFolder) => item.title === newFolder)) {
            setNewFolderError(t('Folder with this name already exists'))
            return
        }

        post({
            url: '/profile/folder/create',
            data: { title: newFolder },
            token: user?.token,
        })
            .then((f: IFolder) => {
                const newFolders = [...folders, {...f, checked: true}]
                setFolders(newFolders)
                AsyncStorage.setItem('userFolders', JSON.stringify(newFolders.map(f => ({id: f.id, title: f.title}))))
                setMarkedFolders([...markedFolders, f])
                resetNewFolder()
            })
            .catch(e => {
                logError(e)
                setNewFolderError(e.response?.data?.message)
            })
    }

    const onSave = () => {
        // do nothing if the recipe in the same folders
        if (
            markedFolders.length === inFolders.length &&
            markedFolders.every((f: IFolder) => inFolders.find((i: IFolder) => i.id === f.id))
        ) {
            return onClose()
        }

        post({
            url: `/recipe/${recipeId}/save`,
            data: {folders: markedFolders.map(f => f.id)},
            token: user?.token
        })
            .then(() => {
                onUpdateFolders(markedFolders)
                onClose()
            })
            .catch(e => {
                logError(e)
                setNewFolderError(e.response?.data?.message)
            })
    }
    const onClose = () => {
        resetNewFolder()
        setMarkedFolders([])
        onHide()
    }

    const xIcon = require('@/assets/icons/x.png')
    const savedImg = require('@/assets/images/saved-recipe.png')

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
        >
            <KeyboardAwareScrollView>
                <View style={{ width: '100%' }}>
                    <Pressable onPress={onClose} style={{ alignSelf: 'flex-end' }}>
                        <Image source={xIcon} style={{ width: 18, height: 18 }} />
                    </Pressable>
                </View>
                <View style={s.savedWrapper}>
                    <View style={s.savedCircle}>
                        <Image source={savedImg} style={{ width: 36, height: 36 }} />
                    </View>
                </View>
                <Text type='subtitle' style={{ textAlign: 'center' }}>{t('New recipe has been saved')}</Text>
                <Text style={[s.text, {color: isLight() ? Colors.grey : Colors.lightGrey}]}>
                    {t('Also you can save it to your own folder(s)')}
                </Text>

                <View style={s.items}>
                {folders.map((folder, index) => {
                    const isMarked = markedFolders.find((f: IFolder) => f.id === folder.id)
                    return <Button
                        key={index}
                        text={folder.title}
                        shape="round"
                        size="small"
                        style={[
                            s.itemBtn,
                            {backgroundColor: isLight() ? '#F5F5F5' : '#F5F5F510'},
                            isMarked ? s.itemSelected : {}
                        ]}
                        textStyle={isMarked ? s.itemTextSelected : {color: isLight() ? '#000000A6' : '#FFFFFFA6'}}
                        onPress={() => toggleFolder(folder)}
                    /> }
                )}
                </View>

                { !showNewFolder && <Pressable onPress={() => setShowNewFolder(true)}>
                    <Text type='link' style={s.addCategoryText}>{t('Add new folder')}</Text>
                </Pressable> }

                { showNewFolder && <TextInput
                    value={newFolder}
                    onChangeText={text => {
                        setNewFolder(text)
                        setNewFolderError('')
                    }}
                    placeholder={t('New folder name')}
                    styleContainer={s.newFolderInput}
                /> }

                {newFolderError && <Text style={s.newFolderError}>{newFolderError}</Text>}
            </KeyboardAwareScrollView>

            {/* close down the buttons */}
            {showNewFolder
            ? <View style={s.newFolderBtns}>
                <Button
                    text={t('Cancel')}
                    onPress={() => {
                        resetNewFolder()
                        setShowNewFolder(false)
                    }}
                    size="large"
                    style={{ width: '48%' }}
                />
                <Button
                    text={t('Add new folder')}
                    onPress={onAddNewFolder}
                    size="large"
                    style={{ width: '48%' }}
                />
            </View>
            : <Button
                text={t('Save')}
                onPress={onSave}
                size="large"
            />}
        </Modal>
    )
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.25,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },
    savedWrapper: {
        alignItems: 'center',
        marginTop: 26,
        marginBottom: 40,
    },
    savedCircle: {
        width: 96,
        height: 96,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C3803A1A',
    },
    text: {
        textAlign: 'center',
        paddingHorizontal: 32,
        marginTop: 6,
        marginBottom: 32,
    },
    items: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    itemBtn: {
        paddingHorizontal: 15,
        width: 'auto',
    },
    itemTextSelected: {
        fontWeight: 500,
        fontFamily: 'DMSans-Medium',
    },
    itemSelected: {
        backgroundColor: Colors.mainColor,
    },
    addCategoryText: {
        fontWeight: 500,
        fontFamily: 'DMSans-Medium',
        marginTop: 16,
        marginBottom: 32,
    },
    newFolderInput: {
        marginVertical: 13,
    },
    newFolderError: {
        marginBottom: 12,
        color: Colors.mainColor,
    },
    newFolderBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
})