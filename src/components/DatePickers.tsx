
import { globalStyles } from "../globalStyles";
import { FilterFormInterface } from "../interfaces/FilterFormInterface";

interface DatePickersProps {
    formData: FilterFormInterface;
    setFormData: (formData: FilterFormInterface) => void;
    datePickersShown: boolean;
    setDatePickersShown: (value: boolean) => void;
}

const DatePickers = ({ formData, setFormData, datePickersShown, setDatePickersShown }: DatePickersProps) => {

    // Function to convert Unix timestamp to YYYY-MM-DD format in local time
    const formatDateLocal = (timestamp: number | null) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    return (
        <>
            <label style={globalStyles.label}>Filter with custom start/end dates</label>
            <input
                type="checkbox"
                checked={datePickersShown}
                onChange={() => setDatePickersShown(!datePickersShown)}
                style={{ marginRight: "5px" }}
            />
            {datePickersShown && (
                <div>
                    <label style={globalStyles.label}>Start Date</label>
                    <input
                        type="date"
                        value={formatDateLocal(formData.startDate)}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                startDate: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null,
                            })
                        }
                        style={globalStyles.input}
                    />

                    <label style={globalStyles.label}>End Date</label>
                    <input
                        type="date"
                        value={formatDateLocal(formData.endDate)}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                endDate: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null,
                            })
                        }
                        style={globalStyles.input}
                    />
                </div>
            )}
            <br />
            <hr style={globalStyles.hr} />
        </>
    );
};

export default DatePickers;
