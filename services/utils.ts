import AsyncStorage from '@react-native-async-storage/async-storage'

export const logError = (e: any, message?: string) => {
    console.error(message || '', e.response ? (e.response.status, e.response.data) : 'Err: ', e, e.message)
}

export const isNeedToUpdate = async (itemName: string) => {
    const lastUpdate = await AsyncStorage.getItem(itemName)
    if (!lastUpdate) {
        return true
    }
    const now = new Date()
    const lastUpdateDate = new Date(lastUpdate)
    if (now.getTime() - lastUpdateDate.getTime() > 24 * 60 * 60 * 1000) {
        return true
    }
    return false
}