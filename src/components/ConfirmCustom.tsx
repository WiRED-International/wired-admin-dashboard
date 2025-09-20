import { globalStyles } from "../globalStyles";

interface ConfirmCustomProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen?: boolean;
}

const Confirm_custom = ({ message, onConfirm, onCancel, isOpen }: ConfirmCustomProps) => {
    if (!isOpen) return null;

    return (
      <>
        {
         isOpen && <div style={globalStyles.overlay}>
            <div style={globalStyles.modal}>
              <p>{message}</p>
              <div style={globalStyles.modalButtons}>
                <button onClick={onConfirm} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.success}}>Confirm</button>
                <button onClick={onCancel} style={{...globalStyles.submitButton, backgroundColor: globalStyles.colors.error}}>Cancel</button>
              </div>
            </div>
          </div>
        }
      </>
    );
};

export default Confirm_custom;