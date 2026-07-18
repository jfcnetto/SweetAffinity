// ─── ENUMS E TIPOS DE SUPORTE ─────────────────────────────────────
export type ProfileType = 'Baby' | 'Daddy' | 'Mommy';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'pix';

// ─── INTERFACE DE USUÁRIO (SESSÃO) ──────────────────────────────
export interface User {
  id: string;
  email: string;
  phone?: string;
  profile_type: ProfileType;
  status: account_status;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  last_login?: string;
}

// ─── INTERFACE DO PERFIL (UX & CARDS VISUAIS) ─────────────────────
export interface Profile {
  id: string; // ID mapeado 1:1 com o User ID
  display_name: string;
  birth_date: string;
  gender?: string;
  state?: string;
  city: string;
  bio?: string;
  height_range?: string;
  ethnicity?: string;
  hair_color?: string;
  eye_color?: string;
  smoking?: string;
  drinking?: string;
  education?: string;
  profession?: string;
  marital_status?: string;
  income_range?: string;
  seeking_description?: string;
  popularity_score: number;
  profile_views: number;
  is_active: boolean;
  updated_at: string;
  
  // Relações acopladas que seu frontend usa nos cards
  primary_photo_url?: string;
  photos?: Photo[];
}

// ─── INTERFACE DE FOTOS ───────────────────────────────────────────
export interface Photo {
  id: string;
  user_id: string;
  storage_path: string;
  is_primary: boolean;
  is_approved: boolean;
  is_private: boolean;
  sort_order: number;
  created_at: string;
}

// ─── INTERFACE DE MENSAGENS (CHAT EM TEMPO REAL) ──────────────────
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at?: string;
  created_at: string;
}

// ─── INTERFACES DE ASSINATURAS E FINANCEIRO ───────────────────────
export interface Plan {
  id: string;
  name: string;
  price: number;
  limit_messages_day: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id?: string;
  status: SubscriptionStatus;
  provider: string;
  current_period_start?: string;
  current_period_end?: string;
  expires_at?: string;
  cancel_at_period_end: boolean;
}

// ─── INTERFACE DE COMPONENTES ─────────────────────────────────────
export interface FaqItem {
  question: string;
  answer: string;
}