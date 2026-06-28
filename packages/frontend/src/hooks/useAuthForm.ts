import { useState } from 'react';
import { supabase } from '../../supabase'; // Caminho corrigido para a raiz
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
  const [isCompletingGoogleSignUp, setIsCompletingGoogleSignUp] = useState(false); // For Google flow
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    const toastId = showLoading('Entrando na sua conta...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profile_type, is_premium')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        dismissToast(toastId);
        showSuccess('Login realizado com sucesso!');
        onLoginSuccess(profileData.profile_type, profileData.is_premium);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            profile_type: profileType,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              profile_type: profileType,
              marital_status: formData.get('marital-status'),
              children: formData.get('children'),
              state: formData.get('state'),
              city: formData.get('city'),
              height: formData.get('height'),
              body_type: formData.get('body-type'),
              ethnicity: formData.get('ethnicity'),
              hair_color: formData.get('hair-color'),
              eye_color: formData.get('eye-color'),
              smoking: formData.get('smoking'),
              drinking: formData.get('drinking'),
              travel: formData.get('travel'),
              education: formData.get('education'),
              occupation: formData.get('occupation'),
              income: formData.get('income'),
              net_worth: formData.get('net-worth'),
              birth_date: birthDate,
              is_verified: false,
              is_premium: false,
              popularity: 0,
              registered_date: new Date().toISOString(),
              image_urls: [],
            }
          ]);

        if (profileError) {
          throw profileError;
        }

        dismissToast(toastId);
        showSuccess('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.');
        onRegistrationComplete(profileType);
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Erro no cadastro: ${error.message}`);
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    const toastId = showLoading('Redirecionando para Google...');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Erro ao entrar com Google: ${error.message}`);
      console.error('Google sign-in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    loginError, setLoginError,
    registrationEmail, setRegistrationEmail,
    registrationPassword, setRegistrationPassword,
    isCompletingGoogleSignUp, setIsCompletingGoogleSignUp,
    isSubmitting, setIsSubmitting,
    handleLoginSubmit,
    handleRegistrationSubmit,
    handleGoogleSignUp,
  };
};