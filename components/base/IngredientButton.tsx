import { Image,Pressable, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/base/Text"
import ImageLibrary from "../ImageLibrary"
import { Colors } from "@/constants/Colors"
import IPrefItem from "@/interfaces/PrefItem"

interface IngredientButtonProps {
    ingredient: IPrefItem
    onPress?: () => void
    checked?: boolean
    needRemoveIcon?: boolean
}
export function IngredientButton({
    ingredient,
    onPress,
    checked = false,
    needRemoveIcon,
}: IngredientButtonProps) {
    const { t } = useTranslation()

    return (
        <Pressable
            style={[ s.button, checked && s.buttonActive ]}
            onPress={onPress ? onPress : () => console.log("Add ingredients")}
        >
            {/* <Image source={ImageLibrary[ingredient.icon as keyof typeof ImageLibrary]} style={s.img} /> */}
            <Image source={ImageLibrary.icons[ingredient.icon as keyof typeof ImageLibrary.icons]} style={s.img} />
            {/* <Image source={{uri: ingredient.thumb}} style={s.img} /> */}

            <Text style={[ s.text, checked && s.textActive ]}>
                {ingredient.title}
            </Text>
            {needRemoveIcon && <Image source={require("@/assets/icons/circle-x.png")} style={{ width: 14, height: 14 }}/>}
        </Pressable>
    )
}

const s = StyleSheet.create({
    button: {
        backgroundColor: Colors.mainColorLight,
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    buttonActive: {
        backgroundColor: Colors.mainColor,
    },
    img: {
        width: 18,
        height: 18,
    },
    text: {
        color: Colors.mainColor,
    },
    textActive: {
        color: Colors.white,
    },
})
//         <Button
//             text={ingredient.title}
//             shape="round"
//             size="small"
//             onPress={() => console.log("Add ingredients")}
//         />
//     )
// }