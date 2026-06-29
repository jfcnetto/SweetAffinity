import { useState } from 'react';
import { apiRequest } from '../utils/api'; // Importa o nosso novo concentrador nativo
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';

type ProfileType = 'Baby' | 'Daddy' | 'Mommy';

interface UseAuthFormProps {
  onRegistrationComplete: (profileType: ProfileType) => void;
  onLoginSuccess: (userType: ProfileType, isPremium: boolean) => void;
}

export const useAuthForm = ({ onRegistrationComplete, onLoginSuccess }: UseAuthFormProps) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  const [isCompletingGoogleSignUp, setIsCompletingGoogleSignUp] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── SUBMISSÃO DE LOGIN NATIVO (FASTIFY Core) ──────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    const toastId = showLoading('Entrando na sua conta...');

    try {
      // Faz o POST direto para o nosso endpoint local na porta 4000
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      // Se o Fastify validou o par email/password, ele devolve o token e o usuário
      if (data.token) {
        localStorage.setItem('sweet_token', data.token); // Grava a sessão localmente
        
        // Puxa as propriedades de perfil reais retornadas pela API nativa
        const profileType = data.user.profile_type as ProfileType;
        const isPremium = data.user.is_premium || false;

        dismissToast(toastId);
        showSuccess('Login realizado com sucesso!');
        onLoginSuccess(profileType, isPremium);
      }
    } catch (error: any) {
      dismissToast(toastId);
      setLoginError(error.message);
      showError(`Erro no login: ${error.message}`);
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SUBMISSÃO DE REGISTRO NATIVO (FASTIFY Transacional) ───────────────
  const handleRegistrationSubmit = async (formData: FormData, birthDate: string) => {
    setIsSubmitting(true);
    const toastId = showLoading('Registrando sua conta...');

    const profileTypeRaw = formData.get('profile-type') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const profileTypeMap: { [key: string]: ProfileType } = {
      'Uma Sugar Baby': 'Baby',
      'Um Sugar Daddy': 'Daddy',
      'Uma Sugar Mommy': 'Mommy',
    };
    const profileType = profileTypeMap[profileTypeRaw] || 'Baby';

    try {
      // Envia os dados agregados mapeados para o padrão snake_case do Postgres local
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          profile_type: profileType,
          birth_date: birthDate,
          marital_status: formData.get('marital-status'),
          children: formData.get('children'),
          state: formData.get('state'),
          city: formData.get('city'),
          height_range: formData.get('height'), // Alinhado ao contrato do Postgres local
          body_type: formData.get('body-type'),
          ethnicity: formData.get('ethnicity'),
          hair_color: formData.get('hair-color'),
          eye_color: formData.get('eye-color'),
          smoking: formData.get('smoking'),
          drinking: formData.get('drinking'),
          travel: formData.get('travel'),
          education: formData.get('education'),
          profession: formData.get('occupation'), // Alinhado à coluna profession do Postgres local
          income_range: formData.get('income'), // Alinhado ao padrão de ranges do banco local
          net_worth: formData.get('net-worth')
        }),
      });

      dismissToast(toastId);
      showSuccess(data.message || 'Cadastro realizado com sucesso!');
      
      // Prossegue o fluxo chamando o gatilho visual para ir para o upload de fotos
      onRegistrationComplete(profileType);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Erro no cadastro: ${error.message}`);
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fluxo OAuth removido temporariamente em concordância com a arquitetura 100% interna
  const handleGoogleSignUp = async () => {
    showError("O cadastro via Google foi desativado temporariamente para manutenção preventiva.");
  };

  return {
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    loginError, setLoginError,
    registrationEmail, setRegistrationEmail,
    registrationPassword, setRegistrationPassword,
    isCompletingGoogleSignUp, setIsCompletingGoogleSignUp,
    isSubmitting,
    handleLoginSubmit,
    handleGoogleSignUp,
  };
};