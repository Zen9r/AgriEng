# إعداد Storage في Supabase ✅

## المشكلة السابقة
كان `supabaseClient.ts` يستخدم البروكسي لجميع الطلبات، لكن **Storage API لا يعمل من خلال البروكسي**.

## الحل المطبق
تم إنشاء client مباشر للـ Storage:
- `supabase` → رابط مباشر (للـ Auth والـ Storage)
- `proxyClient` → عبر البروكسي (للجداول فقط)

---

## خطوات إعداد Storage Buckets في Supabase

### 1. إنشاء Buckets المطلوبة

اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard) → Storage

أنشئ البكتات التالية:

#### أ) `gallery-images` (صور المعرض)
```
Bucket Name: gallery-images
Public: ✅ Yes
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

#### ب) `event-images` (صور الفعاليات)
```
Bucket Name: event-images
Public: ✅ Yes
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

#### ج) `avatars` (الصور الشخصية)
```
Bucket Name: avatars
Public: ✅ Yes
File size limit: 2MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

#### د) `extra-hours-proofs` (إثباتات الساعات)
```
Bucket Name: extra-hours-proofs
Public: ✅ Yes (أو Private حسب الحاجة)
File size limit: 10MB
Allowed MIME types: image/*, application/pdf
```

---

### 2. إعداد RLS Policies

في كل Bucket، اذهب إلى **Policies** وأنشئ السياسات التالية:

#### سياسة الرفع (Upload/Insert)
```sql
-- اسم السياسة: Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery-images');
```

#### سياسة القراءة (Select)
```sql
-- اسم السياسة: Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gallery-images');
```

#### سياسة الحذف (Delete)
```sql
-- اسم السياسة: Allow users to delete own files
CREATE POLICY "Allow own file deletion"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gallery-images' AND auth.uid()::text = owner);
```

**📝 كرر نفس السياسات لكل bucket** مع تغيير `bucket_id`

---

### 3. سياسات مخصصة لـ Avatars (اختياري)

إذا كنت تريد أن يستطيع المستخدم حذف/تحديث صورته الشخصية فقط:

```sql
-- رفع الصورة في مجلد خاص بالمستخدم
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- حذف الصورة الشخصية القديمة
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. التحقق من الإعدادات

### أ) اختبار الرفع
جرب رفع صورة من واجهة المستخدم:
- اذهب إلى "رفع صورة للمعرض"
- اختر صورة
- إذا نجح الرفع → ✅ تم الإعداد بنجاح

### ب) التحقق من السياسات
في Supabase Dashboard → Storage → [Bucket Name] → Policies:
- يجب أن ترى 3 سياسات على الأقل (Insert, Select, Delete)
- تأكد أنها **Enabled** ✅

### ج) التحقق من الروابط العامة
بعد رفع صورة، انسخ الرابط وافتحه في متصفح جديد:
- إذا ظهرت الصورة → ✅ البكت عام بشكل صحيح
- إذا ظهر خطأ 403 → ❌ البكت ليس عاماً أو السياسات خاطئة

---

## 5. حل المشاكل الشائعة

### مشكلة: `StorageApiError: Internal server error`
**الحل:**
1. تأكد من وجود البكت في Supabase
2. تأكد أن البكت **Public**
3. تأكد من وجود سياسة INSERT للمستخدمين المصادق عليهم

### مشكلة: `Row Level Security policy violation`
**الحل:**
1. اذهب إلى السياسات (Policies)
2. تأكد من تفعيل السياسات ✅
3. تأكد من صحة شروط السياسات

### مشكلة: `The resource already exists`
**الحل:**
- الملف موجود بالفعل، غير اسم الملف أو استخدم `upsert: true`

### مشكلة: `Payload too large`
**الحل:**
- الصورة كبيرة جداً، المكتبة `browser-image-compression` تضغط الصور تلقائياً
- تأكد من إعدادات الضغط في الكود

---

## 6. الملفات المستخدمة للـ Storage

| الملف | الوظيفة |
|------|---------|
| `lib/supabaseClient.ts` | يحتوي على `supabase` للـ Storage |
| `hooks/useFileUpload.ts` | Hook لرفع الملفات |
| `components/admin/GalleryUploadTab.tsx` | رفع صور المعرض |
| `components/admin/CreateEventTab.tsx` | رفع صور الفعاليات |
| `components/EditAvatarDialog.tsx` | رفع الصور الشخصية |
| `components/profile-tabs/SubmitHoursTab.tsx` | رفع إثباتات الساعات |

---

## 7. أوامر SQL السريعة

### إنشاء جميع السياسات مرة واحدة
قم بتنفيذ هذا الكود في **SQL Editor** في Supabase:

```sql
-- سياسات gallery-images
CREATE POLICY "Allow authenticated upload to gallery"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery-images');

CREATE POLICY "Public read gallery"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'gallery-images');

CREATE POLICY "Allow own file deletion in gallery"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery-images');

-- سياسات event-images
CREATE POLICY "Allow authenticated upload to events"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Public read events"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images');

-- سياسات avatars
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- سياسات extra-hours-proofs
CREATE POLICY "Users upload proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'extra-hours-proofs');

CREATE POLICY "Users read own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'extra-hours-proofs');
```

---

## ✅ Checklist النهائي

- [ ] إنشاء البكتات الأربعة في Supabase Storage
- [ ] جعل جميع البكتات **Public** ✅
- [ ] إنشاء سياسات RLS لكل bucket
- [ ] اختبار رفع صورة من الواجهة
- [ ] التحقق من ظهور الصورة عبر الرابط العام
- [ ] تعديل `lib/supabaseClient.ts` (تم ✅)

---

🎉 بعد إتمام هذه الخطوات، سيعمل رفع الصور بشكل مثالي!

