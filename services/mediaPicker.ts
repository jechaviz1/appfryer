import { NativeModules, Platform } from 'react-native'
import { Asset, ImageLibraryOptions, ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker'
import { requireOptionalNativeModule } from 'expo-modules-core'

// Expo's image picker module is named `ExponentImagePicker` and exposes the async helpers used by
// `expo-image-picker`. We only depend on the handful of methods that are required for the fallback.
interface ExpoImagePickerModule {
    requestMediaLibraryPermissionsAsync(writeOnly: boolean): Promise<{ granted: boolean }>
    launchImageLibraryAsync(options: ExpoLaunchImageLibraryOptions): Promise<ExpoImagePickerResult>
}

type ExpoMediaTypeOptions = 'All' | 'Images' | 'Videos'
type ExpoVideoQuality = 'low' | 'medium' | 'high'

type ExpoLaunchImageLibraryOptions = {
    mediaTypes?: ExpoMediaTypeOptions
    quality?: number
    allowsMultipleSelection?: boolean
    selectionLimit?: number
    base64?: boolean
    videoQuality?: ExpoVideoQuality
}

type ExpoImagePickerAsset = {
    uri: string
    width?: number | null
    height?: number | null
    fileName?: string | null
    fileSize?: number | null
    type?: string | null
    duration?: number | null
    base64?: string | null
}

type ExpoImagePickerResult = {
    canceled: boolean
    assets?: ExpoImagePickerAsset[]
}

const getExpoImagePickerModule = (): ExpoImagePickerModule | null =>
    requireOptionalNativeModule<ExpoImagePickerModule>('ExponentImagePicker')

const hasNativeImagePicker = (): boolean => {
    if (Platform.OS === 'web') {
        // The web implementation is bundled with react-native-image-picker itself.
        return true
    }

    const { ImagePicker, ImagePickerManager, ImagePickerModule } = NativeModules as {
        ImagePicker?: { launchImageLibrary?: unknown }
        ImagePickerManager?: { launchImageLibrary?: unknown }
        ImagePickerModule?: { launchImageLibrary?: unknown }
    }

    return Boolean(
        ImagePicker?.launchImageLibrary ||
        ImagePickerManager?.launchImageLibrary ||
        ImagePickerModule?.launchImageLibrary,
    )
}

const mapExpoAssetToAsset = (asset: ExpoImagePickerAsset): Asset => ({
    uri: asset.uri,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize ?? undefined,
    type: asset.type ?? undefined,
    duration: asset.duration ?? undefined,
    base64: asset.base64 ?? undefined,
})

const mapMediaType = (mediaType: ImageLibraryOptions['mediaType']): ExpoMediaTypeOptions => {
    switch (mediaType) {
        case 'video':
            return 'Videos'
        case 'mixed':
            return 'All'
        case 'photo':
        default:
            return 'Images'
    }
}

const createErrorResponse = (
    message: string,
    code: ImagePickerResponse['errorCode'] = 'others',
): ImagePickerResponse => ({
    errorCode: code,
    errorMessage: message,
})

const getExpoSelectionLimit = (selectionLimit: ImageLibraryOptions['selectionLimit']): number | undefined => {
    if (selectionLimit === undefined || selectionLimit === 1) {
        return undefined
    }
    // RN treats "0" as an alias for unlimited selection. Expo honours the same behaviour when
    // `selectionLimit` is provided.
    return selectionLimit === 0 || selectionLimit > 1 ? selectionLimit : undefined
}

export async function launchMediaLibrary(
    options: ImageLibraryOptions,
    callback?: (response: ImagePickerResponse) => void,
): Promise<ImagePickerResponse> {
    if (hasNativeImagePicker()) {
        try {
            const nativeResponse = await launchImageLibrary(options, callback)
            if (nativeResponse) {
                return nativeResponse
            }
        } catch (error) {
            // When the native module is unavailable we fall back to the Expo implementation below.
        }
    }

    const expoImagePicker = getExpoImagePickerModule()
    if (!expoImagePicker) {
        const response = createErrorResponse('Image picker is not available in this environment.')
        callback?.(response)
        return response
    }

    try {
        const permission = await expoImagePicker.requestMediaLibraryPermissionsAsync(false)
        if (!permission.granted) {
            const response = createErrorResponse('Media library permission was not granted.', 'permission')
            callback?.(response)
            return response
        }

        const result = await expoImagePicker.launchImageLibraryAsync({
            mediaTypes: mapMediaType(options.mediaType),
            quality: options.quality,
            base64: options.includeBase64,
            allowsMultipleSelection: (options.selectionLimit ?? 1) !== 1,
            selectionLimit: getExpoSelectionLimit(options.selectionLimit),
            videoQuality: options.videoQuality as ExpoVideoQuality | undefined,
        })

        const response: ImagePickerResponse = result.canceled
            ? { didCancel: true }
            : {
                assets: result.assets?.map(mapExpoAssetToAsset),
            }

        callback?.(response)
        return response
    } catch (error) {
        const response = createErrorResponse(
            error instanceof Error ? error.message : 'Failed to open image picker.',
        )
        callback?.(response)
        return response
    }
}
