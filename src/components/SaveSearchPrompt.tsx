
import { globalStyles } from '../globalStyles';

interface SaveSearchPromptProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  saveSearchName: string;
  setSaveSearchName: (name: string) => void;
  saveSearchError?: string;
  setSaveSearchError: (error: string) => void;
}

const SaveSearchPrompt = ({ onSave, onCancel, saveSearchName, setSaveSearchName, saveSearchError, setSaveSearchError }: SaveSearchPromptProps) => {


  return (
    <div style={globalStyles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h4 style={styles.title}>Save Search</h4>
        <input
          type="text"
          placeholder="Enter a name for this search"
          value={saveSearchName}
          onChange={(e) => {
            setSaveSearchName(e.target.value);7898790
            if (saveSearchError) setSaveSearchError('');
          }}
          style={styles.input}
        />
        {saveSearchError && <p style={styles.error}>{saveSearchError}</p>}
        <div style={styles.buttonContainer}>
          <button style={styles.saveButton} onClick={() =>onSave(saveSearchName)}>Save</button>
          <button style={styles.cancelButton} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  modal: {
    backgroundColor: globalStyles.colors.pageBackgroundMain,
    padding: '30px 40px',
    borderRadius: '10px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
    minWidth: '300px',
    maxWidth: '400px',
    textAlign: 'center',
    zIndex: 1101,
  },
  title: {
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold',
    color: globalStyles.colors.darkText,
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderRadius: '5px',
    border: `1px solid ${globalStyles.colors.darkText}`,
    marginBottom: '10px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
  },
  saveButton: {
    backgroundColor: globalStyles.colors.darkButtonTheme,
    color: globalStyles.colors.whiteTheme,
    fontSize: '14px',
    padding: '8px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '45%',
  },
  cancelButton: {
    backgroundColor: globalStyles.colors.error,
    color: globalStyles.colors.whiteTheme,
    fontSize: '14px',
    padding: '8px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '45%',
  },
  error: {
    color: globalStyles.colors.error,
    fontSize: '14px',
    marginTop: '5px',
  },
};

export default SaveSearchPrompt;
