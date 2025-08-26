import { Appearance, Platform, StyleSheet } from 'react-native'
import Constants from 'expo-constants'
import { Colors } from './Colors'

export const paddings = 15

export const isLight = () => Appearance.getColorScheme() === 'light'
export function getBgColor() {
    return isLight() ? Colors.white : Colors.dark.background
}

// const bottomMargin = 46
const bottomMargin = 0

export const theme = StyleSheet.create({
    statusBarHeight: {
        marginTop: Constants.statusBarHeight,
    },
    container: {
        marginBottom: bottomMargin,
        minHeight: '100%',
    },
    mainContainer: {
        paddingHorizontal: paddings,
        paddingTop: 0,
        paddingBottom: bottomMargin + Constants.statusBarHeight,
        minHeight: '100%',
    },
    authContainer: {
        height: '100%',
        flex: 1,
        flexDirection: 'column',
        alignContent: 'space-between',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'ios' ? 26 : 92,
    },
    titleContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, 
    },
    appNameText: {
        color: Colors.mainColor,
        fontFamily: 'Poppins-Bold',
        fontSize: 46,
        lineHeight: 72,
        paddingTop: 6,
        paddingBottom: 42,
    },
    pageTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 30,
        lineHeight: 42,
    },
    seeMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.mainColorLight,
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 8,
    },

    // New / Trend / Seasonal
    catTabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    catTabWrapper: {
        marginHorizontal: 'auto',
        flex: 1,
    },
    catTab: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'auto',
    },
    catTabBottomLine: {
        height: 2,
        width: '100%',
        marginTop: 6,
    },
    catTabActive: {
        borderColor: Colors.mainColor,
        borderBottomWidth: 2,
        borderRadius: 999,
    },
    catTabImg: {
        width: 20,
        height: 20,
    },
    catTabTextActive: {
        color: Colors.mainColor,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 20,
        justifyContent: 'center',
    },
    tabCaptionWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.mainColor,
    },
    tabCaption: {
        fontFamily: 'Poppins-Medium',
        lineHeight: 32,
    },
    tabsFlatList: {
        flexDirection: 'row',
        marginTop: 20,
    },
    tabInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Badges
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    recipeBadge: {
        backgroundColor: Colors.danger,
        borderRadius: 20,
        paddingHorizontal: 8,
    },
    recipeBadgeText: {
        color: Colors.white,
    },

    // Modals
    modal: {
        // borderRadius: 20,
        width: '100%',
        marginHorizontal: 0,
        marginVertical: 0,
        paddingTop: Constants.statusBarHeight,
        padding: paddings,
        paddingBottom: 27,
    },
    modalTopbarWrap: {
        gap: 16,
        alignItems: 'center',
        width: '99%',
        marginTop: 20,
        marginBottom: 16,
    },
    modalTopbarInner: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },

    // pages
    titleImageWrapper: {
        position: 'relative',
        marginBottom: 8,
    },
    titleImage: {
        width: '100%',
        height: 328,
        marginBottom: 12,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    section: {
        padding: 15,
        borderRadius: 12,
        shadowColor: "#aaa",
        shadowOffset: {
            width: 10,
            height: 10,
        },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 30,
    },

    // rate
    rateRecipeStars: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 23,
        shadowColor: "#ccc",
        shadowOffset: {
            width: 10,
            height: 10,
        },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 10,
        borderRadius: 14,
    },
    rateRecipeStar: {
        width: 40,
        height: 40,
    },

    // elements
    backButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
        backgroundColor: '#49666B96',
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    centerAlign: {
        width: '100%',
        textAlign: 'center',
        marginHorizontal: 'auto',
        alignContent: 'center',
        justifyContent: 'center',
    },  

    // Auth common styles
    authScreenContainer: {
        flex: 1,
        height: '50%',
    },
    authBackgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '50%',
        backgroundColor: Colors.auth.backgroundOverlay,
    },
    authBackgroundWhiteOverlay: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.white,
    },
    authScrollView: {
        flex: 1,
        height: '100%',
    },
    authMainContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 60,
        minHeight: '100%',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    authLogoContainer: {
        alignItems: 'center',
        marginBottom: 25,
        backgroundColor: 'transparent',
    },
    authLogoImage: {
        width: 30,
        height: 30,
    },
    authTitleSection: {
        alignItems: 'center',
        marginBottom: 25,
        backgroundColor: 'transparent',
    },
    authTitle: {
        fontSize: 39,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        textAlign: 'center',
        color: Colors.white,
        marginBottom: 8,
        lineHeight: 50,
        letterSpacing: 0,
    },
    authWelcomeText: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        textAlign: 'center',
        color: Colors.white,
        letterSpacing: 0,
    },
    authFormSection: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        padding: 27,    
        shadowColor: Colors.auth.formShadow,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    authInputContainer: {
        backgroundColor: Colors.white,
        borderColor: Colors.auth.inputBorder,
        borderWidth: 1,
        borderRadius: 12,
        shadowColor: Colors.auth.inputShadow,
        shadowOffset: {
            width: 0,
            height: 1.1,
        },
        shadowOpacity: 1,
        shadowRadius: 2.2,
        elevation: 3,
        marginBottom: 16,
    },
    authErrorText: {
        marginBottom: 16,
    },
    authPrimaryButton: {
        backgroundColor: Colors.mainColor,
        borderRadius: 11,
        borderWidth: 1.1,
        width: '100%',
        height: 53,
        paddingTop: 11,
        paddingRight: 27,
        paddingBottom: 11,
        fontFamily: 'Poppins-Medium',
        paddingLeft: 27,
        borderColor: Colors.auth.inputBorder,
        marginVertical: 16,
    },
    authDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    authDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.auth.dividerLine,
    },
    authDividerCircle: {
        width: 12,
        height: 12,
        borderRadius: 8,
        borderWidth: 2,
        marginHorizontal: 16,
        borderColor: Colors.greyTextColor,
    },
    authSocialButtonsContainer: {
        gap: 12,
        marginVertical: 16,
    },
    authSocialButton: {
        backgroundColor: Colors.white,
        borderColor: Colors.auth.socialButtonBorder,
        borderWidth: 1,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    authSocialIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    authSocialButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: Colors.auth.socialButtonText,
        lineHeight: 20,
        letterSpacing: -0.14,
        textAlign: 'center',
    },
    authLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    authSecondaryText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '500',
        color: Colors.greyTextColor,
        lineHeight: 19.6,
        letterSpacing: -0.14,
    },
    authLinkText: {
        color: Colors.mainColor,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 19.6,
        letterSpacing: -0.14,
    },
    authCheckbox: {
        fontFamily: 'Poppins-SemiBold',
    },
})