import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { toast } from '../design-system/components/Toast';
import { Modal } from '../design-system/components/Modal';

interface AuthModalProps {
  onClose: () => void;
  initialMode: 'login' | 'register';
  onRegistrationComplete: (profileType: 'Baby' | 'Daddy' | 'Mommy') => void;
  onLoginSuccess: (user: any) => void;
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

import { 
    PROFILE_TYPES, SEEKING_GENDER, MARITAL_STATUSES, CHILDREN_OPTIONS, 
    HEIGHT_OPTIONS, BODY_TYPES, ETHNICITIES, HAIR_COLORS, EYE_COLORS, 
    SMOKING_OPTIONS, DRINKING_OPTIONS, TRAVEL_OPTIONS, EDUCATION_LEVELS, 
    PROFESSION_OPTIONS, INCOME_RANGES, NET_WORTH_RANGES, PARTNERSHIP_TYPES, MEETING_FREQUENCIES,
    GENDER_OPTIONS
} from '../constants/profileOptions';

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="mb-6">
    <legend className="text-lg font-semibold font-display text-white border-b border-gray-850 w-full pb-2 mb-4">{title}</legend>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </fieldset>
);

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
    {children}
  </div>
);

const SelectInput: React.FC<{ id: string; name: string; options: any[]; required?: boolean }> = ({ id, name, options, required = false }) => (
    <select id={id} name={name} required={required} className="mt-1 block w-full px-3 py-2 border border-gray-350 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-slate-900">
        <option value="">Selecione...</option>
        {options.map(opt => (
            typeof opt === 'string' 
                ? <option key={opt} value={opt}>{opt}</option> 
                : <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);


const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode, onRegistrationComplete, onLoginSuccess, navigateTo }) => {
    const [mode, setMode] = useState(initialMode);
    const { login } = useAuth();

    // Registration state
    const [birthDate, setBirthDate] = useState('');
    const [ageError, setAgeError] = useState('');
    const [states, setStates] = useState<IBGEState[]>([]);
    const [cities, setCities] = useState<IBGECity[]>([]);
    const [selectedState, setSelectedState] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isCompletingGoogleSignUp, setIsCompletingGoogleSignUp] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');

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
    
    // CONEXÃO REAL: Endpoint de Cadastro do Servidor Fastify
    const handleRegistrationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitDisabled) return;
        setRegisterError('');
        
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const profileTypeRaw = formData.get('profile-type') as string;

        const profileType = profileTypeRaw || 'baby';
        
        // Coleta todos os campos adicionais do estilo de vida para enviar à API
        const payload = {
            email,
            password,
            profile_type: profileType,
            display_name: email.split('@')[0],
            birth_date: birthDate,
            state: formData.get('state'),
            city: formData.get('city'),
            gender: formData.get('gender'),
            seeking_gender: formData.get('seeking-type'),
            marital_status: formData.get('marital-status'),
            height_range: formData.get('height'),
            ethnicity: formData.get('ethnicity'),
            hair_color: formData.get('hair-color'),
            eye_color: formData.get('eye-color'),
            smoking: formData.get('smoking'),
            drinking: formData.get('drinking'),
            education: formData.get('education'),
            profession: formData.get('occupation'),
            income_range: formData.get('income'),
            partnership_type: formData.get('partnership-type'),
            meeting_frequency: formData.get('meeting-frequency')
        };

        try {
            const response = await api.post('/auth/register', payload);
            const data = response.data;
            
            if (data.message === 'VERIFICATION_EMAIL_SENT') {
                setRegisteredEmail(email);
                setMode('verify_sent' as any);
                toast.success('E-mail de confirmação enviado! Verifique seu e-mail.');
            } else {
                if (data.accessToken && data.refreshToken) {
                    login(data.accessToken, data.refreshToken);
                }
                toast.success('Cadastro realizado com sucesso!');
                onRegistrationComplete(profileType);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro de conexão com o servidor.';
            setRegisterError(msg);
            toast.error(msg);
        }
    };

    // CONEXÃO REAL: Endpoint de Login do Servidor Fastify
    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoginError('');

        try {
            const response = await api.post('/auth/login', { 
                email: loginEmail, 
                password: loginPassword 
            });

            const data = response.data;
            
            login(data.accessToken, data.refreshToken);
            toast.success('Bem-vindo de volta!');
            onLoginSuccess(data.user);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao conectar à API.';
            if (msg === 'EMAIL_NOT_VERIFIED') {
                setRegisteredEmail(loginEmail);
                setMode('verify_sent' as any);
                toast.error('E-mail não verificado. Verifique seu e-mail para prosseguir.');
            } else {
                setLoginError(msg);
                toast.error(msg);
            }
        }
    };
    
    const handleGoogleSignUp = () => {
        let profileType = 'baby';
        const profileTypeEl = document.getElementById('profile-type') as HTMLSelectElement;
        if (profileTypeEl) {
            profileType = raw || 'baby';
        }
        localStorage.setItem('pendingProfileType', profileType);
        window.location.href = `http://localhost:4000/auth/google`;
    };
    
    const renderLogin = () => (
        <>
            <h2 className="text-3xl font-bold text-center mb-6 font-display text-white">Entrar na sua Conta</h2>
            <button 
                type="button" 
                onClick={handleGoogleSignUp}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-slate-950 font-bold text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 border border-gray-200"
            >
                <GoogleIcon />
                <span className="text-slate-950 font-bold">Entrar com Google</span>
            </button>
            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">OU</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input 
                  type="email" 
                  name="email" 
                  label="Email"
                  required 
                  placeholder="voce@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <Input 
                    type="password" 
                    name="password" 
                    label="Senha"
                    required 
                    placeholder="••••••••" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                />
                {loginError && <p className="text-red-500 text-sm text-center bg-red-950/50 p-3 rounded-lg border border-red-800">{loginError}</p>}
                <Button 
                    type="submit" 
                    variant="primary"
                    className="w-full mt-4"
                >
                    Entrar
                </Button>
            </form>
             <p className="text-center text-sm text-gray-300 mt-6">
              Não tem uma conta? <button onClick={() => setMode('register')} className="font-semibold text-gradient-pink hover:text-gradient-orange">Cadastre-se</button>
            </p>
        </>
    );

    const renderRegister = () => (
         <>
            <h2 className="text-3xl font-bold text-center mb-6 font-display text-white">Crie sua Conta</h2>
            {isCompletingGoogleSignUp && (
                <div className="bg-blue-950/40 border border-blue-800 text-blue-200 text-sm rounded-lg p-3 mb-4 text-center" role="alert">
                    <p>Conectado com Google! Agora, <strong>complete seu perfil</strong> para continuar.</p>
                </div>
            )}
            {!isCompletingGoogleSignUp && (
                <>
                    <button 
                        type="button" 
                        onClick={handleGoogleSignUp}
                        className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-slate-950 font-bold text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 border border-gray-200"
                    >
                        <GoogleIcon />
                        <span className="text-slate-950 font-bold">Cadastre-se com Google</span>
                    </button>
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">OU CONTINUE COM O EMAIL</span>
                        <div className="flex-grow border-t border-gray-700"></div>
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
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink disabled:bg-gray-100 text-slate-900" 
                      placeholder="voce@email.com"
                      defaultValue={isCompletingGoogleSignUp ? "usuario.google@exemplo.com" : ""}
                      disabled={isCompletingGoogleSignUp}
                      aria-readonly={isCompletingGoogleSignUp}
                    />
                </FormField>
                {!isCompletingGoogleSignUp && (
                    <FormField label="Senha">
                        <input type="password" name="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink text-slate-900" placeholder="••••••••" />
                    </FormField>
                )}
            </FormSection>
            <FormSection title="Quem é Você?">
                <FormField label="Tipo de Perfil (Relacionamento)">
                    <SelectInput id="profile-type" name="profile-type" options={PROFILE_TYPES} required />
                </FormField>
                <FormField label="Meu Gênero">
                     <SelectInput id="gender" name="gender" options={GENDER_OPTIONS} required />
                </FormField>
                <FormField label="Está em busca de quê?">
                     <SelectInput id="seeking-type" name="seeking-type" options={SEEKING_GENDER} required />
                </FormField>
            </FormSection>
            <FormSection title="Informações Pessoais">
                 <FormField label="Data de Nascimento">
                    <input type="date" name="birthdate" value={birthDate} onChange={handleDateChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink [color-scheme:light] text-slate-900" />
                    {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
                    {!ageError && birthDate && <p className="text-green-500 text-xs mt-1 font-semibold">Idade verificada.</p>}
                </FormField>
                <FormField label="Estado Civil">
                    <SelectInput id="marital-status" name="marital-status" options={MARITAL_STATUSES} required />
                </FormField>
                <FormField label="Filhos">
                     <SelectInput id="children" name="children" options={CHILDREN_OPTIONS} required />
                </FormField>
                <FormField label="Estado">
                    <select 
                        id="state" 
                        name="state" 
                        value={selectedState}
                        onChange={handleStateChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-350 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white text-slate-900"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-350 rounded-md shadow-sm focus:outline-none focus:ring-gradient-pink focus:border-gradient-pink bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-slate-900"
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
                    <SelectInput id="height" name="height" options={HEIGHT_OPTIONS} required />
                </FormField>
                <FormField label="Tipo de corpo">
                    <SelectInput id="body-type" name="body-type" options={BODY_TYPES} required />
                </FormField>
                 <FormField label="Tom de Pele">
                    <SelectInput id="ethnicity" name="ethnicity" options={ETHNICITIES} required />
                </FormField>
                <FormField label="Cabelo">
                    <SelectInput id="hair-color" name="hair-color" options={HAIR_COLORS} required />
                </FormField>
                <FormField label="Cor dos olhos">
                    <SelectInput id="eye-color" name="eye-color" options={EYE_COLORS} required />
                </FormField>
            </FormSection>
            <FormSection title="Estilo de Vida">
                <FormField label="Você fuma?">
                    <SelectInput id="smoking" name="smoking" options={SMOKING_OPTIONS} required />
                </FormField>
                <FormField label="Você bebe?">
                    <SelectInput id="drinking" name="drinking" options={DRINKING_OPTIONS} required />
                </FormField>
                <FormField label="Disponibilidade para viajar">
                    <SelectInput id="travel" name="travel" options={TRAVEL_OPTIONS} required />
                </FormField>
            </FormSection>
            <FormSection title="Carreira e Finanças">
                <FormField label="Formação acadêmica">
                    <SelectInput id="education" name="education" options={EDUCATION_LEVELS} required />
                </FormField>
                <FormField label="Profissão">
                    <SelectInput id="occupation" name="occupation" options={PROFESSION_OPTIONS} required />
                </FormField>
                <FormField label="Renda Mensal / Orçamento">
                    <SelectInput id="income" name="income" options={INCOME_RANGES} required />
                </FormField>
                <FormField label="Patrimônio pessoal">
                    <SelectInput id="net-worth" name="net-worth" options={NET_WORTH_RANGES} required />
                </FormField>
                <FormField label="Acordo Esperado">
                    <SelectInput id="partnership-type" name="partnership-type" options={PARTNERSHIP_TYPES} required />
                </FormField>
                <FormField label="Frequência de Encontros">
                    <SelectInput id="meeting-frequency" name="meeting-frequency" options={MEETING_FREQUENCIES} required />
                </FormField>
            </FormSection>
          <div className="pt-4">
            <div className="flex items-start">
                <input id="terms" name="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 text-gradient-pink focus:ring-gradient-pink border-gray-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-xs text-gray-300 leading-normal">
                  Eu li, concordo com os <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-gradient-pink hover:text-gradient-orange underline">Termos de Uso</a>, a <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-gradient-pink hover:text-gradient-orange underline">Política de Privacidade</a> e confirmo que tenho 18 anos ou mais, declarando estar ciente de que a plataforma atua estritamente como meio de aproximação online, <strong>isentando-se de qualquer responsabilidade por atos, incidentes ou danos ocorridos em encontros presenciais offline</strong>.
                </label>
            </div>
            {registerError && <p className="text-red-500 text-sm text-center bg-red-950/50 p-3 rounded-lg border border-red-800 mt-4">{registerError}</p>}
            <button 
                type="submit" 
                className="w-full mt-4 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitDisabled}
            >
                Continuar para Fotos
            </button>
          </div>
        </form>
          <p className="text-center text-sm text-gray-300 mt-6">
              Já tem uma conta? <button onClick={() => setMode('login')} className="font-semibold text-gradient-pink hover:text-gradient-orange">Entrar</button>
            </p>
         </>
    );

    const renderVerifySent = () => (
        <div className="text-center py-6">
            <div className="w-16 h-16 bg-pink-950/40 text-gradient-pink rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 font-display text-white">Verifique seu E-mail</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Enviamos um e-mail de confirmação para <strong className="text-white">{registeredEmail}</strong>.<br />
                Por favor, clique no link contido no e-mail para verificar seu endereço e prosseguir com o envio das fotos.
            </p>
            <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 text-xs text-amber-250 text-left max-w-md mx-auto mb-6">
                <p className="font-semibold mb-1 text-amber-300">💡 Dica do Desenvolvedor:</p>
                Como o projeto está rodando localmente, o link de confirmação também foi impresso no <strong>terminal do seu backend</strong>! Basta copiá-lo e colá-lo no navegador para simular a verificação.
            </div>
            <button 
                onClick={() => setMode('login')} 
                className="px-6 py-2.5 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-md"
            >
                Voltar para o Login
            </button>
        </div>
    );

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="2xl" variant="dark">
      {mode === 'login' ? renderLogin() : mode === 'register' ? renderRegister() : renderVerifySent()}
    </Modal>
  );
};

export default AuthModal;