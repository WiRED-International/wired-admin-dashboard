import { globalStyles } from "../globalStyles";
import ReactDOM from "react-dom";

interface AlertCustomProps {
    message: string | null;
    onClose?: () => void;
}

const Alert_Custom = ({ message, onClose }: AlertCustomProps) => {
    return ReactDOM.createPortal(
        <div style={globalStyles.overlay}>
            <div style={globalStyles.modal}>
              <p>{message}</p>
              <div style={globalStyles.modalButtons}>
                <button onClick={onClose} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.success}}>Close</button>
              </div>
            </div>
        </div>,
        document.body
    );
};

export default Alert_Custom;