import React, { useState, useEffect } from 'react';
import type { FilterCriteria } from '../types';
import { Button } from '../design-system/components/Button';

interface AdvancedSearchProps {
    onApplyFilters: (filters: FilterCriteria) => void;
    onClearFilters: () => void;
}

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
    id: number;
    nome: string;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const SelectInput: React.FC<{ name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: {value: string, label: string}[]; defaultLabel: string; disabled?: boolean; }> = 
({ name, value, onChange, options, defaultLabel, disabled = false }) => (
    <select name={name} value={value} onChange={onChange} disabled={disabled} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-sm disabled:bg-gray-100">
        <option value="">{defaultLabel}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const filterOptions = {
    maritalStatus: ['Solteiro(a)', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Em um relacionamento'],
    height: ['Menos de 1.50m', '1.50m - 1.60m', '1.60m - 1.70m', '1.70m - 1.80m', '1.80m - 1.90m', 'Mais de 1.90m'],
    ethnicity: ['Asiático', 'Branco/Caucasiano', 'Indígena', 'Latino/Hispânico', 'Negro/Afrodescendente', 'Outro'],
    hairColor: ['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Grisalho', 'Outro'],
    eyeColor: ['Preto', 'Castanho', 'Azul', 'Verde', 'Cor de mel', 'Outro'],
    smoking: ['Nunca', 'Socialmente', 'Frequentemente'],
    drinking: ['Nunca', 'Socialmente', 'Frequentemente'],
    education: ['Ensino Médio', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação', 'Mestrado', 'Doutorado'],
    partnershipType: [
      { value: 'companionship', label: 'Companheirismo' },
      { value: 'financial', label: 'Suporte Financeiro' },
      { value: 'mentorship', label: 'Mentoria & Networking' },
      { value: 'travel', label: 'Viagens & Aventuras' },
      { value: 'other', label: 'Outro' }
    ],
    meetingFrequency: [
      { value: 'flexible', label: 'Flexível / Casual' },
      { value: 'weekly', label: 'Semanal' },
      { value: 'bi_weekly', label: 'Quinzenal' },
      { value: 'monthly', label: 'Mensal' },
      { value: 'multi_weekly', label: 'Múltiplas vezes na semana' }
    ]
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onApplyFilters, onClearFilters }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<FilterCriteria>({});
    
    const [states, setStates] = useState<IBGEState[]>([]);
    const [cities, setCities] = useState<IBGECity[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    
    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(response => response.json())
            .then((data: IBGEState[]) => setStates(data))
            .catch(error => console.error("Error fetching states:", error));
    }, []);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateAbbr = e.target.value;
        handleChange(e);
        setCities([]);

        if (stateAbbr) {
            setIsLoadingCities(true);
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateAbbr}/municipios`)
                .then(response => response.json())
                .then((data: IBGECity[]) => {
                    setCities(data);
                    setIsLoadingCities(false);
                })
                .catch(error => {
                    console.error("Error fetching cities:", error)
                    setIsLoadingCities(false);
                });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocalFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        setIsOpen(false);
    };

    const handleClear = () => {
        setLocalFilters({});
        setCities([]);
        onClearFilters();
    };

    const mapToOptions = (arr: string[]) => arr.map(item => ({ value: item, label: item }));

    const radiusOptions = [
        { value: '10', label: 'Até 10 km' },
        { value: '25', label: 'Até 25 km' },
        { value: '50', label: 'Até 50 km' },
        { value: '100', label: 'Até 100 km' },
        { value: '250', label: 'Até 250 km' },
    ];

    const ageOptions = Array.from({ length: 53 }, (_, i) => ({
        value: String(18 + i),
        label: `${18 + i} anos`,
    }));

    const heightOptions = Array.from({ length: 71 }, (_, i) => ({
        value: String(150 + i),
        label: `${(150 + i) / 100}m`,
    }));

    return (
        <div className="bg-white py-6">
            <div className="container mx-auto px-6">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center p-4 bg-neutral-gray rounded-lg shadow-sm hover:bg-gray-200 transition-colors text-left"
                    aria-expanded={isOpen}
                >
                    <div>
                        <span className="font-semibold text-gray-800 text-lg">Encontre sua Conexão Ideal</span>
                        {!isOpen && <p className="text-sm text-gray-500 mt-1">Toque para refinar sua busca com filtros detalhados.</p>}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-600 transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="mt-4 p-6 border rounded-lg bg-white animate-fade-in-down">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField label="Distância Máxima">
                                <SelectInput name="radius" value={localFilters.radius || ''} onChange={handleChange} options={radiusOptions} defaultLabel="Qualquer distância" />
                            </FormField>
                            <FormField label="Idade Mínima">
                                <SelectInput name="ageMin" value={localFilters.ageMin || ''} onChange={handleChange} options={ageOptions} defaultLabel="18 anos" />
                            </FormField>
                            <FormField label="Idade Máxima">
                                <SelectInput name="ageMax" value={localFilters.ageMax || ''} onChange={handleChange} options={ageOptions} defaultLabel="Sem limite" />
                            </FormField>
                            <FormField label="Altura Mínima">
                                <SelectInput name="heightMin" value={localFilters.heightMin || ''} onChange={handleChange} options={heightOptions} defaultLabel="Sem limite" />
                            </FormField>
                            <FormField label="Altura Máxima">
                                <SelectInput name="heightMax" value={localFilters.heightMax || ''} onChange={handleChange} options={heightOptions} defaultLabel="Sem limite" />
                            </FormField>
                            <FormField label="Estado Civil">
                                <SelectInput name="maritalStatus" value={localFilters.maritalStatus || ''} onChange={handleChange} options={mapToOptions(filterOptions.maritalStatus)} defaultLabel="Todos" />
                            </FormField>
                            <FormField label="Estado">
                                <select name="state" value={localFilters.state || ''} onChange={handleStateChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-sm">
                                    <option value="">Todos</option>
                                    {states.map(state => <option key={state.id} value={state.sigla}>{state.nome}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Cidade">
                                <select name="city" value={localFilters.city || ''} onChange={handleChange} disabled={!localFilters.state || isLoadingCities} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-sm disabled:bg-gray-100">
                                    <option value="">{isLoadingCities ? 'Carregando...' : 'Todas'}</option>
                                    {cities.map(city => <option key={city.id} value={city.nome}>{city.nome}</option>)}
                                </select>
                            </FormField>
                             <FormField label="Altura">
                                <SelectInput name="height" value={localFilters.height || ''} onChange={handleChange} options={mapToOptions(filterOptions.height)} defaultLabel="Todas" />
                            </FormField>
                            <FormField label="Etnia">
                                <SelectInput name="ethnicity" value={localFilters.ethnicity || ''} onChange={handleChange} options={mapToOptions(filterOptions.ethnicity)} defaultLabel="Todas" />
                            </FormField>
                             <FormField label="Cor do Cabelo">
                                <SelectInput name="hairColor" value={localFilters.hairColor || ''} onChange={handleChange} options={mapToOptions(filterOptions.hairColor)} defaultLabel="Todas" />
                            </FormField>
                            <FormField label="Cor dos Olhos">
                                <SelectInput name="eyeColor" value={localFilters.eyeColor || ''} onChange={handleChange} options={mapToOptions(filterOptions.eyeColor)} defaultLabel="Todas" />
                            </FormField>
                            <FormField label="Fuma?">
                                <SelectInput name="smoking" value={localFilters.smoking || ''} onChange={handleChange} options={mapToOptions(filterOptions.smoking)} defaultLabel="Todos" />
                            </FormField>
                            <FormField label="Bebe?">
                                <SelectInput name="drinking" value={localFilters.drinking || ''} onChange={handleChange} options={mapToOptions(filterOptions.drinking)} defaultLabel="Todos" />
                            </FormField>
                             <FormField label="Escolaridade">
                                <SelectInput name="education" value={localFilters.education || ''} onChange={handleChange} options={mapToOptions(filterOptions.education)} defaultLabel="Todas" />
                            </FormField>
                            <FormField label="Acordo Desejado">
                                <SelectInput name="partnershipType" value={localFilters.partnershipType || ''} onChange={handleChange} options={filterOptions.partnershipType} defaultLabel="Todos" />
                            </FormField>
                            <FormField label="Frequência de Encontros">
                                <SelectInput name="meetingFrequency" value={localFilters.meetingFrequency || ''} onChange={handleChange} options={filterOptions.meetingFrequency} defaultLabel="Todas" />
                            </FormField>
                        </div>
                        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                            <Button onClick={handleClear} variant="secondary">
                                Limpar Filtros
                            </Button>
                            <Button onClick={handleApply} variant="primary" className="px-8">
                                Aplicar Filtros
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedSearch;