// app/(main)/teams/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // استيراد useRouter
import { supabase } from '@/lib/supabaseClient';
import TeamCard from '@/components/TeamCard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // استيراد useAuth

// تعريف نوع البيانات للفرق
interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_title: string | null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // -->> بداية الإضافة الجديدة للحماية <<--
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // إذا انتهى التحميل ولم يكن هناك مستخدم، أعده لصفحة تسجيل الدخول
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);
  // -->> نهاية الإضافة الجديدة للحماية <<--


  // الكود الكامل والصحيح
useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true); // نبدأ التحميل
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) {
          throw error; // إرسال الخطأ ليتم التعامل معه في catch
        }

        if (data) {
          setTeams(data);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        // يمكنك إضافة toast.error هنا
      } finally {
        // -->> هذا هو السطر الأهم الذي كان ناقصًا <<--
        // يتم تنفيذه دائمًا، سواء نجحت العملية أو فشلت
        setIsLoading(false); 
      }
    };

    // لا تجلب البيانات إلا إذا انتهى تحميل المصادقة وكان هناك مستخدم
    if (!isAuthLoading && user) {
      fetchTeams();
    }
    
    // إذا انتهى تحميل المصادقة ولم يكن هناك مستخدم، أوقف التحميل
    if (!isAuthLoading && !user) {
        setIsLoading(false);
    }

  }, [user, isAuthLoading]);
  // ...

  // أضف حالة تحميل للمصادقة
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">انضم إلى فرقنا</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          اختر الفريق الذي يناسب اهتماماتك ومهاراتك وكن جزءًا من رحلتنا.
        </p>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">لا توجد فرق متاحة للانضمام حاليًا.</p>
      )}
    </main>
  );
}