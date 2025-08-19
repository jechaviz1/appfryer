import { Image, Pressable, StyleSheet, type TextProps } from "react-native"
import { View } from "@/components/base/View"
import { Text } from "@/components/base/Text"
import { Colors } from "@/constants/Colors"
import { isLight } from "@/constants/Theme"

type CheckboxProps = TextProps & {
    text?: string,
    type?: "round" | "square",
    checked: boolean,
    disabled?: boolean
    onPress: () => void,
    style?: any,
    containerStyle?: any,
}
export function Checkbox (props: CheckboxProps) {
    const { text, type = "round", checked, disabled, onPress } = props
    const checkMark = require('@/assets/icons/checkmark.png')
    const checkboxBackgroundColor = isLight() ? Colors.white : Colors.black

    return (
        <Pressable onPress={() => !disabled && onPress()} style={[s.container, props.containerStyle]}>
            <View style={[
                s.checkbox,
                { borderRadius: type === "round" ? 999 : 4 }
            ]}>
                <View
                    style={[
                        s.checkboxInner,
                        {
                            backgroundColor: checked ? Colors.mainColor : checkboxBackgroundColor,
                            borderRadius: type === "round" ? 999 : 3,
                        }
                    ]}>
                        { checked && <Image source={checkMark} width={9} height={9}/> }
                </View>

            </View>
            {props.children
                ? props.children :
                text && <Text style={[{color: isLight() ? Colors.grey : Colors.lightGrey}, props.style]}>{text}</Text>
            }
        </Pressable>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginVertical: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.mainColor,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxInner: {
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
    },
})