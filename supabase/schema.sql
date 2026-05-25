-- ============================================
-- arabaşikayet — Supabase SQL Şeması
-- Çalıştırma: Supabase Dashboard > SQL Editor
-- ============================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy search için

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 200),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== VEHICLES ====================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2030),
  engine TEXT NOT NULL,
  trim TEXT,
  transmission TEXT NOT NULL CHECK (transmission IN ('manual','automatic','cvt','dct')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('gasoline','diesel','hybrid','electric','lpg')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand, model, year, engine, trim, transmission, fuel_type)
);

-- ==================== USER_VEHICLES ====================
CREATE TABLE IF NOT EXISTS public.user_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  vin_last6 TEXT CHECK (LENGTH(vin_last6) = 6),
  purchase_year INTEGER,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- ==================== COMPLAINTS ====================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  category TEXT NOT NULL CHECK (category IN (
    'engine','transmission','brakes','suspension','electrical',
    'ac_heating','fuel_system','exhaust','body_paint','interior',
    'safety_systems','steering','tires_wheels','other'
  )),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  km_at_complaint INTEGER NOT NULL CHECK (km_at_complaint >= 0),
  description TEXT CHECK (LENGTH(description) >= 50 OR description IS NULL),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_chronic BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting: same vehicle+category within 30 days
CREATE UNIQUE INDEX IF NOT EXISTS complaints_30day_limit
  ON public.complaints (user_id, vehicle_id, category,
    (DATE_TRUNC('month', created_at)));

-- ==================== AI_ANALYSES ====================
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  verdict TEXT NOT NULL CHECK (verdict IN ('chronic','common','isolated','user_error')),
  summary TEXT NOT NULL,
  similar_complaint_ids UUID[] NOT NULL DEFAULT '{}',
  insights TEXT NOT NULL,
  confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== VEHICLE_LOGS ====================
CREATE TABLE IF NOT EXISTS public.vehicle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  type TEXT NOT NULL CHECK (type IN ('km_record','service','repair','purchase','sale','note')),
  km INTEGER CHECK (km >= 0),
  note TEXT,
  cost NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== VERIFICATIONS ====================
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('phone','vin','registration','service_invoice')),
  data_hash TEXT NOT NULL,
  trust_points INTEGER NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  complaint_id UUID REFERENCES public.complaints(id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type, data_hash)
);

-- ==================== BADGES ====================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'first_complaint','verified_owner','trusted_reporter',
    'community_helper','veteran_driver'
  )),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ==================== VIEW: Kronik Sorunlar ====================
CREATE OR REPLACE VIEW public.chronic_issues_view AS
SELECT
  c.vehicle_id,
  v.brand,
  v.model,
  v.year,
  v.engine,
  c.category,
  COUNT(*)::INTEGER AS complaint_count,
  ROUND(COUNT(*) * 100.0 / NULLIF(
    (SELECT COUNT(DISTINCT uv.user_id)
     FROM public.user_vehicles uv WHERE uv.vehicle_id = c.vehicle_id), 0
  ), 1) AS chronic_rate,
  ROUND(AVG(c.km_at_complaint)) AS avg_km,
  PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY c.km_at_complaint) AS km_p10,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY c.km_at_complaint) AS km_p90
FROM public.complaints c
JOIN public.vehicles v ON v.id = c.vehicle_id
WHERE c.is_chronic = true
GROUP BY c.vehicle_id, v.brand, v.model, v.year, v.engine, c.category
HAVING COUNT(*) >= 10;

-- ==================== FUNCTIONS ====================

-- Trust score güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET trust_score = (
    SELECT COALESCE(SUM(trust_points), 0)
    FROM public.verifications
    WHERE user_id = NEW.user_id
  ),
  updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_trust_score
  AFTER INSERT ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION update_trust_score();

-- Kronik şikayet kontrolü (10+ şikayet eşiği)
CREATE OR REPLACE FUNCTION check_chronic_status()
RETURNS TRIGGER AS $$
DECLARE
  complaint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO complaint_count
  FROM public.complaints
  WHERE vehicle_id = NEW.vehicle_id AND category = NEW.category;
  
  IF complaint_count >= 10 THEN
    UPDATE public.complaints
    SET is_chronic = true
    WHERE vehicle_id = NEW.vehicle_id AND category = NEW.category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_check_chronic
  AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION check_chronic_status();

-- Yeni kullanıcı oluşturma
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Users: herkes okuyabilir, sadece kendisi yazabilir
CREATE POLICY "Users are publicly readable" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Vehicles: herkes okuyabilir
CREATE POLICY "Vehicles are publicly readable" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- User vehicles: sahip yönetir
CREATE POLICY "User vehicles readable by owner" ON public.user_vehicles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "User vehicles insertable by owner" ON public.user_vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User vehicles updatable by owner" ON public.user_vehicles FOR UPDATE
  USING (auth.uid() = user_id);

-- Complaints: herkes okuyabilir, sahip yazar
CREATE POLICY "Complaints are publicly readable" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert complaints" ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI analyses: herkes okuyabilir
CREATE POLICY "AI analyses are publicly readable" ON public.ai_analyses FOR SELECT USING (true);

-- Vehicle logs: sahip yönetir
CREATE POLICY "Vehicle logs readable by owner" ON public.vehicle_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Vehicle logs insertable by owner" ON public.vehicle_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verifications & Badges: sahip okur
CREATE POLICY "Verifications readable by owner" ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Badges readable by owner" ON public.badges FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Badges publicly readable" ON public.badges FOR SELECT USING (true);

-- ==================== ARAÇ KATEGORİ VERİSİ (İlk 50 Model) ====================
-- Aşağıdaki araç verileri Claude API ile oluşturulmuştur.

INSERT INTO public.vehicles (brand, model, year, engine, trim, transmission, fuel_type) VALUES
-- Toyota
('Toyota','Corolla',2020,'1.6 Valvematic','Dream',              'automatic','gasoline'),
('Toyota','Corolla',2021,'1.8 Hybrid','Design Hybrid',         'cvt','hybrid'),
('Toyota','Corolla',2022,'2.0 Hybrid','GR Sport',              'cvt','hybrid'),
('Toyota','Corolla',2019,'1.6 Valvematic','Flame',              'manual','gasoline'),
('Toyota','Yaris',2021,'1.5 Hybrid','Dream',                   'cvt','hybrid'),
('Toyota','Yaris',2022,'1.0 VVT-i','Flame',                    'manual','gasoline'),
('Toyota','RAV4',2021,'2.5 Hybrid','Dream Hybrid AWD',         'cvt','hybrid'),
('Toyota','C-HR',2020,'1.8 Hybrid','Design',                   'cvt','hybrid'),
-- Volkswagen
('Volkswagen','Golf',2020,'1.5 TSI','Comfortline',             'automatic','gasoline'),
('Volkswagen','Golf',2021,'2.0 TDI','Highline',                'automatic','diesel'),
('Volkswagen','Passat',2021,'1.5 TSI','Elegance',              'automatic','gasoline'),
('Volkswagen','Passat',2020,'2.0 TDI','Business',              'automatic','diesel'),
('Volkswagen','Tiguan',2021,'1.5 TSI','Comfortline',           'automatic','gasoline'),
('Volkswagen','Polo',2022,'1.0 TSI','Life',                    'automatic','gasoline'),
('Volkswagen','T-Roc',2022,'1.5 TSI','Style',                  'automatic','gasoline'),
-- Renault
('Renault','Clio',2021,'1.0 TCe','Joy',                        'manual','gasoline'),
('Renault','Clio',2022,'1.3 TCe','RS Line',                    'automatic','gasoline'),
('Renault','Megane',2021,'1.5 dCi','Touch',                    'manual','diesel'),
('Renault','Megane',2020,'1.3 TCe','Joy',                      'automatic','gasoline'),
('Renault','Captur',2022,'1.0 TCe','Joy',                      'manual','gasoline'),
('Renault','Kadjar',2020,'1.5 dCi','Touch',                    'manual','diesel'),
-- Hyundai
('Hyundai','i20',2021,'1.0 T-GDI','Elite',                    'automatic','gasoline'),
('Hyundai','Elantra',2022,'1.6 MPI','Style',                   'automatic','gasoline'),
('Hyundai','Tucson',2022,'1.6 T-GDI Hybrid','Elite Hybrid',   'automatic','hybrid'),
('Hyundai','Tucson',2021,'2.0 MPI','Style',                    'automatic','gasoline'),
('Hyundai','i10',2022,'1.0 MPI','Jump',                        'manual','gasoline'),
-- Kia
('Kia','Sportage',2022,'1.6 T-GDI Hybrid','Prestige Hybrid',  'automatic','hybrid'),
('Kia','Ceed',2021,'1.5 T-GDI','Comfort',                     'automatic','gasoline'),
('Kia','Stonic',2022,'1.0 T-GDI','Style',                     'automatic','gasoline'),
-- Ford
('Ford','Focus',2021,'1.5 EcoBlue','Titanium',                 'automatic','diesel'),
('Ford','Focus',2020,'1.5 EcoBoost','Trend X',                 'manual','gasoline'),
('Ford','Puma',2022,'1.0 EcoBoost Hybrid','Titanium',          'manual','hybrid'),
('Ford','Fiesta',2021,'1.1 Ti-VCT','Trend',                    'manual','gasoline'),
('Ford','Kuga',2021,'2.5 Plug-In Hybrid','Titanium',           'automatic','hybrid'),
-- BMW
('BMW','3 Serisi',2021,'320i','M Sport',                       'automatic','gasoline'),
('BMW','3 Serisi',2020,'320d','Sport Line',                    'automatic','diesel'),
('BMW','1 Serisi',2022,'118i','M Sport',                       'automatic','gasoline'),
('BMW','X3',2021,'xDrive20d','xLine',                          'automatic','diesel'),
('BMW','X1',2022,'sDrive18i','Sport Line',                     'automatic','gasoline'),
-- Mercedes
('Mercedes','C Serisi',2022,'C 200','AMG Line',                'automatic','gasoline'),
('Mercedes','C Serisi',2021,'C 220 d','Avantgarde',            'automatic','diesel'),
('Mercedes','A Serisi',2022,'A 180','Progressive',             'automatic','gasoline'),
('Mercedes','GLC',2021,'300 4Matic','AMG Line',                'automatic','gasoline'),
-- Audi
('Audi','A3',2022,'30 TFSI','Sport',                           'automatic','gasoline'),
('Audi','A4',2021,'35 TDI','Advanced',                         'automatic','diesel'),
('Audi','Q3',2022,'35 TFSI','Advanced',                        'automatic','gasoline'),
-- Honda
('Honda','Civic',2022,'1.5 VTEC Turbo','RS',                  'manual','gasoline'),
('Honda','HR-V',2022,'1.5 i-MMD Hybrid','Advance',             'automatic','hybrid'),
-- Fiat
('Fiat','Egea',2022,'1.4 Fire','Urban',                        'manual','gasoline'),
('Fiat','Egea',2021,'1.6 Multijet','Lounge',                   'manual','diesel')
ON CONFLICT DO NOTHING;
