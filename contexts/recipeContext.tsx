import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react'

/**
 * Context that provides the current recipe (new or editing) and a function to update the state.
 * The recipe is an object with arbitrary properties, because it filled step by step.
 */
type RecipeContextType = {
    recipe: { [key: string]: any } | null;
    setRecipe: Dispatch<SetStateAction<{ [key: string]: any } | null>>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined)

/**
 * Provides the current recipe and a function to update the state.
 * The recipe is an object with arbitrary properties, because it filled step by step.
 * Throws an error if used outside of the RecipeProvider component.
 */
const useRecipe = (): RecipeContextType => {
    const context = useContext(RecipeContext)
    if (context === undefined) {
        throw new Error('useRecipe must be used within a RecipeProvider')
    }

    return context
}


const RecipeProvider = (props: { children: ReactNode }) => {
    const [recipe, setRecipe] = useState<{ [key: string]: any } | null>(null);

    return (
        <RecipeContext.Provider {...props} value={{ recipe, setRecipe }} />
    )
}

export { useRecipe, RecipeProvider }