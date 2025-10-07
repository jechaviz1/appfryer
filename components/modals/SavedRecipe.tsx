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
import Header from '@/components/Header'

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
            style={[theme.modal, s.modal]}
        >
            <View style={s.container}>
                {/* <View style={theme.statusBarHeight} /> */}
                
                {/* Dark Header */}
                <Header
                    title={t('Saved recipes')}
                    onBack={onClose}
                />

                <KeyboardAwareScrollView style={s.mainContent} showsVerticalScrollIndicator={false}>
                    {/* Success Message */}
                    <View style={s.successSection}>
                        <View style={s.savedCircle}>
                            <Image source={savedImg} style={s.savedIcon} />
                        </View>
                        <Text style={s.successTitle}>{t('New recipe has been saved')}</Text>
                        <Text style={s.successSubtitle}>
                            {t('Also you can save it to your own folder(s)')}
                        </Text>
                    </View>

                    {/* Folders Section */}
                    <View style={s.foldersSection}>
                        <Text style={s.sectionTitle}>{t('Choose folders')}</Text>
                        <View style={s.foldersContainer}>
                            {folders.map((folder, index) => {
                                const isMarked = markedFolders.find((f: IFolder) => f.id === folder.id)
                                return (
                                    <Pressable
                                        key={index}
                                        style={[s.folderItem, isMarked && s.folderItemSelected]}
                                        onPress={() => toggleFolder(folder)}
                                    >
                                        <Text style={[s.folderText, isMarked && s.folderTextSelected]}>
                                            {folder.title}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                    {/* Add New Folder */}
                    {!showNewFolder && (
                        <Pressable onPress={() => setShowNewFolder(true)} style={s.addFolderButton}>
                            <Text style={s.addFolderText}>{t('Add new folder')}</Text>
                        </Pressable>
                    )}

                    {showNewFolder && (
                        <View style={s.newFolderSection}>
                            <TextInput
                                value={newFolder}
                                onChangeText={text => {
                                    setNewFolder(text)
                                    setNewFolderError('')
                                }}
                                placeholder={t('New folder name')}
                                styleContainer={s.newFolderInput}
                            />
                            {newFolderError && <Text style={s.newFolderError}>{newFolderError}</Text>}
                        </View>
                    )}
                </KeyboardAwareScrollView>

                {/* Action Buttons */}
                <View style={s.actionButtons}>
                    {showNewFolder ? (
                        <View style={s.newFolderBtns}>
                            <Button
                                text={t('Cancel')}
                                onPress={() => {
                                    resetNewFolder()
                                    setShowNewFolder(false)
                                }}
                                size="large"
                                style={s.cancelButton}
                            />
                            <Button
                                text={t('Add new folder')}
                                onPress={onAddNewFolder}
                                size="large"
                                style={s.addButton}
                            />
                        </View>
                    ) : (
                        <Button
                            text={t('Save')}
                            onPress={onSave}
                            size="large"
                            style={s.saveButton}
                        />
                    )}
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    modal: {
        margin: 0,
        padding: 0,
        // backgroundColor: getBgColor()
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: getBgColor(),
    },
    successSection: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: 'white',
        marginHorizontal: -24,
        marginBottom: 24,
        borderRadius: 0,
    },
    savedCircle: {
        width: 96,
        height: 96,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C3803A1A',
        marginBottom: 20,
    },
    savedIcon: {
        width: 36,
        height: 36,
    },
    successTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Poppins-Bold',
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6C7278',
        textAlign: 'center',
        paddingHorizontal: 32,
        fontFamily: 'Poppins',
    },
    foldersSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
        fontFamily: 'Poppins-Bold',
    },
    foldersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    folderItem: {
        backgroundColor: Colors.white,
        alignItems: 'center',
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 6.5,
        minWidth: 67,
        borderColor: '#EFF0F6',
        borderWidth: 1,
    },
    folderItemSelected: {
        backgroundColor: '#F6ECE2',
        borderColor: Colors.mainColor,
        borderWidth: 1,
    },
    folderText: {
        fontSize: 13,
        color: '#6C7278',
        fontFamily: 'Poppins',
        textAlign: 'center',
        lineHeight: 18,
    },
    folderTextSelected: {
        color: Colors.mainColor,
    },
    addFolderButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 20,
    },
    addFolderText: {
        color: '#C79F7B',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
    newFolderSection: {
        marginBottom: 20,
    },
    newFolderInput: {
        marginVertical: 13,
    },
    newFolderError: {
        marginBottom: 12,
        color: Colors.mainColor,
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    actionButtons: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: getBgColor(),
    },
    newFolderBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    addButton: {
        flex: 1,
    },
    saveButton: {
        width: '100%',
    },
})