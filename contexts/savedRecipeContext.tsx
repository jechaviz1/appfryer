import React, { createContext, useContext, useState, ReactNode } from 'react'
import SavedRecipe from '@/components/modals/SavedRecipe'
import IFolder from '@/interfaces/Folder'

interface SavedRecipeContextType {
    showSavedRecipeModal: (recipeId: number, folders?: IFolder[]) => void
    hideSavedRecipeModal: () => void
}

const SavedRecipeContext = createContext<SavedRecipeContextType | undefined>(undefined)

interface SavedRecipeProviderProps {
    children: ReactNode
}

export function SavedRecipeProvider({ children }: SavedRecipeProviderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [recipeId, setRecipeId] = useState<number | null>(null)
    const [folders, setFolders] = useState<IFolder[]>([])

    const showSavedRecipeModal = (id: number, initialFolders: IFolder[] = []) => {
        setRecipeId(id)
        setFolders(initialFolders)
        setIsVisible(true)
    }

    const hideSavedRecipeModal = () => {
        setIsVisible(false)
        setRecipeId(null)
        setFolders([])
    }

    const handleUpdateFolders = (updatedFolders: IFolder[]) => {
        setFolders(updatedFolders)
    }

    return (
        <SavedRecipeContext.Provider value={{ showSavedRecipeModal, hideSavedRecipeModal }}>
            {children}
            {isVisible && recipeId && (
                <SavedRecipe
                    isVisible={isVisible}
                    recipeId={recipeId}
                    onHide={hideSavedRecipeModal}
                    inFolders={folders}
                    onUpdateFolders={handleUpdateFolders}
                />
            )}
        </SavedRecipeContext.Provider>
    )
}

export function useSavedRecipe() {
    const context = useContext(SavedRecipeContext)
    if (context === undefined) {
        throw new Error('useSavedRecipe must be used within a SavedRecipeProvider')
    }
    return context
}
