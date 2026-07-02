'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Heart, Shield, Flag, MessageCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Profile {
  id: string;
  displayName: string;
  bio?: string;
  city?: string;
  state?: string;
  profession?: string;
  relationshipType: string;
  popularityScore: number;
  profileViews: number;
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get(`${API_URL}/profiles/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProfile(data);
      } catch {
        router.replace('/feed');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id, router]);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/profiles/${params.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/profiles/${params.id}/report`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Denúncia enviada. Obrigado por manter a comunidade segura.');
    } catch {
      alert('Erro ao enviar denúncia.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{profile.displayName}</h1>
      </div>

      {/* Conteúdo do perfil */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Avatar placeholder */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center mx-auto text-white text-4xl font-bold shadow-lg">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>

        {/* Infos */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <div className="text-center">
            <p className="text-gray-500 text-sm capitalize">{profile.relationshipType}</p>
            {(profile.city || profile.state) && (
              <p className="text-gray-600 text-sm mt-1">📍 {[profile.city, profile.state].filter(Boolean).join(', ')}</p>
            )}
            {profile.profession && (
              <p className="text-gray-600 text-sm">💼 {profile.profession}</p>
            )}
          </div>

          {profile.bio && (
            <p className="text-gray-700 text-sm leading-relaxed border-t pt-3">{profile.bio}</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={handleLike}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 rounded-xl font-semibold shadow hover:shadow-lg transition"
          >
            <Heart className="w-5 h-5" />
            Curtir
          </button>

          <button
            onClick={() => router.push(`/chat/${profile.id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-pink-300 text-pink-600 py-3 rounded-xl font-semibold hover:bg-pink-50 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Mensagem
          </button>
        </div>

        {/* Ações de segurança */}
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
    </div>
  );
}
