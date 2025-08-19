import { useEffect, useState } from "react"
import { Dimensions, Image, Pressable, StyleSheet } from "react-native"
import Modal from "react-native-modal"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

import { ModalTitle, ScrollView, Text, View } from "@/components/base/BaseComponents"
import FolderCard from "@/components/FolderCard"
import OwnRecipeCard from "@/components/OwnRecipeCard"
import { get, post } from "@/services/apiRequests"
import { useAuth } from '@/contexts/authContext'
import { theme, getBgColor, paddings } from "@/constants/Theme"
import IFolder, { IFolderWithRecipes } from "@/interfaces/Folder"
import IRecipe from "@/interfaces/Recipe"
import { logError } from "@/services/utils"

interface Props {
    folderId?: number | null
    isVisible: boolean
    onHide: () => void
}

export default function Folders({folderId = null, isVisible, onHide }: Props) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [title, setTitle] = useState<string>('Saved folders')
    const [folders, setFolders] = useState<IFolder[]>([]) // need when user directly open the folder, without list
    const [foldersWRecipes, setFoldersWRecipes] = useState<IFolderWithRecipes[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(folderId)
    const [recipes, setRecipes] = useState<IRecipe[]>([])

    useEffect(() => {
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

        if (!currentFolderId) {
            get({url: '/feed/folders', token: user?.token})
                .then((foldersData: IFolderWithRecipes[]) => setFoldersWRecipes(foldersData))
                .catch(logError)
        }
    }, [])
    
    useEffect(() => {
        if (currentFolderId !== null) {
            setTitle(folders.find(f => f.id === currentFolderId)?.title || 'Saved recipes')
            post({url: `/feed/folder/${currentFolderId}`, token: user?.token})
                .then((recipesData: IRecipe[]) => setRecipes(recipesData))
                .catch(logError)
        }
    }, [currentFolderId, folders])

    const hideAndReset = () => {
        setCurrentFolderId(null)
        setRecipes([])
        setTitle(t('Saved folders'))
        onHide()
    }

    const onFolderChanged = (action: 'renamed' | 'deleted', id: number, newTitle?: string) => {
        let newFolders: IFolder[]
        switch(action) {
            case 'renamed':
                setFoldersWRecipes(foldersWRecipes.map(f => f.id === id ? {...f, title: newTitle!} : f))
                newFolders = folders.map(f => f.id === id ? {...f, title: newTitle!} : f)
                break
            case 'deleted':
                setFoldersWRecipes(foldersWRecipes.filter(f => f.id !== id))
                newFolders = foldersWRecipes.filter(f => f.id !== id)
                break
            }
        setFolders(newFolders)
    }

    const window = Dimensions.get('window')
    const xIcon = require('@/assets/icons/x.png')

    return <Modal
        isVisible={isVisible}
        onBackdropPress={hideAndReset}
        style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
    >
        <ScrollView>
            <View style={{ width: '100%' }}>
                <Pressable onPress={hideAndReset} style={{ alignSelf: 'flex-end' }}>
                    <Image source={xIcon} style={{ width: 18, height: 18 }} />
                </Pressable>
            </View>
            
            {currentFolderId !== null
                ? <ModalTitle title={title} onHide={() => {
                    setTitle(t('Saved folders'))
                    setRecipes([])
                    setCurrentFolderId(null) }}/>
                : <Text style={theme.modalTopbarWrap} type="subtitle">{title}</Text>
            }

            <View style={[s.recipesWrapper, {width: window.width - paddings * 2}]}>
                {currentFolderId === null
                    ? foldersWRecipes.length > 0 && foldersWRecipes.map(folder => (
                        <Pressable onPress={() => setCurrentFolderId(folder.id)} key={folder.id}>
                            <FolderCard folder={folder} onFolderChanged={onFolderChanged} />
                        </Pressable>
                    ))
                    : recipes.map(recipe => (
                        <OwnRecipeCard recipe={recipe} onHide={hideAndReset} key={recipe.id}/>
                    ))
                }
            </View>

        </ScrollView>
    </Modal>
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.25,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },

    recipesWrapper: {
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
})