
import { globalStyles } from "../globalStyles";
import { FilterFormInterface } from "../interfaces/FilterFormInterface";

interface LocationInputsProps {
    loactionInputsShown: boolean;
    setLocationInputsShown: (value: boolean) => void;
    formData: FilterFormInterface;
    setFormData: (data: FilterFormInterface) => void;
    latitudeError: string;
    setLatitudeError: (value: string) => void;
    longitudeError: string;
    setLongitudeError: (value: string) => void;
    distanceError: string;
    setDistanceError: (value: string) => void;
}

const LocationInputs = ({
  loactionInputsShown,
  setLocationInputsShown,
  formData,
  setFormData,
    latitudeError,
    longitudeError,
    distanceError,
    setLatitudeError,
    setLongitudeError,
    setDistanceError,
}: LocationInputsProps) => {

  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (e.target.name === "latitude") {
      const latitude = parseFloat(e.target.value);
      if (latitude < -90 || latitude > 90) {
        setLatitudeError("Latitude must be between -90 and 90");
      } else {
        setLatitudeError("");
      }
      setFormData({ ...formData, latitude });
    } else if (e.target.name === "longitude") {
      const longitude = parseFloat(e.target.value);
      if (longitude < -180 || longitude > 180) {
        setLongitudeError("Longitude must be between -180 and 180");
      } else {
        setLongitudeError("");
      }
      setFormData({ ...formData, longitude });
    } else if (e.target.name === "distance") {
      const distance = parseFloat(e.target.value);
      if (distance < 0) {
        setDistanceError("Distance must be a positive number");
      } else {
        setDistanceError("");
      }
      setFormData({ ...formData, distance });
    }
  };

  return (
    <>
      <label style={globalStyles.label}>Search by Location</label>
      <input
        type="checkbox"
        checked={loactionInputsShown}
        onChange={() => setLocationInputsShown(!loactionInputsShown)}
        style={{ marginRight: "5px" }}
      />
      <hr style={{border: '1px solid black'}}/>
      {loactionInputsShown && (
        <>
          <label style={globalStyles.label}>Latitude</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude?.toString()}
            onChange={handleLocationChange}
            style={globalStyles.input}
            placeholder="Enter latitude"
            min={-90}
            max={90}
            step={0.000001}
          />
          {latitudeError && <p style={styles.smallError}>{latitudeError}</p>}

          <label style={styles.label}>Longitude</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude?.toString()}
            onChange={handleLocationChange}
            style={globalStyles.input}
            placeholder="Enter longitude"
            min={-180}
            max={180}
            step={0.000001}
          />
          {longitudeError && <p style={styles.smallError}>{longitudeError}</p>}
          <label style={globalStyles.label}>Distance (miles)</label>
          <input
            type="number"
            name="distance"
            value={formData.distance?.toString()}
            onChange={handleLocationChange}
            style={globalStyles.input}
            placeholder="Enter distance in miles"
            min={0}
            step={0.1}
          />
          {distanceError && <p style={styles.smallError}>{distanceError}</p>}
        </>
      )}
    </>
  );
};

export default LocationInputs;

const styles: { [key: string]: React.CSSProperties } = {
  smallError: {
    fontSize: "12px",
    color: globalStyles.colors.error,
    marginTop: "0px",
  },
};
