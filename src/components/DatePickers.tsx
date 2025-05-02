import { globalStyles } from "../globalStyles";
import { FilterFormInterface } from "../interfaces/FilterFormInterface";

interface DatePickersProps {
    formData: FilterFormInterface;
    setFormData: (formData: FilterFormInterface) => void;
    datePickersShown: boolean;
    setDatePickersShown: (value: boolean) => void;
    setTimeFrame: (value: 'hour' | 'day' | 'week' | '30 days' | 'year' | '') => void;
}

const DatePickers = ({ formData, setFormData, datePickersShown, setDatePickersShown, setTimeFrame }: DatePickersProps) => {

    // Function to convert Unix timestamp to YYYY-MM-DD format in local time
    const formatDateLocal = (timestamp: number | null) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const handleToggleDatePickers = () => {
        if(datePickersShown){
            setDatePickersShown(false);
            setFormData({
                ...formData,
                startDate: null,
                endDate: null,
            });
        }
        else{
            setDatePickersShown(true);
        }
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, dateType: 'startDate' | 'endDate') => {
        const dateValue = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null;
        setFormData({
            ...formData,
            [dateType]: dateValue,
        });
        setTimeFrame('')
    }

    return (
        <>
            <label style={globalStyles.label}>Filter with custom start/end dates</label>
            <input
                type="checkbox"
                checked={datePickersShown}
                onChange={handleToggleDatePickers}
                style={{ marginRight: "5px" }}
            />
            {datePickersShown && (
                <div>
                    <label style={globalStyles.label}>Start Date</label>
                    <input
                        type="date"
                        value={formatDateLocal(formData.startDate)}
                        onChange={(e) => handleDateChange(e, 'startDate')}
                        style={globalStyles.input}
                    />

                    <label style={globalStyles.label}>End Date</label>
                    <input
                        type="date"
                        value={formatDateLocal(formData.endDate)}
                        onChange={(e) => handleDateChange(e, 'endDate')}
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
