import { UserDataInterface } from "../../interfaces/UserDataInterface"
import { globalStyles } from "../../globalStyles";
import { useState } from "react";
import SpecializationsInterface from "../../interfaces/SpecializationInterface";

interface SingleUserViewProps {
    user: UserDataInterface;
    setIsSingleUserViewOpen: (isOpen: boolean) => void;
    viewMode: 'view' | 'edit';
    setViewMode: (mode: 'view' | 'edit') => void;
}

const SingleUserView = ({ user, setIsSingleUserViewOpen, viewMode, setViewMode }: SingleUserViewProps) => {

    const [formState, setFormState] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        specializations: user.specializations,
        role: user.role.id,
        country: user.country.id,
        city: user.city.id,
        organization: user.organization.id,
    });

    const dummySpecializations: SpecializationsInterface[] = [
        { id: 1, name: "Cardiology" },
        { id: 2, name: "Neurology" },
        { id: 3, name: "Pediatrics" },
        { id: 4, name: "Oncology" },
    ]
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.headerText}>{viewMode === 'view' ? 'User Profile' : 'Edit User'}</h2>
            </div>
            <div style={styles.content}>
                <div style={styles.form}>
                    <div style={styles.formRow}>
                        <div style={styles.label}>First Name:</div>
                        <input
                            type="text" value={formState.first_name}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setFormState({ ...formState, first_name: e.target.value })}
                        />
                    </div>

                    <div style={styles.formRow}>
                        <label style={styles.label}>Last Name:</label>
                        <input
                            type="text" value={formState.last_name}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setFormState({ ...formState, last_name: e.target.value })}
                        />
                    </div >
                    <div style={styles.formRow}>
                        <label style={styles.label}>Email:</label>
                        <input
                            type="email" value={formState.email}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        />
                    </div>
                    <div style={styles.formRow}>
                        <div>
                            {formState.specializations.map((spec) => (
                                <p key={spec.id} style={{ marginRight: '10px' }}>
                                    {spec.name}
                                </p>
                            ))}
                        </div>
                        <select
                            multiple
                            value={formState.specializations.map(spec => spec.id.toString())}
                            onChange={(e) => {
                                const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));

                                // Filter all dummySpecializations that are selected
                                const selectedSpecializations = dummySpecializations.filter(spec => selectedIds.includes(spec.id));

                                setFormState({
                                    ...formState,
                                    specializations: selectedSpecializations
                                });
                            }}
                        >
                            {dummySpecializations.map(spec => (
                                <option key={spec.id} value={spec.id}>
                                    {spec.name}
                                </option>
                            ))}
                        </select>

                    </div>
                    <p>
                        Specializations:{" "}
                        {user.specializations.length > 0
                            ? user.specializations.map(spec => spec.name).join(", ")
                            : "None"}
                    </p>

                    <p>Role: {user.role.name}</p>
                    <p>Country: {user.country.name}</p>
                    <p>City: {user.city.name}</p>
                    <p>Organization: {user.organization.name}</p>
                </div>
                <div style={styles.quizScores}></div>
            </div>

            <button style={styles.button} onClick={() => setIsSingleUserViewOpen(false)}>Close</button>
            {/* Additional content for the single user view can be added here */}
        </div>
    );
}
export default SingleUserView;

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        backgroundColor: globalStyles.colors.singleUserViewBackground,
        width: '95%',
        height: '90%',
        display: 'flex',
        flexDirection: 'column' as const,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    },
    header: {
        backgroundColor: globalStyles.colors.singleUserViewHeader,
        paddingInline: '30px',
        textAlign: 'left' as const,
        width: '100%',
        height: '89px',
        top: '0',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center' as const,
    },
    headerText: {
        fontSize: '40px',
        margin: 0,
    },
    content: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'row' as const,
        overflowY: 'auto',
        width: '100%',
        backgroundColor: globalStyles.colors.singleUserViewBackground,
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        padding: '20px',
    },
    button: {
        backgroundColor: globalStyles.colors.headerColor,
        color: globalStyles.colors.whiteTheme,
        padding: '10px 20px',
        border: 'none',
        cursor: 'pointer',
        margin: '10px',
        alignSelf: 'center' as const,
    },
    quizScores: {
        padding: '20px',
        backgroundColor: 'green',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginTop: '20px',
        flex: 1,

    },
    formRow: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: '10px',
        marginBottom: '10px',
    },
    label: {
        fontSize: '16px',
        maxWidth: '300px',
        width: '150px',
    }
}
