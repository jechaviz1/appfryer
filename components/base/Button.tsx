import { Image, ImageSourcePropType, Pressable, StyleSheet } from "react-native"

import { Colors } from "@/constants/Colors"
import { Text } from "@/components/base/Text"

interface ButtonProps {
    text?: string,
    shape?: "square" | "round",
    size?: "large" | "medium" | "small",
    isWide?: boolean,
    disabled?: boolean,
    onPress: () => void,
    style?: any,
    textStyle?: any,
    preIcon?: ImageSourcePropType,
    postIcon?: ImageSourcePropType,
}
export function Button ({
    text,
    shape = "square",
    size = "medium",
    disabled = false,
    onPress,
    isWide = true,
    style,
    textStyle,
    preIcon,
    postIcon,
}: ButtonProps) {
    const radiuses = {
        round: 999,
        square: 10,
    }
    const lineSizes = {
        large: 52,
        medium: 44,
        small: 30,
    }
    const fontWeights = {
        large: 'Poppins-Bold',
        medium: 'Poppins-Medium',
        small: 'Poppins',
    }
    const iconSizes = {
        large: 24,
        medium: 18,
        small: 14,
    }

    const handleDisabledPress = () => {
        // Do nothing when disabled
    }

    return (
        <Pressable
            style={[
                styles.button,
                {
                    borderRadius: radiuses[shape],
                    width: isWide ? "100%" : undefined,
                    backgroundColor: disabled ? Colors.disabledButton : Colors.mainColor,
                    height: lineSizes[size],
                },
                style
            ]}
            onPress={disabled ? handleDisabledPress : onPress}
        >
            { preIcon && <Image
                source={preIcon}
                style={{ width: iconSizes[size], height: iconSizes[size], objectFit: 'contain' }}
            /> }
            { text && <Text style={[
                styles.text,
                { fontFamily: fontWeights[size], },
                textStyle,
            ]}>{text}</Text> }
            { postIcon && <Image
                source={postIcon}
                style={{ width: iconSizes[size], height: iconSizes[size], objectFit: 'contain' }}
            /> }
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        alignContent: "center",
        justifyContent: "center",
        borderRadius: 999,
        alignItems: "center",
        flexDirection: "row",
    },
    text: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    }
})