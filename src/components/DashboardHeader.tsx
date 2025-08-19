import auth from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { globalStyles } from "../globalStyles";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


export default function DashboardHeader() {

    const [headerTitle, setHeaderTitle] = useState<string>("Wired Module/Package Downloads");

    const location = useLocation();
    const navigate = useNavigate();
  
    useEffect(() => {
        if(location.pathname === "/userview"){
            setHeaderTitle("Wired Users");
        }else if(location.pathname === "/"){
            setHeaderTitle("Wired Module/Package Downloads");
        }
    }, [location.pathname]);


    const { setIsAuthenticated } = useAuth();
    const handleLogout = () => {
        auth.logout();
        setIsAuthenticated(false);
    }

    const handleNavigate = (path: string) => {
      if(path === location.pathname){
        return;
      }
      navigate(path);
    }


    return (
        <div style={globalStyles.header}>
            <h1 style={styles.header}>{headerTitle}</h1>
            <div style={styles.buttonContainer}>
              <button style={{
                ...styles.headerButton,
                ...styles.navigateButton,
                ...(location.pathname === "/" ? styles.navActiveButton : {}),
                }} onClick={() => handleNavigate('/')}>Downloads Page</button>
              <button style={{
                ...styles.headerButton,
                ...styles.navigateButton,
                ...(location.pathname === '/userview' ? styles.navActiveButton : {})
                }} onClick={() => handleNavigate('/userview')}>Users Page</button>
              <button style={{...styles.headerButton, ...styles.logoutButton}} onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}


const styles: {[key: string]: React.CSSProperties} = {
  container: {
    backgroundColor: globalStyles.colors.headerColor, 
    color: globalStyles.colors.whiteTheme,
    padding: '20px',
    textAlign: 'center',
  },
  header:{
    marginTop: '0px'
  },
  headerButton: {
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    width: "120px",
    height: "50px"

  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "10px",
    gap: "10px", 
  },
  logoutButton: {
    backgroundColor: globalStyles.colors.error,
    color: globalStyles.colors.whiteTheme, 
  },
  navActiveButton: {
    boxShadow: "0 0 10px rgba(227, 251, 5, 0.6), 0 0 20px rgba(76, 175, 80, 0.4)",
  },
  navigateButton: {
    backgroundColor: globalStyles.colors.darkButtonTheme,
    color: globalStyles.colors.whiteTheme,
  }
}
