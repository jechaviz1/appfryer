import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Text, View } from "@/components/base/BaseComponents"
import { theme, isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'

interface Props {
    onClose: () => void
}

export default function CookingInitTab ({onClose}: Props) {
    const { t } = useTranslation()
    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={{ marginTop: 40 }}>
            <Pressable onPress={onClose}>
                <Image source={isLight() ? backIconLight : backIconDark} style={s.simpleBackButton} />
            </Pressable>

            <Image source={require('@/assets/images/chef.png')} style={ s.chefImg } />
            <View style={s.textContainer}>
                <Text type="subtitle" style={[theme.centerAlign, { fontSize: 22 }]}>{t("Let’s start cooking!")}</Text>
                <Text style={[theme.centerAlign, {
                    marginTop: 14,
                    color: isLight() ? Colors.grey : Colors.lightGrey
                }]}>
                    {t("Follow the steps and we’ll help you cooking this recipe")}
                </Text>
            </View>
        </View>
)}

const s = StyleSheet.create({
    simpleBackButton: {
        width: 16,
        height: 16,
    },
    chefImg: {
        marginVertical: 45,
        marginHorizontal: 'auto',
        width: 295,
        height: 295,
    },
    textContainer: {
        paddingHorizontal: 72,
    },
})