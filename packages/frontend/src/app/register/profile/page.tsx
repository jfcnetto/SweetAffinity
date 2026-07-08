'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

interface IBGEState {
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

const professionOptions = [
  'Administrador/Gestor',
  'Advogado/Jurídico',
  'Arquiteto/Designer',
  'Artista/Criativo',
  'Autônomo/Consultor',
  'Cientista/Pesquisador',
  'Comerciante/Vendas',
  'Diretor/Executivo',
  'Educador/Professor',
  'Empresário/Empreendedor',
  'Engenharia/Construção',
  'Estudante',
  'Finanças/Contabilidade',
  'Saúde/Medicina',
  'Hotelaria/Turismo',
  'Vendas/Marketing',
  'Outro',
].sort();

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshUser, isAuthenticated, isLoading } = useAuth();
  
  // Basic Info
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationshipType, setRelationshipType] = useState('baby');
  const [gender, setGender] = useState('female');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Lifestyle
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [drinking, setDrinking] = useState('no');
  const [smoking, setSmoking] = useState('no');

  // Appearance
  const [heightRange, setHeightRange] = useState('1.60m a 1.70m');
  const [ethnicity, setEthnicity] = useState('Branco');
  const [hairColor, setHairColor] = useState('Castanho');
  const [eyeColor, setEyeColor] = useState('Castanho');

  // Career & Finance
  const [education, setEducation] = useState('Superior Completo');
  const [profession, setProfession] = useState('Outro');
  const [incomeRange, setIncomeRange] = useState('Até R$ 50 mil');

  // About & Seeking
  const [bio, setBio] = useState('');
  const [seekingDescription, setSeekingDescription] = useState('');
  
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Carrega os Estados do IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => response.json())
      .then((data: IBGEState[]) => setStates(data))
      .catch(error => console.error("Error fetching states:", error));
  }, []);

  // Carrega as Cidades do IBGE ao mudar o Estado
  useEffect(() => {
    if (selectedState) {
      setIsLoadingCities(true);
      setCities([]);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
        .then(response => response.json())
        .then((data: IBGECity[]) => {
          setCities(data);
          setIsLoadingCities(false);
        })
        .catch(error => {
          console.error("Error fetching cities:", error);
          setIsLoadingCities(false);
        });
    }
  }, [selectedState]);

  // Pré-preenche os dados existentes do perfil (se houver)
  useEffect(() => {
    if (user) {
      setDisplayName(user.email ? user.email.split('@')[0] : '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !birthDate || !selectedState || !selectedCity) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      // Cria/Atualiza todos os dados de perfil (incluindo preferências culturais/estilo de vida)
      await api.post('/profiles', {
        displayName,
        birthDate,
        relationshipType,
        gender,
        state: selectedState,
        city: selectedCity,
        maritalStatus,
        drinking,
        smoking,
        heightRange,
        ethnicity,
        hairColor,
        eyeColor,
        education,
        profession,
        incomeRange,
        bio,
        seekingDescription
      });

      toast.success('Perfil atualizado com sucesso!');
      await refreshUser();
      router.push('/'); // Redireciona para a Home
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao salvar o perfil.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-3xl font-bold font-display text-gray-800">Concluir Cadastro</h2>
          <p className="text-sm text-gray-500 mt-2">Personalize o seu perfil com as suas preferências e estilo de vida para encontrar conexões perfeitas!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SEÇÃO: Dados Básicos */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-gradient-pink pl-2">
              📝 Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none"
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Eu sou:</label>
                <select 
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="baby">Uma Sugar Baby / Sugar Boy</option>
                  <option value="daddy">Um Sugar Daddy</option>
                  <option value="mommy">Uma Sugar Mommy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gênero</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Nascimento</label>
                <input 
                  type="date" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado (UF)</label>
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                  required
                >
                  <option value="">Selecione...</option>
                  {states.map(s => (
                    <option key={s.sigla} value={s.sigla}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                  disabled={!selectedState || isLoadingCities}
                  required
                >
                  <option value="">{isLoadingCities ? 'Carregando...' : 'Selecione...'}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Estilo de Vida */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-gradient-pink pl-2">
              🍷 Estilo de Vida e Preferências
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado Civil</label>
                <select 
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="single">Solteiro(a)</option>
                  <option value="married">Casado(a)</option>
                  <option value="divorced">Divorciado(a)</option>
                  <option value="widowed">Viúvo(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bebida</label>
                <select 
                  value={drinking}
                  onChange={(e) => setDrinking(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="no">Não bebo</option>
                  <option value="occasionally">Ocasionalmente</option>
                  <option value="yes">Bebo regularmente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fumo</label>
                <select 
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="no">Não fumo</option>
                  <option value="occasionally">Ocasionalmente</option>
                  <option value="yes">Fumo regularmente</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Aparência */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-gradient-pink pl-2">
              ✨ Aparência Física
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Altura</label>
                <select 
                  value={heightRange}
                  onChange={(e) => setHeightRange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Até 1.50m">Até 1.50m</option>
                  <option value="1.50m a 1.60m">1.50m a 1.60m</option>
                  <option value="1.60m a 1.70m">1.60m a 1.70m</option>
                  <option value="1.70m a 1.80m">1.70m a 1.80m</option>
                  <option value="Acima de 1.80m">Acima de 1.80m</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Etnia</label>
                <select 
                  value={ethnicity}
                  onChange={(e) => setEthnicity(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Branco">Branco(a)</option>
                  <option value="Negro">Negro(a)</option>
                  <option value="Pardo">Pardo(a)</option>
                  <option value="Asiático">Asiático(a)</option>
                  <option value="Indígena">Indígena</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cor do Cabelo</label>
                <select 
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Castanho">Castanho</option>
                  <option value="Preto">Preto</option>
                  <option value="Loiro">Loiro</option>
                  <option value="Ruivo">Ruivo</option>
                  <option value="Grisalho">Grisalho</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cor dos Olhos</label>
                <select 
                  value={eyeColor}
                  onChange={(e) => setEyeColor(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Castanho">Castanho</option>
                  <option value="Azul">Azul</option>
                  <option value="Verde">Verde</option>
                  <option value="Preto">Preto</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Carreira e Finanças */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-gradient-pink pl-2">
              💼 Carreira e Finanças
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Escolaridade</label>
                <select 
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Superior Incompleto">Superior Incompleto</option>
                  <option value="Superior Completo">Superior Completo</option>
                  <option value="Pós-graduação">Pós-graduação</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Doutorado">Doutorado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Profissão</label>
                <select 
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  {professionOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Renda Anual aproximada</label>
                <select 
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none bg-white text-gray-700"
                >
                  <option value="Até R$ 50 mil">Até R$ 50 mil</option>
                  <option value="R$ 50 mil a R$ 100 mil">R$ 50 mil a R$ 100 mil</option>
                  <option value="R$ 100 mil a R$ 250 mil">R$ 100 mil a R$ 250 mil</option>
                  <option value="R$ 250 mil a R$ 500 mil">R$ 250 mil a R$ 500 mil</option>
                  <option value="Acima de R$ 500 mil">Acima de R$ 500 mil</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Descrição de si e Busca */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-gradient-pink pl-2">
              ✍️ Sobre Mim e Expectativas
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio (Apresente-se)</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none"
                  placeholder="Conte um pouco sobre você, seu estilo de vida, o que gosta de fazer nas horas vagas..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">O que você busca?</label>
                <textarea 
                  value={seekingDescription}
                  onChange={(e) => setSeekingDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gradient-pink focus:outline-none"
                  placeholder="Descreva o que você busca na plataforma e qual o perfil ideal do seu par..."
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full mt-4 bg-gradient-to-r from-gradient-pink to-gradient-orange text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gradient-pink disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando Cadastro...' : 'Concluir meu Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
