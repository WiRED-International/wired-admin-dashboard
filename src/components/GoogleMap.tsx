import {
    GoogleMap,
    Marker,
    InfoWindow,
    useLoadScript,
} from "@react-google-maps/api";
import { useState, useEffect, useRef } from "react";
import { ModuleDownloadInterface } from "../interfaces/ModuleDownloadInterface";

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};
interface GoogleMapsComponentProps {
    downloads: ModuleDownloadInterface[];
    handleViewAllDownloads: () => void;
}

const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco

const GoogleMapsComponent = ({ downloads, handleViewAllDownloads }: GoogleMapsComponentProps) => {

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY, // Replace with your API Key
    });

    const [selectedDownload, setSelectedDownload] = useState<ModuleDownloadInterface | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);

    // Save reference to the map on load
    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;
        handleViewAllDownloads();
    };

    // Fit map to bounds of all queried downloads
    useEffect(() => {
        if (mapRef.current && downloads.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            downloads.forEach(download => {
                bounds.extend(new window.google.maps.LatLng(
                    parseFloat(download.latitude), 
                    parseFloat(download.longitude)
                ));
            });
            mapRef.current.fitBounds(bounds);
        }
    }, [downloads]);

  
    if (loadError) return <p>Error loading maps</p>;
    if (!isLoaded) return <p>Loading maps...</p>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={4}
            center={defaultCenter}
            onLoad={onLoad}
        >
            {downloads.map((download, index) => (
                <Marker
                    key={index}
                    position={{ 
                        lat: parseFloat(download.latitude), 
                        lng: parseFloat(download.longitude) 
                    }}
                    onClick={() => setSelectedDownload(download)}
                />
            ))}

            {selectedDownload && (
                <InfoWindow
                    position={{
                        lat: parseFloat(selectedDownload.latitude),
                        lng: parseFloat(selectedDownload.longitude),
                    }}
                    onCloseClick={() => setSelectedDownload(null)}
                >
                    <div>
                        <p>
                            <strong>Date:</strong>{" "}
                            {new Date(selectedDownload.download_date * 1000).toLocaleDateString()}
                        </p>
                        {selectedDownload.module ? <p>
                            <strong>Module:</strong> {selectedDownload.module?.name}
                        </p>
                        :
                        <p>
                            <strong>Package:</strong> {selectedDownload.package?.name}
                        </p>
                    }
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default GoogleMapsComponent;
