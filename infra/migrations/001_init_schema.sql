-- ===================================================
-- 1. CRIAÇÃO DE ENUMS E EXTENSÕES NATIVAS
-- ===================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE profile_type_enum AS ENUM ('Baby', 'Daddy', 'Mommy');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('pending', 'active', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE auth_provider_enum AS ENUM ('email', 'google', 'apple');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'past_due');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('credit_card', 'pix');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===================================================
-- 2. CRIAÇÃO DAS TABELAS E CONSTRAINTS NATIVAS
-- ===================================================

-- Tabela de Usuários (Substitui auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_type profile_type_enum NOT NULL,
    status account_status_enum NOT NULL DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    auth_provider auth_provider_enum NOT NULL DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(30),
    state CHAR(2),
    city VARCHAR(100) DEFAULT 'Não informado',
    bio TEXT,
    height_range VARCHAR(20),
    ethnicity VARCHAR(50),
    hair_color VARCHAR(30),
    eye_color VARCHAR(30),
    smoking VARCHAR(30),
    drinking VARCHAR(30),
    education VARCHAR(50),
    profession VARCHAR(100),
    marital_status VARCHAR(30),
    income_range VARCHAR(50),
    seeking_description TEXT,
    popularity_score INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Fotos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    limit_messages_day INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Assinaturas (user_subscriptions)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    status subscription_status_enum NOT NULL DEFAULT 'active',
    provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_user_subscriptions_status CHECK (status IN ('active', 'cancelled', 'expired', 'past_due'))
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'BRL',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method payment_method_enum NOT NULL,
    provider_payment_id VARCHAR(255),
    pix_qr_code TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

-- Tabela de Likes / Matches
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_profile UNIQUE(user_id, profile_id)
);

-- Tabela de Visualizações de Perfil
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- 3. ÍNDICES DE PERFORMANCE (MANTIDOS E ADAPTADOS)
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_view 
ON public.profile_views(viewer_id, profile_id, (DATE(created_at)));

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile_id ON public.likes(profile_id);

-- ===================================================
-- 4. TRIGGERS E FUNÇÕES AUXILIARES DE INTEGRIDADE
-- ===================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Impedir auto-like via trigger
CREATE OR REPLACE FUNCTION public.prevent_self_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.profile_id
      AND p.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não pode curtir o próprio perfil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS no_self_like_trigger ON public.likes;
CREATE TRIGGER no_self_like_trigger
    BEFORE INSERT OR UPDATE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.prevent_self_like();