import { ModuleDownloadInterface } from '../interfaces/ModuleDownloadInterface';
import {useEffect, useState} from "react";

interface TableViewProps {
    downloads: ModuleDownloadInterface[];
    setDownloads: (downloads: ModuleDownloadInterface[]) => void;
    handleViewAllDownloads: () => void;
}

const TableView = ({downloads, setDownloads}: TableViewProps) => {
    // const [downloads, setDownloads] = useState<ModuleDownloadInterface[]>([]);

    useEffect(() => {
        fetch('http://localhost:8080/api/modules')
            .then(response => response.json())
            .then(data => setDownloads(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    return (
        <div>
            <h1>Module List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Module Name</th>
                        <th>Package Name</th>
                        <th>Download Date</th>
                    </tr>
                </thead>
                <tbody>
                    {downloads.map((module) => (
                        <tr key={module.id}>
                            <td>{module?.module?.name}</td>
                            <td>{module?.package?.name}</td>
                            <td>{module.download_date}</td>
    
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TableView;