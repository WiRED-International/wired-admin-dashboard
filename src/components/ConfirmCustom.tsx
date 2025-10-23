import { globalStyles } from "../globalStyles";
import ReactDOM from "react-dom";

interface ConfirmCustomProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen?: boolean;
}

const Confirm_custom = ({ message, onConfirm, onCancel, isOpen }: ConfirmCustomProps) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
      <>
        {
         isOpen && <div style={globalStyles.overlay}>
            <div style={globalStyles.modal}>
              <p style={globalStyles.modalMessage}>{message}</p>
              <div style={globalStyles.modalButtons}>
                <button onClick={onConfirm} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.success}}>Confirm</button>
                <button onClick={onCancel} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.error}}>Cancel</button>
              </div>
            </div>
          </div>
        }
      </>,
      document.body
    );
};

export default Confirm_custom;