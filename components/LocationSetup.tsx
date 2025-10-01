import React, { useState, useEffect } from 'react';
import { PrayerSettings } from '../types';
import { CALCULATION_METHODS } from '../constants';

interface LocationSetupProps {
    onSave: (settings: PrayerSettings) => void;
}

interface Country {
    name: string;
    iso3: string;
    states: { name: string; state_code: string; }[];
}

const LocationSetup: React.FC<LocationSetupProps> = ({ onSave }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<{ name: string }[]>([]);
    
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<number>(CALCULATION_METHODS[0].id);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
                if (!response.ok) throw new Error('Failed to fetch country data.');
                const data = await response.json();
                if (data.error) throw new Error(data.msg);
                setCountries(data.data.sort((a: Country, b: Country) => a.name.localeCompare(b.name)));
            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError('An unknown error occurred while fetching countries.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            const countryData = countries.find(c => c.name === selectedCountry);
            if (countryData && countryData.states) {
                setRegions(countryData.states.sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                setRegions([]);
            }
            setSelectedRegion(''); // Reset region when country changes
        }
    }, [selectedCountry, countries]);

    const handleSave = () => {
        if (!selectedCountry || !selectedRegion || !selectedMethod) {
            setError('Please complete all selections.');
            return;
        }
        setError('');
        onSave({ country: selectedCountry, region: selectedRegion, method: selectedMethod });
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4">
                <h2 className="text-2xl font-bold text-center text-text-primary mb-4">Prayer Time Settings</h2>
                <p className="text-center text-text-secondary mb-6">Select your location and calculation method for accurate prayer times.</p>
                
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {isLoading && <p className="text-center text-text-secondary">Loading countries...</p>}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium text-text-primary mb-1">Country</label>
                        <select
                            id="country"
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            disabled={isLoading}
                            className="block w-full bg-card border border-border-color rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="">Select Country</option>
                            {countries.map(c => <option key={c.iso3} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-text-primary mb-1">State/Region</label>
                        <select
                            id="region"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            disabled={!selectedCountry || regions.length === 0}
                             className="block w-full bg-card border border-border-color rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="">{selectedCountry ? 'Select State/Region' : 'Select a country first'}</option>
                            {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="method" className="block text-sm font-medium text-text-primary mb-1">Calculation Method</label>
                        <select
                            id="method"
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(Number(e.target.value))}
                             className="block w-full bg-card border border-border-color rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            {CALCULATION_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-800 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationSetup;