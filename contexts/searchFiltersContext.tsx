import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react';


/**
 * Context that provides the storage for user's search filters settings and a function to update them.
 * The settings is an object with arbitrary properties.
 */
type SearchFiltersContextType = {
    searchFilters: { [key: string]: any } | null;
    setSearchFilters: Dispatch<SetStateAction<{ [key: string]: any } | null>>;
}

const SearchFiltersContext = createContext<SearchFiltersContextType | undefined>(undefined)

/**
 * Provides the storage for user's search filters settings and a function to update them.
 * The settings is an object with arbitrary properties.
 * Throws an error if used outside of the SearchFiltersProvider component.
 */
const useSearchFilters = (): SearchFiltersContextType => {
    const context = useContext(SearchFiltersContext)
    if (context === undefined) {
        throw new Error('useSearchFilters must be used within a SearchFiltersProvider')
    }

    return context
}


const SearchFiltersProvider = (props: { children: ReactNode }) => {
    const [searchFilters, setSearchFilters] = useState<{ [key: string]: any } | null>(null);

    return (
        <SearchFiltersContext.Provider {...props} value={{ searchFilters, setSearchFilters }} />
    )
}

export { useSearchFilters, SearchFiltersProvider }