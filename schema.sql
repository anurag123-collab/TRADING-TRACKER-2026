-- ==============================================================================
-- TRADING TRACKER TECHNOLOGIES — ENTERPRISE DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Designed for High Scalability (Up to 2 Crore / 20 Million Users)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: USERS (Account & Authentication)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    name VARCHAR(150) NOT NULL DEFAULT 'Trader',
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    role VARCHAR(30) DEFAULT 'trader', -- 'trader', 'mentor', 'master_admin'
    is_vip BOOLEAN DEFAULT false,
    vip_pro_until TIMESTAMPTZ,
    initial_capital NUMERIC(15, 2) DEFAULT 1000000.00, -- ₹10,00,000 default virtual funds
    broker_accounts JSONB DEFAULT '[]'::jsonb, -- encrypted linked broker configs
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for millions of logins by email, mobile, or google_id
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- ==============================================================================
-- TABLE 2: PAPER_TRADES (Orders, Executions & Virtual Portfolios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.paper_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL, -- e.g., 'NIFTY', 'BANKNIFTY', 'BTCUSDT'
    strike NUMERIC(10, 2), -- e.g., 24000.00
    ce_pe VARCHAR(10), -- 'CE', 'PE', or 'EQ'
    order_type VARCHAR(20) DEFAULT 'MARKET', -- 'MARKET', 'LIMIT', 'STOP_LOSS'
    side VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    qty INT NOT NULL,
    lot_size INT NOT NULL DEFAULT 1,
    entry_price NUMERIC(12, 2) NOT NULL,
    exit_price NUMERIC(12, 2),
    pnl NUMERIC(14, 2) DEFAULT 0.00,
    charges NUMERIC(10, 2) DEFAULT 40.00, -- Brokerage + Taxes simulation
    net_pnl NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'CANCELLED'
    notes TEXT,
    entry_time TIMESTAMPTZ DEFAULT now(),
    exit_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning fast queries across 2 Crore users
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON public.paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON public.paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_entry_time ON public.paper_trades(entry_time DESC);

-- ==============================================================================
-- TABLE 3: JOURNAL_ENTRIES (Analytical Journaling & AI Psychology Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    setup VARCHAR(100), -- 'Breakout', 'Scalping', 'Mean Reversion', etc.
    psychology_tags TEXT[] DEFAULT '{}', -- e.g. {'FOMO', 'Revenge Trading', 'Disciplined', 'Greed'}
    rules_followed BOOLEAN DEFAULT true,
    mistakes TEXT[] DEFAULT '{}', -- e.g. {'Chased Market', 'Late Exit', 'Overleveraged'}
    notes TEXT,
    lessons_learned TEXT,
    chart_screenshot_url TEXT,
    daily_gross_pnl NUMERIC(14, 2) DEFAULT 0.00,
    daily_charges NUMERIC(10, 2) DEFAULT 0.00,
    daily_net_pnl NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries(user_id, trade_date DESC);

-- ==============================================================================
-- TABLE 4: GLOBAL_LEADERBOARD (All-India Live Trader Rankings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.global_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    win_rate NUMERIC(5, 2) DEFAULT 0.00, -- e.g., 68.50%
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    total_net_pnl NUMERIC(15, 2) DEFAULT 0.00,
    profit_factor NUMERIC(6, 2) DEFAULT 1.00,
    consistency_score INT DEFAULT 50, -- 1 to 100
    all_india_rank INT DEFAULT 99999,
    is_verified BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.global_leaderboard(all_india_rank ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON public.global_leaderboard(total_net_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_win_rate ON public.global_leaderboard(win_rate DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Bank-Grade Data Privacy)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own user record
CREATE POLICY users_self_access ON public.users
    FOR ALL
    USING (auth.uid() = id);

-- Users can only see and modify their own paper trades
CREATE POLICY paper_trades_self_access ON public.paper_trades
    FOR ALL
    USING (auth.uid() = user_id);

-- Users can only see and modify their own journal entries
CREATE POLICY journal_entries_self_access ON public.journal_entries
    FOR ALL
    USING (auth.uid() = user_id);

-- Leaderboard is public to read (for all users), but only own record can be updated
CREATE POLICY leaderboard_public_read ON public.global_leaderboard
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY leaderboard_self_update ON public.global_leaderboard
    FOR ALL
    USING (auth.uid() = user_id);
