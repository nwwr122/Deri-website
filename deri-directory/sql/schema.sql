-- =========================================================
-- DERÎ — Supabase setup script
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste this whole file → Run)
-- =========================================================

-- Make sure the extension needed for auto-generated IDs is available
create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1. The businesses table
-- ---------------------------------------------------------
create table if not exists businesses (
  id text primary key default gen_random_uuid()::text,
  category text not null,
  neighborhood text,
  phone text,
  whatsapp text,
  instagram text,
  facebook text,
  scans integer default 0,
  name_en text,
  name_ku text,
  name_ar text,
  desc_en text,
  desc_ku text,
  desc_ar text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 2. Row Level Security — this is what actually protects your data
--    Anyone can READ (the public directory needs this).
--    Only a logged-in admin can INSERT / UPDATE / DELETE.
-- ---------------------------------------------------------
alter table businesses enable row level security;

create policy "Public can read businesses"
  on businesses for select
  using (true);

create policy "Only logged-in admin can insert"
  on businesses for insert
  to authenticated
  with check (true);

create policy "Only logged-in admin can update"
  on businesses for update
  to authenticated
  using (true);

create policy "Only logged-in admin can delete"
  on businesses for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------
-- 3. Safe scan counter — lets anyone visiting a leaflet's QR
--    link bump the scan count by exactly 1, without ever
--    needing to log in or being able to edit anything else.
-- ---------------------------------------------------------
create or replace function increment_scan(business_id text)
returns void
language sql
security definer
as $$
  update businesses set scans = scans + 1 where id = business_id;
$$;

grant execute on function increment_scan(text) to anon, authenticated;

-- ---------------------------------------------------------
-- 4. Optional: load the same 8 sample businesses from the
--    prototype, so you have something to look at immediately.
--    Delete these later from the admin panel whenever you like.
-- ---------------------------------------------------------
insert into businesses (category, neighborhood, phone, whatsapp, instagram, facebook, scans, name_en, name_ku, name_ar, desc_en, desc_ku, desc_ar) values
('restaurant', 'Malta', '+9647501112233', '+9647501112233', 'https://instagram.com/example', '', 128, 'Simko Grill House', 'Xwaringeha Simko', 'مطعم سيمكو', 'Family-run grill house known for tandoor bread and lamb kebab.', 'Xwaringehek malbatî ku bi nanê tenûr û kebaba berxan navdar e.', 'مطعم عائلي مشهور بخبز التنور وكباب لحم الخروف.'),
('clinic', 'Nwroz', '+9647501234567', '+9647501234567', '', 'https://facebook.com/example', 64, 'Dr. Aram Dental Clinic', 'Klînîka Diranan a Dr. Aram', 'عيادة الدكتور آرام لطب الأسنان', 'General and cosmetic dentistry, open six days a week.', 'Diranên giştî û cosmetîk, şeş rojan di hefteyê de vekirî ye.', 'طب أسنان عام وتجميلي، مفتوح ستة أيام في الأسبوع.'),
('tutoring', 'Zariya', '+9647509876543', '+9647509876543', 'https://instagram.com/example2', '', 41, 'Bright Path English Center', 'Navenda Îngilîzî ya Rêya Ronî', 'مركز الطريق المشرق للغة الإنجليزية', 'English classes for kids and adults, small group sizes.', 'Kursên îngilîzî ji bo zarok û mezinan, komên biçûk.', 'دورات لغة إنجليزية للأطفال والكبار، بمجموعات صغيرة.'),
('mobile', 'Shahid Khabat', '+9647504445566', '+9647504445566', '', '', 22, 'Star Mobile Repair', 'Star Chapkirina Mobîlan', 'ستار لتصليح الموبايلات', 'Screen and battery replacement while you wait, all brands.', 'Guhertina şaşe û bataryayê di cih de, ji bo hemû marqeyan.', 'استبدال الشاشة والبطارية أثناء الانتظار، لجميع الماركات.'),
('grocery', 'Malta', '+9647507778899', '', '', 'https://facebook.com/example2', 55, 'Zagros Fresh Market', 'Bazara Taze ya Zagros', 'سوق زاغروس الطازج', 'Neighborhood grocery with daily fresh produce and dairy.', 'Dikanek taxê ya bi sebze û berhemên şîr ên rojane.', 'بقالة الحي بمنتجات طازجة ومشتقات ألبان يومية.'),
('salon', 'Nwroz', '+9647502223344', '+9647502223344', 'https://instagram.com/example3', '', 33, 'Rustam Barber Studio', 'Studyoya Berberê Rustem', 'استوديو رستم للحلاقة', 'Classic and modern cuts, beard styling, walk-ins welcome.', 'Birînên klasîk û modern, styling rîh, hatina rasterast tê pêşwazîkirin.', 'قصات كلاسيكية وعصرية، تصفيف اللحية، الاستقبال بدون موعد مسبق.'),
('household_services', 'Zariya', '+9647503334455', '+9647503334455', '', '', 18, 'Karwan Home Repairs', 'Çakkirinên Malê yên Karwan', 'كاروان لإصلاحات المنزل', 'Plumbing, electrical, and appliance repair, same-day callout.', 'Ava, kareba, û çakkirina amûran, hatina heman rojê.', 'سباكة وكهرباء وإصلاح الأجهزة، زيارة في نفس اليوم.'),
('cafe_entertainment', 'Malta', '+9647506667788', '+9647506667788', 'https://instagram.com/example4', '', 47, 'Cafe Zagros Lounge', 'Qehwexaneya Zagros', 'مقهى زاغروس لاونج', 'Coffee, shisha, and board games, open late every night.', 'Qehwe, kaf û lîstikên textê, her şev heta dereng vekirî.', 'قهوة وشيشة وألعاب طاولة، مفتوح حتى وقت متأخر كل ليلة.');
