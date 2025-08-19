import { useCallback, useEffect, useState } from "react"
import { Image, Pressable, StyleSheet } from "react-native"

import { Text, View } from "@/components/base/BaseComponents"
import FolderMenu from "@/components/modals/FolderMenu"
import { IFolderWithRecipes } from "@/interfaces/Folder"
import IMedia from '@/interfaces/Media'
import { Colors } from "@/constants/Colors"

interface Props {
    folder: IFolderWithRecipes
    onFolderChanged: (action: 'renamed' | 'deleted', id: number, title?: string) => void
}

export default function FolderCard({folder, onFolderChanged}: Props) {
    const [showMenu, setShowMenu] = useState(false)
    const [images, setImages] = useState<string[]>([])

    const findFirstImage = useCallback((medias: IMedia[]) => {
        for (let i = 0; i < medias.length; i++) {
            if (medias[i].type === 'image') {
                return medias[i].url
            }
        }
        return medias[0]?.url
    }, [folder])

    useEffect(() => {
        if (!folder?.recipes?.length) {
            return
        }
        setImages(folder.recipes.map(recipe => findFirstImage(recipe.medias)))
    }, [folder])

    return (
        <View style={s.container}>
            {folder.id !== 0 && <FolderMenu
                isVisible={showMenu}
                folder={folder}
                onHide={() => setShowMenu(false)}
                onFolderChanged={onFolderChanged}
            /> }
            <View style={s.imageContainer}>
                {folder.id !== 0 && <Pressable style={s.threeDotsWrapper} onPress={() => setShowMenu(true)}>
                    <Image source={require('@/assets/icons/three-dots.png')} style={{width: 12, height: 2}}/>
                </Pressable> }
                {images.map((image, index) => <Image
                    key={index}
                    source={image ? {uri: image} : undefined}
                    style={images.length === 1 ? s.oneRecipe : s.moreRecipes}
                />)}
            </View>
            <Text>{folder.title}</Text>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        position: 'relative',
        maxWidth: '50%',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 166,
        height: 170,
        borderRadius: 14,
        overflow: 'hidden',
    },
    threeDotsWrapper: {
        position: 'absolute',
        zIndex: 100,
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGrey + 'd0',
        borderRadius: 50,
        borderColor: Colors.mainColor,
        borderWidth: 1,
        padding: 10,
    },
    oneRecipe: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    moreRecipes: {
        width: '50%',
        height: '50%',
    },
})