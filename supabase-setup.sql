-- ============================================================
-- SQL-СКРИПТ ДЛЯ БЕСПЛАТНОГО SUPABASE
-- Скопируйте весь текст ниже и вставьте в:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Таблица для моментов и фото
CREATE TABLE IF NOT EXISTS public.moments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT DEFAULT 'Уютные дни',
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    description TEXT,
    "imageUrl" TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    "isLiked" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS и разрешаем доступ
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to moments" 
ON public.moments FOR SELECT USING (true);

CREATE POLICY "Allow public insert to moments" 
ON public.moments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to moments" 
ON public.moments FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to moments" 
ON public.moments FOR DELETE USING (true);


-- 2. Бакет хранилища для фотографий
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Разрешаем чтение и загрузку фото в бакет photos
CREATE POLICY "Public Access to photos bucket" 
ON storage.objects FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Public Upload to photos bucket" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public Update to photos bucket" 
ON storage.objects FOR UPDATE USING (bucket_id = 'photos');

CREATE POLICY "Public Delete to photos bucket" 
ON storage.objects FOR DELETE USING (bucket_id = 'photos');
