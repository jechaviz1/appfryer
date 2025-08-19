import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react'


/**
 * Context that provides the current user and a function to update the user.
 * The user is an object with arbitrary properties.
 */
type AuthContextType = {
    user: { [key: string]: any } | null;
    setUser: Dispatch<SetStateAction<{ [key: string]: any } | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provides the current user and a function to update the user.
 * The user is an object with arbitrary properties.
 * Throws an error if used outside of the AuthProvider component.
 */
const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider')
    }

    return context
}


const AuthProvider = (props: { children: ReactNode }) => {
    const [user, setUser] = useState<{ [key: string]: any } | null>(null)

    return (
        <AuthContext.Provider {...props} value={{ user, setUser }} />
    )
}

export { useAuth, AuthProvider }