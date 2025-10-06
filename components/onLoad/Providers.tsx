import { AuthProvider } from '@/contexts/authContext'
import { SettingsProvider } from '@/contexts/settingsContext'
import { SearchFiltersProvider } from '@/contexts/searchFiltersContext'
import { AppStateProvider } from '@/contexts/appStateContext'
import { RecipeProvider } from '@/contexts/recipeContext'
import { SavedRecipeProvider } from '@/contexts/savedRecipeContext'
import ProviderActions from '@/components/onLoad/ProviderActions'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                <SearchFiltersProvider>
                    <AppStateProvider>
                        <RecipeProvider>
                            <SavedRecipeProvider>
                                <ProviderActions>
                                    {children}
                                </ProviderActions>
                            </SavedRecipeProvider>
                        </RecipeProvider>
                    </AppStateProvider>
                </SearchFiltersProvider>
            </SettingsProvider>
        </AuthProvider>
    )
}