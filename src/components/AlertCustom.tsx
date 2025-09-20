import { globalStyles } from "../globalStyles";

interface AlertCustomProps {
    message: string | null;
    onClose?: () => void;
}

const Alert_Custom = ({ message, onClose }: AlertCustomProps) => {
    return (
        <div style={globalStyles.overlay}>
            <div style={globalStyles.modal}>
              <p>{message}</p>
              <div style={globalStyles.modalButtons}>
                <button onClick={onClose} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.success}}>Close</button>
              </div>
            </div>
        </div>
    );
};

export default Alert_Custom;