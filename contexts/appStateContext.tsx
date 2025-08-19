import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react'
import { VideoRef } from 'react-native-video'

import IRecipe from '@/interfaces/Recipe'

export interface IStaticPage {
    id: number
    name: string
    title: string
    body: string
    language: string
    fetchedAt: Date
}

interface IAppState {
    languages: Record<string, string>
    isNewNotifications: boolean
    notification: {
        text: string
        type: 'success' | 'info' | 'warning' | 'error'
    }
    targetVideo: number | null
    playingVideoRef: VideoRef | null
    actualRecipe: IRecipe | undefined
    staticPages: IStaticPage[]
    sendedMissingTranslations: string[]
}


/**
 * Context that provides the current user and a function to update the user.
 * The user is an object with arbitrary properties.
 */
type AppStateContextType = {
    appState: IAppState
    setAppState: Dispatch<SetStateAction<IAppState>>
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

/**
 * Provides the current user and a function to update the user.
 * The user is an object with arbitrary properties.
 * Throws an error if used outside of the AuthProvider component.
 */
const useAppState = (): AppStateContextType => {
    const context = useContext(AppStateContext)
    if (context === undefined) {
        throw new Error('useService must be used within a ServiceProvider')
    }

    return context
}


const AppStateProvider = (props: { children: ReactNode }) => {
    const [appState, setAppState] = useState<IAppState>({
        languages: {},
        isNewNotifications: false,
        notification: {
            text: '',
            type: 'success',
        },
        targetVideo: null,
        playingVideoRef: null,
        actualRecipe: undefined,
        staticPages: [],
        sendedMissingTranslations: [],
    })

    return (
        <AppStateContext.Provider {...props} value={{ appState, setAppState }} />
    )
}

export { useAppState, AppStateProvider }