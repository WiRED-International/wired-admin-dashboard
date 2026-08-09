import { Link } from "react-router-dom";
import { globalStyles } from "../globalStyles";

const PasswordResetSuccessPage = () => {
  return (
    <div style={globalStyles.pageContainer}>
      <header style={globalStyles.header}>
        <h1 style={{ marginBottom: "8px" }}>
          Password Updated Successfully
        </h1>

        <p style={{ margin: 0 }}>
          Your password has been changed successfully.
        </p>
      </header>

      <main
        style={{
          flex: 1,
          padding: "32px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "620px",
            backgroundColor: globalStyles.colors.whiteTheme,
            borderRadius: "12px",
            padding: "48px 56px",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.10)",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "76px",
              height: "76px",
              margin: "0 auto 24px",
              borderRadius: "50%",
              backgroundColor: globalStyles.colors.headerColor,
              color: globalStyles.colors.whiteTheme,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>

          <h2
            style={{
              margin: "0 0 18px",
              color: globalStyles.colors.headerColor,
              fontSize: "28px",
            }}
          >
            Your new password is ready
          </h2>

          <p
            style={{
              margin: "0 0 32px",
              lineHeight: "1.7",
              fontSize: "17px",
              color: globalStyles.colors.darkText,
            }}
          >
            You can now sign in using your updated password.
          </p>

          <div
            style={{
              padding: "24px",
              marginBottom: "20px",
              backgroundColor: globalStyles.colors.lightGray,
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                color: globalStyles.colors.headerColor,
                fontSize: "18px",
              }}
            >
              HealthMAP mobile application
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: "1.7",
              }}
            >
              Return to the HealthMAP app and sign in using your new
              password.
            </p>
          </div>

          <div
            style={{
              padding: "24px",
              backgroundColor: globalStyles.colors.lightGray,
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                color: globalStyles.colors.headerColor,
                fontSize: "18px",
              }}
            >
              WiRED Learning Management Platform
            </h3>

            <p
              style={{
                margin: "0 0 24px",
                lineHeight: "1.7",
              }}
            >
              Return to the WiRED LMP login page using the button below.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Link
                to="/login"
                style={{
                  ...globalStyles.submitButton,
                  display: "inline-block",
                  minWidth: "240px",
                  textAlign: "center",
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                Go to WiRED LMP Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PasswordResetSuccessPage;