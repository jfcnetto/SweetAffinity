import React, { useState, useEffect } from 'react';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Card } from '../design-system/components/Card';
import { toast } from '../design-system/components/Toast';
import { api } from '../services/api';
import { ArrowLeft, ArrowRight, Check, Upload, User, Image, Heart, MapPin, Briefcase } from 'lucide-react';
import { 
    PROFILE_TYPES, SEEKING_GENDER, MARITAL_STATUSES, CHILDREN_OPTIONS, 
    HEIGHT_OPTIONS, BODY_TYPES, ETHNICITIES, HAIR_COLORS, EYE_COLORS, 
    SMOKING_OPTIONS, DRINKING_OPTIONS, TRAVEL_OPTIONS, EDUCATION_LEVELS, 
    PROFESSION_OPTIONS, INCOME_RANGES, NET_WORTH_RANGES, PARTNERSHIP_TYPES, MEETING_FREQUENCIES, GENDER_OPTIONS
} from '../constants/profileOptions';

interface OnboardingWizardProps {
  onComplete: () => void;
  userId: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, userId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [relationshipType, setRelationshipType] = useState<'baby' | 'daddy' | 'mommy'>('baby');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('female');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [seekingDescription, setSeekingDescription] = useState('');
  
  // Style of Life (Step 3)
  const [availability, setAvailability] = useState('');
  const [partnershipType, setPartnershipType] = useState('companionship');
  const [meetingFrequency, setMeetingFrequency] = useState('flexible');
  const [incomeRange, setIncomeRange] = useState('');

  // New fields from AuthModal parity
  const [maritalStatus, setMaritalStatus] = useState('');
  const [children, setChildren] = useState('');
  const [heightRange, setHeightRange] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [travelPreference, setTravelPreference] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [netWorth, setNetWorth] = useState('');

  // Photos (Step 4)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Autosave / draft restore on mount
  useEffect(() => {
    const draft = localStorage.getItem(`onboarding_draft_${userId}`);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setRelationshipType(data.relationshipType || 'baby');
        setDisplayName(data.displayName || '');
        setBirthDate(data.birthDate || '');
        setGender(data.gender || 'female');
        setState(data.state || '');
        setCity(data.city || '');
        setBio(data.bio || '');
        setSeekingDescription(data.seekingDescription || '');
        setAvailability(data.availability || '');
        setPartnershipType(data.partnershipType || 'companionship');
        setMeetingFrequency(data.meetingFrequency || 'flexible');
        setIncomeRange(data.incomeRange || '');
        if (data.step) setStep(data.step);
      } catch (e) {
        console.error('Failed to parse onboarding draft', e);
      }
    }
  }, [userId]);

  // Save draft on state change
  const saveDraft = (nextStep: number) => {
    const draftData = {
      relationshipType,
      displayName,
      birthDate,
      gender,
      state,
      city,
      bio,
      seekingDescription,
      availability,
      partnershipType,
      meetingFrequency,
      incomeRange,
      maritalStatus, children, heightRange, bodyType, ethnicity, 
      hairColor, eyeColor, smoking, drinking, travelPreference, 
      education, profession, netWorth,
      step: nextStep
    };
    localStorage.setItem(`onboarding_draft_${userId}`, JSON.stringify(draftData));
  };

  const handleNext = () => {
    if (step === 1 && (!displayName || !birthDate)) {
      toast.error('Preencha o seu nome e data de nascimento.');
      return;
    }
    if (step === 2 && (!state || !city || !bio)) {
      toast.error('Preencha a sua localização e biografia.');
      return;
    }
    if (step === 1) {
      // Validar idade >= 18
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      
      if (age < 18) {
        toast.error('Você precisa ter 18 anos ou mais.');
        return;
      }
    }
    const next = step + 1;
    setStep(next);
    saveDraft(next);
  };

  const handleBack = () => {
    const prev = step - 1;
    setStep(prev);
    saveDraft(prev);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('A foto deve ter no máximo 10MB.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        displayName,
        birthDate,
        gender,
        relationshipType,
        state,
        city,
        bio,
        seekingDescription,
        availability,
        partnershipType,
        meetingFrequency,
        incomeRange: (relationshipType === 'daddy' || relationshipType === 'mommy') ? incomeRange : undefined,
        maritalStatus,
        children,
        heightRange,
        bodyType,
        ethnicity,
        hairColor,
        eyeColor,
        smoking,
        drinking,
        travelPreference,
        education,
        profession,
        netWorth
      };

      // 1. Enviar os dados do perfil
      await api.post('/profiles', payload);

      // 2. Se houver foto, fazer upload
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post('/photos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Perfil enviado para verificação com sucesso!');
      localStorage.removeItem(`onboarding_draft_${userId}`);
      onComplete();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao salvar perfil. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      {/* Progresso */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
          <span>Passo {step} de 5</span>
          <span>{Math.round((step / 5) * 100)}% Concluído</span>
        </div>
        <div className="w-full h-2 bg-gray-150 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gradient-pink to-gradient-orange transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-8 shadow-xl border-none">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Como você deseja se identificar?</h2>
              <p className="text-gray-500 text-sm mt-1">Selecione seu papel na nossa comunidade.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['baby', 'daddy', 'mommy'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRelationshipType(type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    relationshipType === type
                      ? 'border-red-500 bg-red-50/30 text-red-650'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold capitalize">
                    {type === 'baby' ? 'Sugar Baby' : type === 'daddy' ? 'Sugar Daddy' : 'Sugar Mommy'}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Input
                label="Nome de Exibição"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Clara, Alexandre..."
                required
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="[color-scheme:light]"
              />
            </div>
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Seu Gênero</label>
                <select 
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Onde você está localizado?</h2>
              <p className="text-gray-500 text-sm mt-1">Isso ajuda a encontrar conexões próximas a você.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Estado (UF)"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="Ex: SP, RJ"
                maxLength={2}
                required
              />
              <Input
                label="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                  Escreva um resumo sobre você (Biografia)
                </label>
                <textarea
                  className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 min-h-[100px]"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre seu estilo de vida, interesses e objetivos..."
                  maxLength={1000}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Seu Estilo de Vida</h2>
              <p className="text-gray-500 text-sm mt-1">Alinhe expectativas de forma clara e direta.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Altura</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={heightRange} onChange={(e) => setHeightRange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {HEIGHT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Tipo Físico</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                  <option value="">Selecione...</option>
                  {BODY_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Etnia</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)}>
                  <option value="">Selecione...</option>
                  {ETHNICITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Cor do Cabelo</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={hairColor} onChange={(e) => setHairColor(e.target.value)}>
                  <option value="">Selecione...</option>
                  {HAIR_COLORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Cor dos Olhos</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)}>
                  <option value="">Selecione...</option>
                  {EYE_COLORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Fuma?</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={smoking} onChange={(e) => setSmoking(e.target.value)}>
                  <option value="">Selecione...</option>
                  {SMOKING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Bebe?</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={drinking} onChange={(e) => setDrinking(e.target.value)}>
                  <option value="">Selecione...</option>
                  {DRINKING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Estado Civil</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                  <option value="">Selecione...</option>
                  {MARITAL_STATUSES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Filhos</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={children} onChange={(e) => setChildren(e.target.value)}>
                  <option value="">Selecione...</option>
                  {CHILDREN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Viagens</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={travelPreference} onChange={(e) => setTravelPreference(e.target.value)}>
                  <option value="">Selecione...</option>
                  {TRAVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-150">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Escolaridade</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={education} onChange={(e) => setEducation(e.target.value)}>
                  <option value="">Selecione...</option>
                  {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Profissão</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={profession} onChange={(e) => setProfession(e.target.value)}>
                  <option value="">Selecione...</option>
                  {PROFESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Renda Anual</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {INCOME_RANGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Patrimônio Líquido</label>
                <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={netWorth} onChange={(e) => setNetWorth(e.target.value)}>
                  <option value="">Selecione...</option>
                  {NET_WORTH_RANGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-150">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Tipo de Acordo Esperado</label>
                  <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={partnershipType} onChange={(e) => setPartnershipType(e.target.value)}>
                    <option value="">Selecione...</option>
                    {PARTNERSHIP_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">Frequência de Encontros</label>
                  <select className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white" value={meetingFrequency} onChange={(e) => setMeetingFrequency(e.target.value)}>
                    <option value="">Selecione...</option>
                    {MEETING_FREQUENCIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-150">
              <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                Disponibilidade (Ex: Finais de semana, viagens)
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="Ex: Disponível para viagens e encontros noturnos"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sua Foto de Perfil</h2>
              <p className="text-gray-500 text-sm mt-1">Perfil com fotos nítidas têm 8x mais chances de match.</p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              {photoPreview ? (
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-md">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-32">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-600">Selecione uma foto do computador</span>
                  <span className="text-xs text-gray-400 mt-1">Formatos aceitos: JPG, PNG ou WebP (Máx. 10MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              )}
            </div>

            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                O que você busca em um parceiro? (Opcional)
              </label>
              <textarea
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 min-h-[80px]"
                value={seekingDescription}
                onChange={(e) => setSeekingDescription(e.target.value)}
                placeholder="Descreva as qualidades que você valoriza em um relacionamento sugar..."
                maxLength={500}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Revisão do Perfil</h2>
              <p className="text-gray-500 text-sm mt-1">Revise suas informações antes de enviar para a moderação.</p>
            </div>

            <div className="space-y-4 text-sm bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                <span className="text-gray-500 font-medium">Nome</span>
                <span className="text-gray-900 font-bold">{displayName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                <span className="text-gray-500 font-medium">Papel</span>
                <span className="text-gray-900 font-bold capitalize">{relationshipType === 'baby' ? 'Sugar Baby' : relationshipType === 'daddy' ? 'Sugar Daddy' : 'Sugar Mommy'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                <span className="text-gray-500 font-medium">Localização</span>
                <span className="text-gray-900 font-bold">{city} - {state}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                <span className="text-gray-500 font-medium">Acordo Desejado</span>
                <span className="text-gray-900 font-bold capitalize">
                  {partnershipType === 'companionship' ? 'Companheirismo' : partnershipType === 'financial' ? 'Suporte Financeiro' : partnershipType === 'mentorship' ? 'Mentoria' : 'Viagens'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 font-medium block mb-1">Biografia</span>
                <p className="text-gray-700 italic text-xs leading-relaxed line-clamp-3">{bio}</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 text-xs text-rose-800 p-4 rounded-xl">
              ⚠️ <strong>Importante:</strong> Após a confirmação, seu perfil passará por uma análise de moderação automática/manual para garantir a segurança da nossa comunidade. Ele ficará ativo nas listagens públicas assim que for aprovado.
            </div>
          </div>
        )}

        {/* Ações de navegação do Wizard */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-150">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Avançar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleSubmit} isLoading={loading}>
              Confirmar & Enviar <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
