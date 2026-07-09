'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../design-system/components/Button';
import { Input } from '../../../design-system/components/Input';
import { Card } from '../../../design-system/components/Card';
import { Badge } from '../../../design-system/components/Badge';
import { toast } from '../../../design-system/components/Toast';
import { 
    PROFILE_TYPES, SEEKING_GENDER, MARITAL_STATUSES, CHILDREN_OPTIONS, 
    HEIGHT_OPTIONS, BODY_TYPES, ETHNICITIES, HAIR_COLORS, EYE_COLORS, 
    SMOKING_OPTIONS, DRINKING_OPTIONS, TRAVEL_OPTIONS, EDUCATION_LEVELS, 
    PROFESSION_OPTIONS, INCOME_RANGES, NET_WORTH_RANGES, PARTNERSHIP_TYPES, MEETING_FREQUENCIES
} from '../../../../constants/profileOptions';
import { ArrowLeft, Heart, Shield, Flag, MessageCircle, Edit3, Save, X, User } from 'lucide-react';

interface Profile {
  id: string;
  displayName: string;
  birthDate?: string;
  bio?: string;
  city?: string;
  state?: string;
  profession?: string;
  relationshipType: string;
  popularityScore: number;
  profileViews: number;
  availability?: string;
  partnershipType?: string;
  meetingFrequency?: string;
  incomeRange?: string;
  heightRange?: string;
  ethnicity?: string;
  hairColor?: string;
  eyeColor?: string;
  smoking?: string;
  drinking?: string;
  education?: string;
  seekingDescription?: string;
  country?: string;
  bodyType?: string;
  skinTone?: string;
  children?: string;
  netWorth?: string;
  maritalStatus?: string;
  seekingGender?: string;
  travelPreference?: string;
  photos?: any[];
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states for editing
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [profession, setProfession] = useState('');
  const [availability, setAvailability] = useState('');
  const [partnershipType, setPartnershipType] = useState('companionship');
  const [meetingFrequency, setMeetingFrequency] = useState('flexible');
  const [relationshipType, setRelationshipType] = useState('baby');
  const [incomeRange, setIncomeRange] = useState('');
  const [seekingDescription, setSeekingDescription] = useState('');
  
  // Novas variáveis de formulário
  const [country, setCountry] = useState('Brasil');
  const [bodyType, setBodyType] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [heightRange, setHeightRange] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [children, setChildren] = useState('');
  const [education, setEducation] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [seekingGender, setSeekingGender] = useState('');
  const [travelPreference, setTravelPreference] = useState('');

  const isOwner = currentUser?.id === params.id || currentUser?.sub === params.id;

  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchMyPhotos = async () => {
    if (!isOwner) return;
    try {
      const response = await api.get('/photos/my-photos');
      setMyPhotos(response.data);
    } catch (err) {
      console.error("Erro ao carregar fotos:", err);
    }
  };

  const handleSetPrimaryPhoto = async (photoId: string) => {
    try {
      await api.put(`/photos/${photoId}/primary`);
      toast.success('Foto definida como principal!');
      fetchMyPhotos();
      fetchProfile();
    } catch {
      toast.error('Erro ao definir foto principal.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;
    try {
      await api.delete(`/photos/${photoId}`);
      toast.success('Foto excluída com sucesso!');
      fetchMyPhotos();
      fetchProfile();
    } catch {
      toast.error('Erro ao excluir foto.');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setUploadingPhoto(true);
    try {
      const response = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (myPhotos.length === 0 && response.data?.photo?.id) {
        await api.put(`/photos/${response.data.photo.id}/primary`);
      }
      toast.success('Foto enviada com sucesso!');
      fetchMyPhotos();
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profiles/${params.id}`);
      const data = response.data;
      setProfile(data);
      
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setCity(data.city || '');
      setState(data.state || '');
      setProfession(data.profession || '');
      setAvailability(data.availability || '');
      setPartnershipType(data.partnershipType || 'companionship');
      setMeetingFrequency(data.meetingFrequency || 'flexible');
      setRelationshipType(data.relationshipType || 'baby');
      setIncomeRange(data.incomeRange || '');
      setSeekingDescription(data.seekingDescription || '');
      setCountry(data.country || 'Brasil');
      setBodyType(data.bodyType || '');
      setSkinTone(data.skinTone || '');
      setHairColor(data.hairColor || '');
      setEyeColor(data.eyeColor || '');
      setHeightRange(data.heightRange || '');
      setSmoking(data.smoking || '');
      setDrinking(data.drinking || '');
      setMaritalStatus(data.maritalStatus || '');
      setChildren(data.children || '');
      setEducation(data.education || '');
      setNetWorth(data.netWorth || '');
      setSeekingGender(data.seekingGender || '');
      setTravelPreference(data.travelPreference || '');
    } catch {
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProfile();
      if (isOwner) {
        fetchMyPhotos();
        const editMode = searchParams.get('edit') === 'true';
        setIsEditing(editMode);
      }
    }
  }, [params.id, router, isOwner, searchParams]);

  const handleLike = async () => {
    try {
      await api.post(`/profiles/${params.id}/like`, {});
      toast.success('Você curtiu este perfil!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/plans');
      }
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Motivo da denúncia (fake_profile, harassment, spam, underage, nudity, other):');
    if (!reason) return;
    try {
      await api.post(`/profiles/${params.id}/report`, { reason });
      toast.success('Denúncia enviada. Obrigado por manter a comunidade segura.');
    } catch {
      toast.error('Erro ao enviar denúncia.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        displayName,
        bio,
        city,
        state,
        profession,
        availability,
        partnershipType,
        meetingFrequency,
        relationshipType,
        incomeRange: (relationshipType === 'daddy' || relationshipType === 'mommy') ? incomeRange : undefined,
        seekingDescription,
        country,
        bodyType,
        skinTone,
        hairColor,
        eyeColor,
        heightRange,
        smoking,
        drinking,
        maritalStatus,
        children,
        education,
        netWorth,
        seekingGender,
        travelPreference,
      };

      await api.put(`/profiles/${params.id}`, payload);
      toast.success('Perfil atualizado com sucesso!');
      await fetchProfile(); // Refresh details
      setIsEditing(false);
      router.push(`/profiles/${params.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao salvar alterações.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 shadow-sm px-6 py-4 flex items-center justify-between border-b border-gray-150">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {profile.displayName}
            {profile.isPremium && (
              <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase shadow-sm">
                Elite
              </span>
            )}
          </h1>
        </div>

      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {isEditing ? (
          <Card className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Minhas Informações</h2>

            {/* Gerenciamento de Fotos */}
            <div className="border-b border-gray-150 pb-6 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-3">Minhas Fotos</h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                {myPhotos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-55 shadow-sm">
                    <img src={photo.url} alt="Foto de perfil" className="w-full h-full object-cover" />
                    
                    {photo.isPrimary ? (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                        Principal
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetPrimaryPhoto(photo.id)}
                        className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-black transition opacity-0 group-hover:opacity-100"
                      >
                        Tornar Principal
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute bottom-2 right-2 p-1.5 bg-red-650 hover:bg-red-750 text-white rounded-full transition shadow opacity-0 group-hover:opacity-100"
                      title="Excluir foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {myPhotos.length < 10 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-pink-500 hover:bg-pink-50/10 transition-colors">
                    <div className="text-center p-4">
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto" />
                      ) : (
                        <>
                          <span className="text-2xl text-gray-400 block mb-1 font-light">+</span>
                          <span className="text-[10px] font-semibold text-gray-400 block">Enviar Foto</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} disabled={uploadingPhoto} />
                  </label>
                )}
              </div>
              
              <p className="text-xs text-gray-450 dark:text-gray-200 leading-relaxed">
                Você pode enviar até 10 fotos. A foto marcada como <strong>Principal</strong> será exibida no cabeçalho e na busca de perfis.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Secção 1: Informações básicas */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <Input
                    label="Nome de Exibição"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="País *"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                    <Input
                      label="Estado *"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="Ex: SP"
                      required
                    />
                    <Input
                      label="Cidade *"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Está em busca de quê? *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={seekingGender}
                      onChange={(e) => setSeekingGender(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {SEEKING_GENDER.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Tipo de Perfil (Relacionamento) *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      required
                    >
                      {PROFILE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Acordo Esperado *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={partnershipType}
                        onChange={(e) => setPartnershipType(e.target.value)}
                        required
                      >
                        {PARTNERSHIP_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Frequência de Encontros *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={meetingFrequency}
                        onChange={(e) => setMeetingFrequency(e.target.value)}
                        required
                      >
                        {MEETING_FREQUENCIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secção 2: Como você é */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Como Você É</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Tipo de corpo *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={bodyType}
                      onChange={(e) => setBodyType(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {BODY_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Tom de Pele *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={skinTone}
                      onChange={(e) => setSkinTone(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {ETHNICITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Cabelo *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {HAIR_COLORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Cor dos olhos *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {EYE_COLORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Altura *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={heightRange}
                      onChange={(e) => setHeightRange(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {HEIGHT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Secção 3: Detalhes sobre você */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Detalhes Sobre Você</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Você fuma? *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={smoking}
                        onChange={(e) => setSmoking(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {SMOKING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Você bebe? *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={drinking}
                        onChange={(e) => setDrinking(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {DRINKING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Estado civil *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="single">Solteiro(a)</option>
                        <option value="married">Casado(a)</option>
                        <option value="divorced">Divorciado(a)</option>
                        <option value="widowed">Viúvo(a)</option>
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Filhos *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={children}
                        onChange={(e) => setChildren(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {CHILDREN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Formação acadêmica *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <Input
                      label="Profissão"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Engenheiro, Advogada"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Renda mensal *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={incomeRange}
                        onChange={(e) => setIncomeRange(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {INCOME_RANGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                        Patrimônio pessoal *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                        value={netWorth}
                        onChange={(e) => setNetWorth(e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {NET_WORTH_RANGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secção 4: Fale sobre você */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Fale Sobre Você</h3>
                
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                    Biografia / Sobre mim
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 min-h-[100px] text-slate-900 dark:text-white"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={1000}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                      Disponibilidade para viajar
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 text-slate-900 dark:text-white"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {TRAVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1">
                    Descreva o que você está buscando *
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-550 min-h-[100px] text-slate-900 dark:text-white"
                    value={seekingDescription}
                    onChange={(e) => setSeekingDescription(e.target.value)}
                    maxLength={500}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 justify-end">
              <Button variant="primary" onClick={handleSaveProfile} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-1.5" /> Salvar Alterações
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Owner Edit Button */}
            {isOwner && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsEditing(true);
                    router.push(`/profiles/${profile.id}?edit=true`);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4 mr-1.5" />
                  Editar Meu Perfil
                </Button>
              </div>
            )}

            {/* Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center mx-auto shadow-lg bg-gradient-to-tr from-gradient-pink to-gradient-orange">
              {profile.primaryPhotoUrl ? (
                <img src={profile.primaryPhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-bold uppercase">
                  {profile.displayName.charAt(0)}
                </span>
              )}
            </div>

            {/* Ficha de Dados */}
            <Card className="p-6 space-y-4">
              <div className="text-center">
                <Badge variant="elite" className="capitalize px-4 py-1 text-sm">
                  {profile.relationshipType === 'baby' ? 'Sugar Baby' : profile.relationshipType === 'daddy' ? 'Sugar Daddy' : 'Sugar Mommy'}
                </Badge>
                
                {profile.isPremium && (
                  <div className="mt-2.5 flex justify-center">
                    <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md animate-pulse border border-white/20">
                      ★ Membro Elite ★
                    </span>
                  </div>
                )}
                
                {(profile.city || profile.state) && (
                  <p className="text-gray-900 dark:text-white text-sm mt-3 font-semibold">
                    📍 {profile.city} - {profile.state}
                  </p>
                )}
                {profile.profession && (
                  <p className="text-gray-950 dark:text-white text-sm mt-1 font-medium">💼 {profile.profession}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <div>
                  <span className="font-semibold block text-gray-400 dark:text-gray-300">Acordo Esperado</span>
                  <span className="font-bold capitalize text-gray-700 dark:text-white">
                    {profile.partnershipType === 'companionship' ? 'Companheirismo' : profile.partnershipType === 'financial' ? 'Suporte Financeiro' : profile.partnershipType === 'mentorship' ? 'Mentoria' : profile.partnershipType === 'travel' ? 'Viagens' : 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block text-gray-400 dark:text-gray-300">Encontros</span>
                  <span className="font-bold capitalize text-gray-700 dark:text-white">
                    {profile.meetingFrequency === 'flexible' ? 'Flexível' : profile.meetingFrequency === 'weekly' ? 'Semanal' : profile.meetingFrequency === 'bi_weekly' ? 'Quinzenal' : profile.meetingFrequency === 'monthly' ? 'Mensal' : 'Não definido'}
                  </span>
                </div>
              </div>

              {profile.bio && (
                <div className="border-t border-gray-150 dark:border-gray-800 pt-4">
                  <span className="text-xs font-semibold text-gray-450 dark:text-gray-300 block mb-1">Biografia</span>
                  <p className="text-gray-755 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {profile.seekingDescription && (
                <div className="border-t border-gray-150 dark:border-gray-800 pt-4">
                  <span className="text-xs font-semibold text-gray-450 dark:text-gray-300 block mb-1">O que busca</span>
                  <p className="text-gray-755 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{profile.seekingDescription}</p>
                </div>
              )}
            </Card>

            {/* Informações Físicas & Detalhes Adicionais */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Informações Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {profile.country && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">País</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.country}</span>
                  </div>
                )}
                {profile.bodyType && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Tipo de corpo</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.bodyType}</span>
                  </div>
                )}
                {profile.skinTone && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Tom de Pele</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.skinTone}</span>
                  </div>
                )}
                {profile.hairColor && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Cabelo</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.hairColor}</span>
                  </div>
                )}
                {profile.eyeColor && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Cor dos olhos</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.eyeColor}</span>
                  </div>
                )}
                {profile.heightRange && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Altura</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.heightRange}</span>
                  </div>
                )}
                {profile.smoking && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Fuma?</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.smoking === 'yes' ? 'Sim' : profile.smoking === 'no' ? 'Não' : 'Ocasionalmente'}</span>
                  </div>
                )}
                {profile.drinking && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Bebe?</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.drinking === 'yes' ? 'Sim' : profile.drinking === 'no' ? 'Não' : 'Ocasionalmente'}</span>
                  </div>
                )}
                {profile.maritalStatus && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Estado civil</span>
                    <span className="font-bold text-gray-800 dark:text-white">
                      {profile.maritalStatus === 'single' ? 'Solteiro(a)' : profile.maritalStatus === 'married' ? 'Casado(a)' : profile.maritalStatus === 'divorced' ? 'Divorciado(a)' : 'Viúvo(a)'}
                    </span>
                  </div>
                )}
                {profile.children && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Filhos</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.children}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Formação acadêmica</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.education}</span>
                  </div>
                )}
                {profile.netWorth && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Patrimônio pessoal</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.netWorth}</span>
                  </div>
                )}
                {profile.seekingGender && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Em busca de</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.seekingGender}</span>
                  </div>
                )}
                {profile.availability && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Disponibilidade para viajar</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.availability}</span>
                  </div>
                )}
                {profile.incomeRange && (
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 dark:border-gray-800 gap-1 sm:gap-4">
                    <span className="font-semibold text-gray-400 dark:text-gray-300">Renda Mensal / Orçamento</span>
                    <span className="font-bold text-gray-800 dark:text-white">{profile.incomeRange}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Galeria de Fotos */}
            {profile.photos && profile.photos.length > 0 && (
              <Card className="p-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Galeria de Fotos</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {profile.photos.map((photo: any) => (
                    <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-150 bg-gray-50 dark:bg-gray-800 shadow-sm group">
                      <img src={photo.url} alt="Foto do perfil" className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                      {photo.isPrimary && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Ações para visitantes */}
            {!isOwner && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleLike}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white py-3.5 rounded-xl font-semibold shadow hover:opacity-90 transition"
                  >
                    <Heart className="w-5 h-5" />
                    Curtir
                  </button>

                  <button
                    onClick={() => router.push(`/chat/${profile.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-pink-200 text-pink-600 py-3.5 rounded-xl font-semibold hover:bg-pink-50 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Mensagem
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/profiles/${profile.id}/block`)}
                    className="flex-1 flex items-center justify-center gap-2 text-gray-500 py-2 rounded-xl border hover:bg-gray-50 transition text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Bloquear
                  </button>
                  <button
                    onClick={handleReport}
                    className="flex-1 flex items-center justify-center gap-2 text-red-400 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition text-sm"
                  >
                    <Flag className="w-4 h-4" />
                    Denunciar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
