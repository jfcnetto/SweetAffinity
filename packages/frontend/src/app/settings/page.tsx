'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { toast } from '../../design-system/components/Toast';
import { ArrowLeft, Shield, Bell, Eye, EyeOff, Trash2, Key, Check } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  // Privacy toggles
  const [hideProfile, setHideProfile] = useState(false);
  const [hideDistance, setHideDistance] = useState(false);
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);

  // Email notification toggles
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyViews, setNotifyViews] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleSavePrivacy = () => {
    toast.success('Configurações de privacidade atualizadas!');
  };

  const handleSaveNotifications = () => {
    toast.success('Preferências de notificação atualizadas!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não conferem.');
      return;
    }
    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada com sucesso!');
    }, 1200);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir permanentemente sua conta? Esta ação é irreversível.'
    );
    if (confirmed) {
      toast.error('Sua solicitação de exclusão foi enviada à moderação.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 pt-6">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        </div>

        <div className="space-y-6">
          {/* Section 1: Privacy and Visibility */}
          <Card className="p-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <Eye className="w-5 h-5 text-pink-550" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Privacidade & Visibilidade</h2>
                <p className="text-xs text-gray-500 dark:text-gray-300">Controle como você aparece para outros usuários.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Modo Invisível</h3>
                  <p className="text-xs text-gray-450 dark:text-gray-300">Oculta seu perfil dos resultados de busca e do feed.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideProfile}
                    onChange={(e) => setHideProfile(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-850">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Ocultar Distância</h3>
                  <p className="text-xs text-gray-455 dark:text-gray-300">Não mostra a quilometragem exata para outros membros.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideDistance}
                    onChange={(e) => setHideDistance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-855">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Ocultar Status Online</h3>
                  <p className="text-xs text-gray-455 dark:text-gray-300">Não exibe a bolinha verde quando você estiver ativo.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideOnlineStatus}
                    onChange={(e) => setHideOnlineStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="primary" onClick={handleSavePrivacy} size="sm">
                Salvar Privacidade
              </Button>
            </div>
          </Card>

          {/* Section 2: Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <Bell className="w-5 h-5 text-pink-550" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notificações por E-mail</h2>
                <p className="text-xs text-gray-500 dark:text-gray-300">Escolha quais alertas deseja receber na sua caixa de entrada.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Novas Mensagens</h3>
                  <p className="text-xs text-gray-455 dark:text-gray-300">Receber e-mail ao receber novas mensagens no chat.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyMessages}
                    onChange={(e) => setNotifyMessages(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-850">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Visitas ao Perfil</h3>
                  <p className="text-xs text-gray-455 dark:text-gray-300">Avisar quando outros usuários olharem seu perfil.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyViews}
                    onChange={(e) => setNotifyViews(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-855">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Curtidas Recebidas</h3>
                  <p className="text-xs text-gray-455 dark:text-gray-300">Ser notificado quando alguém curtir seu perfil.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyLikes}
                    onChange={(e) => setNotifyLikes(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-gradient-pink peer-checked:to-gradient-orange"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="primary" onClick={handleSaveNotifications} size="sm">
                Salvar Notificações
              </Button>
            </div>
          </Card>

          {/* Section 3: Password / Security */}
          <Card className="p-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <Key className="w-5 h-5 text-pink-550" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alterar Senha</h2>
                <p className="text-xs text-gray-500 dark:text-gray-300">Mantenha sua conta protegida mudando sua senha regularmente.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="Senha Atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="Nova Senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="primary" size="sm" disabled={updatingPassword}>
                  {updatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Section 4: Danger Zone */}
          <Card className="p-6 border border-red-200/60 bg-red-50/5 dark:bg-red-950/5">
            <div className="flex items-center gap-3 border-b border-red-100 dark:border-red-950 pb-4 mb-6">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white text-red-650">Zona de Perigo</h2>
                <p className="text-xs text-gray-500 dark:text-gray-300">Ações críticas para gerenciar o encerramento da sua conta.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-250">Excluir Minha Conta</h3>
                <p className="text-xs text-gray-450 dark:text-gray-300">Exclui permanentemente todos os seus dados, fotos e conversas.</p>
              </div>
              <Button variant="outline" className="border-red-250 hover:bg-red-50 hover:text-red-700 text-red-600 self-start sm:self-center" onClick={handleDeleteAccount}>
                Excluir Conta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
