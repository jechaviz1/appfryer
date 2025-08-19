import { Image, Pressable, StyleSheet } from "react-native"
import { Colors } from "@/constants/Colors"

type IconButtonProps = {
    icon: any,
    onPress: () => void,
    style?: any,
}
export function IconButton (props: IconButtonProps) {
    const { icon, onPress } = props

    return (
        <Pressable
            style={[s.button, props.style]}
            onPress={onPress}
        >
            <Image source={icon} style={{ width: 24, height: 24 }} />
        </Pressable>
    )
}

const s = StyleSheet.create({
    button: {
        flex: 1,
        borderColor: Colors.lightGrey,
        borderWidth: 1,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        padding: 12,
    }
})