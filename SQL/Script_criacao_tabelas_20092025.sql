/*
# Alteração do Schema do Sistema
Script de atualização das tabelas já existentes:
- Adiciona constraints
- Ajusta índices
- Configura RLS
- Cria triggers, funções e políticas
*/

-- ===================================
-- 1. AJUSTES NAS TABELAS EXISTENTES
-- ===================================

-- user_subscriptions: garantir referência correta e status
ALTER TABLE public.user_subscriptions
    ALTER COLUMN status SET DEFAULT 'active',
    ADD CONSTRAINT IF NOT EXISTS chk_user_subscriptions_status 
        CHECK (status IN ('active', 'inactive', 'expired'));

-- payments: reforço de status
ALTER TABLE public.payments
    ADD CONSTRAINT IF NOT EXISTS chk_payments_status 
        CHECK (payment_status IN ('pending','completed','failed','refunded'));

-- verifications: status
ALTER TABLE public.verifications
    ADD CONSTRAINT IF NOT EXISTS chk_verifications_status 
        CHECK (status IN ('pending','approved','rejected'));

-- messages: adicionar receiver_id caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='receiver_id'
    ) THEN
        ALTER TABLE public.messages
        ADD COLUMN receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END$$;

-- messages: impedir auto-mensagem
ALTER TABLE public.messages
    ADD CONSTRAINT IF NOT EXISTS no_self_message CHECK (sender_id <> receiver_id);

-- likes: garantir unicidade
ALTER TABLE public.likes
    ADD CONSTRAINT IF NOT EXISTS uq_user_profile UNIQUE(user_id, profile_id);

-- ===================================
-- 2. ÍNDICES
-- ===================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified);

-- user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

-- verifications
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);

-- Visualização única por dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_view 
ON public.profile_views(viewer_id, profile_id, (DATE(created_at)));

-- likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile_id ON public.likes(profile_id);

-- ===================================
-- 3. HABILITAÇÃO RLS
-- ===================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 4. POLÍTICAS RLS
-- ===================================

-- profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver perfis ativos') THEN
        CREATE POLICY "Usuários podem ver perfis ativos" ON public.profiles
            FOR SELECT USING (is_active = true);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem atualizar seu próprio perfil') THEN
        CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir seu próprio perfil') THEN
        CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END$$;

-- user_subscriptions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver suas assinaturas') THEN
        CREATE POLICY "Usuários podem ver suas assinaturas" ON public.user_subscriptions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir suas assinaturas') THEN
        CREATE POLICY "Usuários podem inserir suas assinaturas" ON public.user_subscriptions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END$$;

-- payments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver seus pagamentos') THEN
        CREATE POLICY "Usuários podem ver seus pagamentos" ON public.payments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir seus pagamentos') THEN
        CREATE POLICY "Usuários podem inserir seus pagamentos" ON public.payments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END$$;

-- verifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver suas verificações') THEN
        CREATE POLICY "Usuários podem ver suas verificações" ON public.verifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir suas verificações') THEN
        CREATE POLICY "Usuários podem inserir suas verificações" ON public.verifications
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END$$;

-- messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver mensagens enviadas ou recebidas') THEN
        CREATE POLICY "Usuários podem ver mensagens enviadas ou recebidas" ON public.messages
            FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem enviar mensagens') THEN
        CREATE POLICY "Usuários podem enviar mensagens" ON public.messages
            FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem atualizar mensagens recebidas') THEN
        CREATE POLICY "Usuários podem atualizar mensagens recebidas" ON public.messages
            FOR UPDATE USING (auth.uid() = receiver_id);
    END IF;
END$$;

-- profile_views
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver suas visualizações') THEN
        CREATE POLICY "Usuários podem ver suas visualizações" ON public.profile_views
            FOR SELECT USING (auth.uid() = viewer_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem registrar visualizações') THEN
        CREATE POLICY "Usuários podem registrar visualizações" ON public.profile_views
            FOR INSERT WITH CHECK (auth.uid() = viewer_id);
    END IF;
END$$;

-- likes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver seus likes') THEN
        CREATE POLICY "Usuários podem ver seus likes" ON public.likes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir likes') THEN
        CREATE POLICY "Usuários podem inserir likes" ON public.likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem remover seus likes') THEN
        CREATE POLICY "Usuários podem remover seus likes" ON public.likes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END$$;

-- ===================================
-- 5. TRIGGERS E FUNÇÕES
-- ===================================

-- Atualizar updated_at em profiles
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

-- Criar perfil automático ao registrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, profile_type, name, age, city, state)
    VALUES (
        NEW.id,
        'client',
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
        COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Não informado'),
        COALESCE(NEW.raw_user_meta_data->>'state', 'Não informado')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- ===================================
-- 6. FUNÇÕES AUXILIARES
-- ===================================

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE user_id = user_uuid 
          AND status = 'active' 
          AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_profile_views_count(profile_uuid UUID)
RETURNS INTEGER AS $$ 
BEGIN
    RETURN (
        SELECT COUNT(*) FROM public.profile_views 
        WHERE profile_id = profile_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_profile_likes_count(profile_uuid UUID)
RETURNS INTEGER AS $$ 
BEGIN
    RETURN (
        SELECT COUNT(*) FROM public.likes 
        WHERE profile_id = profile_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
