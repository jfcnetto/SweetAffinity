import React, { useState, useEffect } from 'react';

interface AuthModalProps {
  onClose: () => void;
  initialMode: 'login' | 'register';
  onRegistrationComplete: (profileType: 'Baby' | 'Daddy' | 'Mommy') => void;
  onLoginSuccess: () => void;
  navigateTo: (page: string) => void;
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

const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
        <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-5.2 5.71 5.842 5.842 0 0 0 5.925 5.74A5.478 5.478 0 0 0 12.9 12.5a5.29 5.29 0 0 0 1.25-3.264H9.09V7.4h6.566a7.043 7.043 0 0 1 .33 2.118 7.2 7.2 0 0 1-2.057 5.04A8.781 8.781 0 0 1 9.09 18.083Z" clipRule="evenodd"/>
    </svg>
);

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="mb-6">
    <legend className="text-lg font-semibold font-display text-gray-800 border-b border-gray-200 w-full pb-2 mb-4">{title}</legend>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </fieldset>
);

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const SelectInput: React.FC<{ id: string; name: string; options: string[] }> = ({ id, name, options }) => (
    <select id={id} name={name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white">
        {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
);

const professionOptions = [
    'Administração/Negócios',
    'Arte/Cultura/Design',
    'Autônomo(a)/Empresário(a)',
    'Ciência/Tecnologia',
    'Direito/Jurídico',
    'Educação',
    'Engenharia/Construção',
    'Estudante',
    'Finanças/Contabilidade',
    'Saúde/Medicina',
    'Hotelaria/Turismo',
    'Vendas/Marketing',
    'Outro',
].sort();


const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode, onRegistrationComplete, onLoginSuccess, navigateTo }) => {
    const [mode, setMode] = useState(initialMode);

    // Registration state
    const [birthDate, setBirthDate] = useState('');
    const [ageError, setAgeError] = useState('');
    const [states, setStates] = useState<IBGEState[]>([]);
    const [cities, setCities] = useState<IBGECity[]>([]);
    const [selectedState, setSelectedState] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isCompletingGoogleSignUp, setIsCompletingGoogleSignUp] = useState(false);

    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');


    useEffect(() => {
        if (mode === 'register') {
            fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
                .then(response => response.json())
                .then((data: IBGEState[]) => setStates(data))
                .catch(error => console.error("Error fetching states:", error));
        }
    }, [mode]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setBirthDate(date);

        if (!date) {
            setAgeError('');
            return;
        }

        const today = new Date();
        const birthDateObj = new Date(date);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }

        if (age < 18) {
            setAgeError('Você deve ter mais de 18 anos para se cadastrar.');
        } else {
            setAgeError('');
        }
    };
    
    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateAbbr = e.target.value;
        setSelectedState(stateAbbr);
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

    const isSubmitDisabled = ageError !== '' || !birthDate || !termsAccepted;
    
    const handleRegistrationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitDisabled) return;
        
        const formData = new FormData(e.currentTarget);
        const profileTypeRaw = formData.get('profile-type') as string;

        const profileTypeMap: { [key: string]: 'Baby' | 'Daddy' | 'Mommy' } = {
            'Uma Sugar Baby': 'Baby',
            'Um Sugar Daddy': 'Daddy',
            'Uma Sugar Mommy': 'Mommy',
        };
        
        const profileType = profileTypeMap[profileTypeRaw] || 'Baby';
        
        onRegistrationComplete(profileType);
    };

    const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoginError('');
        // Simulating login API call
        if (loginEmail === 'daddy@sweetaffinity.com' && loginPassword === 'password123') {
            onLoginSuccess();
        } else {
            setLoginError('Email ou senha inválidos. Tente novamente.');
        }
    };
    
    const handleGoogleSignUp = () => {
        // In a real app, this triggers Google OAuth. For simulation, switch to complete profile.
        setMode('register');
        setIsCompletingGoogleSignUp(true);
    };
    
    const renderLogin = () => (
        <>
            <h2 className="text-3xl font-bold text-center mb-6 font-display">Entrar na sua Conta</h2>
            <button 
                type="button" 
                onClick={handleGoogleSignUp}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink transition-all duration-300"
            >
                <GoogleIcon />
                Entrar com Google
            </button>
            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">OU</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <FormField label="Email">
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink" 
                      placeholder="voce@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                </FormField>
                <FormField label="Senha">
                    <input 
                        type="password" 
                        name="password" 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink" 
                        placeholder="••••••••" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                    />
                </FormField>
                {loginError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{loginError}</p>}
                 <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-md">
                    <p><strong>Para fins de demonstração:</strong></p>
                    <p>Email: <code className="font-mono">daddy@sweetaffinity.com</code></p>
                    <p>Senha: <code className="font-mono">password123</code></p>
                </div>
                <button 
                    type="submit" 
                    className="w-full mt-4 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink"
                >
                    Entrar
                </button>
            </form>
             <p className="text-center text-sm text-gray-600 mt-6">
              Não tem uma conta? <button onClick={() => setMode('register')} className="font-medium text-gradient-pink hover:text-gradient-orange">Cadastre-se</button>
            </p>
        </>
    );

    const renderRegister = () => (
         <>
            <h2 className="text-3xl font-bold text-center mb-6 font-display">Crie sua Conta</h2>
            {isCompletingGoogleSignUp && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 mb-4 text-center" role="alert">
                    <p>Conectado com Google! Agora, <strong>complete seu perfil</strong> para continuar.</p>
                </div>
            )}
            {!isCompletingGoogleSignUp && (
                <>
                    <button 
                        type="button" 
                        onClick={handleGoogleSignUp}
                        className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink transition-all duration-300"
                    >
                        <GoogleIcon />
                        Cadastre-se com Google
                    </button>
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">OU CONTINUE COM O EMAIL</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                </>
            )}
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <FormSection title="Informações de Acesso">
                 <FormField label="Email">
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink disabled:bg-gray-100" 
                      placeholder="voce@email.com"
                      defaultValue={isCompletingGoogleSignUp ? "usuario.google@exemplo.com" : ""}
                      disabled={isCompletingGoogleSignUp}
                      aria-readonly={isCompletingGoogleSignUp}
                    />
                </FormField>
                {!isCompletingGoogleSignUp && (
                    <FormField label="Senha">
                        <input type="password" name="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink" placeholder="••••••••" />
                    </FormField>
                )}
            </FormSection>
            <FormSection title="Quem é Você?">
                <FormField label="Eu sou">
                    <SelectInput id="profile-type" name="profile-type" options={['Uma Sugar Baby', 'Um Sugar Daddy', 'Uma Sugar Mommy']} />
                </FormField>
                <FormField label="Busco por">
                     <SelectInput id="seeking-type" name="seeking-type" options={['Sugar Daddy', 'Sugar Mommy', 'Sugar Baby']} />
                </FormField>
            </FormSection>
            <FormSection title="Informações Pessoais">
                 <FormField label="Data de Nascimento">
                    <input type="date" name="birthdate" value={birthDate} onChange={handleDateChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink [color-scheme:light]" />
                    {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
                    {!ageError && birthDate && <p className="text-green-600 text-xs mt-1">Idade verificada.</p>}
                </FormField>
                <FormField label="Estado Civil">
                    <SelectInput id="marital-status" name="marital-status" options={['Solteiro(a)', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Em um relacionamento']} />
                </FormField>
                <FormField label="Filhos">
                     <SelectInput id="children" name="children" options={['Nenhum', '1 filho', '2 filhos', '3 ou mais filhos']} />
                </FormField>
                <FormField label="Estado">
                    <select 
                        id="state" 
                        name="state" 
                        value={selectedState}
                        onChange={handleStateChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white"
                    >
                        <option value="">Selecione um estado</option>
                        {states.map(state => (
                            <option key={state.id} value={state.sigla}>{state.nome}</option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Cidade">
                    <select 
                        id="city" 
                        name="city" 
                        disabled={!selectedState || isLoadingCities}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">{isLoadingCities ? 'Carregando cidades...' : 'Selecione uma cidade'}</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.nome}>{city.nome}</option>
                        ))}
                    </select>
                </FormField>
            </FormSection>
            <FormSection title="Aparência">
                <FormField label="Altura">
                    <SelectInput id="height" name="height" options={['Menos de 1.50m', '1.50m - 1.60m', '1.60m - 1.70m', '1.70m - 1.80m', '1.80m - 1.90m', 'Mais de 1.90m']} />
                </FormField>
                <FormField label="Tipo Físico">
                    <SelectInput id="body-type" name="body-type" options={['Atlético', 'Em forma', 'Médio', 'Alguns quilos a mais', 'Acima do peso']} />
                </FormField>
                 <FormField label="Etnia">
                    <SelectInput id="ethnicity" name="ethnicity" options={['Asiático', 'Branco/Caucasiano', 'Indígena', 'Latino/Hispânico', 'Negro/Afrodescendente', 'Outro']} />
                </FormField>
                <FormField label="Cor do Cabelo">
                    <SelectInput id="hair-color" name="hair-color" options={['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Grisalho', 'Outro']} />
                </FormField>
                <FormField label="Cor dos Olhos">
                    <SelectInput id="eye-color" name="eye-color" options={['Preto', 'Castanho', 'Azul', 'Verde', 'Cor de mel', 'Outro']} />
                </FormField>
            </FormSection>
            <FormSection title="Estilo de Vida">
                <FormField label="Fuma?">
                    <SelectInput id="smoking" name="smoking" options={['Nunca', 'Socialmente', 'Frequentemente']} />
                </FormField>
                <FormField label="Bebe?">
                    <SelectInput id="drinking" name="drinking" options={['Nunca', 'Socialmente', 'Frequentemente']} />
                </FormField>
                <FormField label="Disposto(a) a viajar?">
                    <SelectInput id="travel" name="travel" options={['Localmente', 'Nacionalmente', 'Internacionalmente', 'Mundo inteiro']} />
                </FormField>
            </FormSection>
            <FormSection title="Carreira e Finanças">
                <FormField label="Escolaridade">
                    <SelectInput id="education" name="education" options={['Ensino Médio', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação', 'Mestrado', 'Doutorado']} />
                </FormField>
                <FormField label="Profissão">
                    <SelectInput id="occupation" name="occupation" options={professionOptions} />
                </FormField>
                <FormField label="Renda Anual">
                    <SelectInput id="income" name="income" options={['Até R$ 50 mil', 'R$ 50 mil a R$ 100 mil', 'R$ 100 mil a R$ 250 mil', 'R$ 250 mil a R$ 500 mil', 'Acima de R$ 500 mil']} />
                </FormField>
                <FormField label="Patrimônio Líquido">
                    <SelectInput id="net-worth" name="net-worth" options={['Até R$ 100 mil', 'R$ 100 mil a R$ 500 mil', 'R$ 500 mil a R$ 1 milhão', 'R$ 1 milhão a R$ 5 milhões', 'Acima de R$ 5 milhões']} />
                </FormField>
            </FormSection>
          <div className="pt-4">
            <div className="flex items-center">
                <input id="terms" name="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-4 w-4 text-gradient-pink focus:ring-gradient-pink border-gray-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Eu li, concordo com os <button type="button" onClick={() => { onClose(); navigateTo('terms'); }} className="font-medium text-gradient-pink hover:text-gradient-orange underline">Termos de Uso</button> e confirmo que tenho 18 anos ou mais.
                </label>
            </div>
            <button 
                type="submit" 
                className="w-full mt-4 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitDisabled}
            >
                Continuar para Fotos
            </button>
          </div>
        </form>
         <p className="text-center text-sm text-gray-600 mt-6">
              Já tem uma conta? <button onClick={() => setMode('login')} className="font-medium text-gradient-pink hover:text-gradient-orange">Entrar</button>
            </p>
        </>
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full relative transform transition-all animate-fade-in-down max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {mode === 'login' ? renderLogin() : renderRegister()}
      </div>
    </div>
  );
};

export default AuthModal;