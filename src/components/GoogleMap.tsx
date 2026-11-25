import {
    GoogleMap,
    Marker,
    MarkerClusterer,
    InfoWindow,
    useLoadScript,
} from "@react-google-maps/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { ModuleDownloadInterface } from "../interfaces/ModuleDownloadInterface";

const mapContainerStyle = {
    width: "100%",
    flex: 1,
};
interface GoogleMapsComponentProps {
    downloads: ModuleDownloadInterface[];
    handleViewAllDownloads: () => void;
    googleAPIKey: string;
}

const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco

const GoogleMapsComponent = ({ downloads, handleViewAllDownloads, googleAPIKey }: GoogleMapsComponentProps) => {

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: googleAPIKey
    });

    const [selectedDownload, setSelectedDownload] = useState<ModuleDownloadInterface | null>(null);


    const mapRef = useRef<google.maps.Map | null>(null);

    const fitDownloadBounds = useCallback((map: google.maps.Map) => {
        if (downloads.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        downloads.forEach(download => bounds.extend(new window.google.maps.LatLng(
            parseFloat(download.latitude), parseFloat(download.longitude)
        )));
        map.fitBounds(bounds);
    }, [downloads]);

    // Fit even when the data arrives before the Maps script finishes loading.
    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;
        fitDownloadBounds(map);
        handleViewAllDownloads();
    };
    useEffect(() => {
        if (mapRef.current) fitDownloadBounds(mapRef.current);
    }, [fitDownloadBounds]);

    if (loadError) {
    console.error(loadError);
    return <p>Error loading maps</p>;
    }

    if (!isLoaded) {
    return <p>Loading maps...</p>;
    }
    return (
      <div
          style={{
              flex: 1,
              display: "flex",
              minHeight: 0,
          }}
      >
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={4}
            center={defaultCenter}
            onLoad={onLoad}
        >
            <MarkerClusterer
                options={{
                    maxZoom: 15,
                    gridSize: 60,
                }}
            >
              {(clusterer) => (
                  <>
                      {downloads.map((download) => (
                          <Marker
                              key={download.id}
                              clusterer={clusterer}
                              position={{
                                  lat: parseFloat(download.latitude),
                                  lng: parseFloat(download.longitude)
                              }}
                              onClick={() => {
                                  console.log(download);
                                  setSelectedDownload(download);
                              }}
                          />
                      ))}
                  </>
              )}
          </MarkerClusterer>

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
      </div>
    );
};

export default GoogleMapsComponent;
