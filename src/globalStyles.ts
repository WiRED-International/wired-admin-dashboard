

//color variables
const darkText = '#333';
const lightGray = '#f9f9f9';
const whiteTheme = '#fff';
const headerColor = '#508432';
const success = '#5cb85c';
const errorColor = '#D9534F';
const pageBackgroundMain = '#e0c6a8'

export const globalStyles = {
    colors: {
        headerColor: headerColor,
        whiteTheme: whiteTheme,
        darkButtonTheme: '#5a382d',
        darkText: darkText,
        pageBackgroundMain: '#e0c6a8',
        error: errorColor,
        lightGray: lightGray,
        whiteOverlay: 'rgba(255, 255, 255, 0.4)',
        success: success,
        singleUserViewBackground: '#D9D9D9',
        singleUserViewHeader: '#96C98B',

    },
    pageContainer: {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: pageBackgroundMain,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        color: darkText,
        alignItems: 'center' as const,
        overflow: 'auto',
        width: '100%',
    },
    header: {
        backgroundColor: headerColor,
        color: whiteTheme,
        padding: '20px',
        textAlign: 'center' as const,
        width: '100%',
    },
    //used in the filter form component
    label: {
        fontSize: '14px',
        marginBottom: '5px',
        color: darkText
    },
    authForm: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
    },
    authLabel: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: headerColor,
    },
    input: {
        display: 'block',
        padding: '8px',
        marginBottom: '10px',
        border: `1px solid ${darkText}`,
        borderRadius: '5px',
        width: '100%',
    },
    authInput: {
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: lightGray,
    },
    submitButton: {
        padding: '12px',
        fontSize: '16px',
        color: whiteTheme,
        backgroundColor: headerColor,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    authRedirect: {
        fontSize: '14px',
        color: headerColor,
        textAlign: 'center' as const,
        textDecoration: 'none',
    },
    authMainContent: {
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        gap: '20px',
        backgroundColor: whiteTheme,
        borderRadius: '8px',
        maxWidth: '500px',
        margin: 'auto',
    },
    authInputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    authSuccess: {
        color: success,
        fontSize: '14px',
    },
    authError: {
        color: errorColor,
        fontSize: '14px',
    },
    smallError: {
        fontSize: "12px",
        color: errorColor,
        marginTop: "0px",
    },
    modalMessage: {
        fontSize: '18px',
        textWrap: 'wrap' as const,
    },
    footer: {
        backgroundColor: headerColor,
        color: whiteTheme,
        padding: '10px',
        textAlign: 'center' as const,
        marginTop: 'auto',
        // borderTop: `3px solid ${whiteTheme}`,
        fontFamily: 'Arial, sans-serif',
    },
    hr: {
        border: '1px solid black',
    },
    dropdownUL: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "5px",
        position: "absolute" as const,
        width: "100%",
        maxWidth: "inherit",
        zIndex: 1,
        maxHeight: "200px", // to make the dropdown scrollable
        overflowY: "scroll" as const,  // Enable vertical scrolling
    },
    dropdownLI: {
        padding: "8px",
        cursor: "pointer",
    },
    dropDownLISelected: {
        backgroundColor: "#add8e6",
    },
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: whiteTheme,
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto' as const,
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
};