
import React, {createContext, useContext, useEffect, useState} from "react";
import { fetchAllCountries } from "../api/countriesAPI";
import {CountryInterface} from "../interfaces/CountryInterface";
import {fetchAllOrganizations} from "../api/organizationsAPI";
import {OrganizationInterface} from "../interfaces/OrganizationsInterface";
import {fetchAllSpecializations} from "../api/specializationsAPI";
import SpecializationsInterface from "../interfaces/SpecializationInterface";
import { fetchAllRoles } from "../api/rolesAPI";
import { RoleInterface } from "../interfaces/rolesInterface";
import { fetchAllCities } from "../api/citiesAPI";
import { CityInterface } from "../interfaces/CityInterface";

interface UserOptionsContextInterface {
    countries: CountryInterface[];
    organizations: OrganizationInterface[];
    specializations: SpecializationsInterface[];
    roles: RoleInterface[];
    cities: CityInterface[];

}

const UserOptionsContext = createContext<UserOptionsContextInterface | null>(null);

export const useUserOptions = () => {
    const context = useContext(UserOptionsContext);
    if (!context) {
        throw new Error("useUserOptions must be used within a UserOptionsProvider");
    }
    return context;
};

export const UserOptionsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [countries, setCountries] = useState<CountryInterface[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationInterface[]>([]);
    const [specializations, setSpecializations] = useState<SpecializationsInterface[]>([]);
    const [roles, setRoles] = useState<RoleInterface[]>([]);
    const [cities, setCities] = useState<CityInterface[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedCountries, fetchedOrganizations, fetchedSpecializations, fetchedRoles, fetchedCities] = await Promise.all([
                    fetchAllCountries(),
                    fetchAllOrganizations(),
                    fetchAllSpecializations(),
                    fetchAllRoles(),
                    fetchAllCities()
                ]);
                console.log(`roles from context:`, fetchedRoles);
                setCountries(fetchedCountries);
                setOrganizations(fetchedOrganizations);
                setSpecializations(fetchedSpecializations);
                setRoles(fetchedRoles);
                setCities(fetchedCities);
            } catch (error) {
                console.error("Error fetching user options:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // or a spinner component
    }

    return (
        <UserOptionsContext.Provider value={{countries, organizations, specializations, roles, cities}}>
            {children}
        </UserOptionsContext.Provider>
    );
}
