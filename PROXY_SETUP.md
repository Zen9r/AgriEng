# إعداد نظام البروكسي

تم إنشاء نظام بروكسي API لحل مشكلة انترنت الجامعة. هذا النظام يعمل كوسيط بين الموقع وقاعدة البيانات.

## الملفات المضافة

### API Endpoints
- `/api/proxy` - العمليات العامة على قاعدة البيانات
- `/api/auth` - المصادقة (تسجيل الدخول، التسجيل، تسجيل الخروج)
- `/api/events` - إدارة الفعاليات
- `/api/registrations` - التسجيل في الفعاليات
- `/api/profile` - الملف الشخصي
- `/api/teams` - إدارة الفرق
- `/api/gallery` - معرض الصور
- `/api/contact` - رسائل التواصل
- `/api/reports` - التقارير
- `/api/hours` - طلبات الساعات الإضافية
- `/api/checkin` - التحقق من الحضور
- `/api/upload` - رفع الملفات

## متغيرات البيئة المطلوبة

أضف هذه المتغيرات إلى ملف `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## كيفية الاستخدام

### 1. استيراد البروكسي
```typescript
import { proxyClient } from '@/lib/supabaseClient';
```

### 2. استخدام العمليات
```typescript
// جلب البيانات
const { data, error } = await (await proxyClient.from('events')).select('*');

// إدراج بيانات
const { data, error } = await (await proxyClient.from('events')).insert(eventData);

// تحديث بيانات
const { data, error } = await (await proxyClient.from('events')).update(eventData);

// حذف بيانات
const { data, error } = await (await proxyClient.from('events')).delete();
```

### 3. المصادقة
```typescript
import { supabase } from '@/lib/supabaseClient';

// تسجيل الدخول
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

## المميزات الجديدة

### 1. معالجة الأخطاء المحسنة
- رسائل خطأ واضحة باللغة العربية
- معالجة أخطاء الشبكة والاتصال
- تسجيل مفصل للأخطاء

### 2. التحقق من الصحة
- التحقق من صحة البيانات المرسلة
- التحقق من وجود التوكن المطلوب
- معالجة أخطاء المصادقة

### 3. الأداء
- تخزين مؤقت للطلبات
- معالجة أخطاء الشبكة
- رسائل خطأ واضحة

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ "فشل في الاتصال بالخادم"**
   - تحقق من اتصال الإنترنت
   - تأكد من أن الخادم يعمل
   - تحقق من إعدادات الشبكة

2. **خطأ "Invalid authentication token"**
   - تأكد من تسجيل الدخول
   - جرب تسجيل الخروج والدخول مرة أخرى

3. **خطأ "Database operation failed"**
   - تحقق من صحة البيانات المرسلة
   - تأكد من وجود الجداول المطلوبة

## ملاحظات مهمة

- البروكسي يعمل فقط مع العمليات التي تتطلب مصادقة
- المصادقة تتم مباشرة مع Supabase
- جميع عمليات قاعدة البيانات تمر عبر البروكسي

### 4. تسجيل الخروج
```typescript
await supabase.auth.signOut();
```

## المميزات

1. **حل مشكلة انترنت الجامعة** - جميع العمليات تمر عبر البروكسي
2. **أمان محسن** - استخدام Service Role Key على الخادم فقط
3. **نفس واجهة Supabase** - لا حاجة لتغيير الكود الموجود
4. **تحكم أفضل** - إمكانية إضافة منطق إضافي قبل العمليات
5. **مراقبة أفضل** - تسجيل جميع العمليات على الخادم

## ملاحظات مهمة

- تأكد من إضافة `SUPABASE_SERVICE_ROLE_KEY` إلى متغيرات البيئة
- البروكسي يحافظ على نفس واجهة Supabase الأصلية
- جميع العمليات تمر عبر الخادم مما يحل مشكلة الحجب
- يمكن إضافة المزيد من التحققات والمراقبة حسب الحاجة
