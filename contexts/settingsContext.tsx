
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react'


/**
 * Context that provides the settings for current user and a function to update them.
 * The settings is an object with arbitrary properties.
 */
type SettingsContextType = {
    settings: { [key: string]: any } | null;
    setSettings: Dispatch<SetStateAction<{ [key: string]: any } | null>>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Provides the settings for current user and a function to update them.
 * The settings is an object with arbitrary properties.
 * Throws an error if used outside of the SettingsProvider component.
 */
const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within a SettingsProvider')
    }

    return context
}


const SettingsProvider = (props: { children: ReactNode }) => {
    const [settings, setSettings] = useState<{ [key: string]: any } | null>(null)

    return (
        <SettingsContext.Provider {...props} value={{ settings, setSettings }} />
    )
}

export { useSettings, SettingsProvider }