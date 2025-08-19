import { useState } from "react"
import { Dimensions, StyleSheet } from "react-native"
import Modal from "react-native-modal"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

import { Button, Text, TextInput, View } from '@/components/base/BaseComponents'
import { useAuth } from '@/contexts/authContext'
import { post } from "@/services/apiRequests"
import { theme, getBgColor } from "@/constants/Theme"
import { Colors } from "@/constants/Colors"
import IFolder from "@/interfaces/Folder"
import { logError } from "@/services/utils"

interface Props {
    folder: IFolder
    isVisible: boolean
    onHide: () => void
    onFolderChanged: (action: 'renamed' | 'deleted', id: number, title?: string) => void
}

export default function FolderMenu({folder, isVisible, onHide, onFolderChanged }: Props) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [changingName, setChangingName] = useState<boolean>(false)
    const [newName, setNewName] = useState<string>('')
    const [error, setError] = useState<string>('')

    const hideAndReset = () => {
        setChangingName(false)
        setNewName('')
        setError('')
        onHide()
    }

    const handleRename = () => {
        if (!newName || newName && (newName.length < 2 || newName.length > 20)) {
            return setError(t('Folder title must be at least 2 and no longer than 20 characters'))
        }
        post({
            url: `/profile/folder/${folder.id}/rename`,
            data: { title: newName },
            token: user?.token
        }).then((newFolder: IFolder) => {
            onFolderChanged('renamed', folder.id, newName)
            AsyncStorage.getItem('userFolders')
                .then(userFoldersStr => {
                    if (userFoldersStr) {
                        const folders = JSON.parse(userFoldersStr) as IFolder[]
                        const newFolders = folders.map(f => f.id === folder.id ? newFolder : f)
                        AsyncStorage.setItem('userFolders', JSON.stringify(newFolders))
                    }
                    hideAndReset()
                })
        }).catch((e) => {
            logError(e)
            setError(e.response?.data?.message)
        })
    }

    const handleDelete = () => {
        post({
            url: `/profile/folder/${folder.id}/delete`,
            token: user?.token
        }).then((existedFolders: IFolder[]) => {
            onFolderChanged('deleted', folder.id)
            AsyncStorage.setItem('userFolders', JSON.stringify(existedFolders))
            hideAndReset()
        }).catch((e) => {
            logError(e)
            setError(e.response?.data?.message)
        })
    }

    return <Modal
            isVisible={isVisible}
            onBackdropPress={hideAndReset}
            style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
        >
            <Text type="caption">{folder.title}</Text>
            { changingName
            ? ( <View style={s.mainPart}>
                <TextInput
                    placeholder={t('New folder name')}
                    value={newName}
                    onChangeText={setNewName}
                />
                {error !== '' && <Text type="error">{error}</Text>}
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button
                        text={t('Cancel')}
                        onPress={() => {
                            setChangingName(false)
                            setError('')
                            setNewName('')
                        }}
                        style={{ width: '48%' }}
                    />
                    <Button
                        text={t('Save')}
                        onPress={handleRename}
                        style={{ width: '48%' }}
                    />
                </View>
            </View> )
            : ( <View style={s.mainPart}>
                {error !== '' && <Text type="error">{error}</Text>}
                <Button
                    text={t('Rename folder')}
                    onPress={() => setChangingName(true)}
                />

                <Button
                    text={t('Delete folder')}
                    onPress={handleDelete}
                    style={{ backgroundColor: Colors.danger }}
                />
            </View> ) }
        </Modal>
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.25,
        maxHeight: 220,
        paddingTop: 16,
    },
    mainPart: {
        gap: 12,
        flex: 1,
        justifyContent: 'flex-end',
    }
})