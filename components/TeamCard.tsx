// src/components/TeamCard.tsx
'use client';

import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';

// تعريف نوع البيانات التي يستقبلها المكون
interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_title: string | null;
}

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinTeam = async () => {
    setIsLoading(true);
    // أولاً، نتأكد من هوية المستخدم الحالي
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً للانضمام لفريق.");
      setIsLoading(false);
      return;
    }

    // ثانياً، نحاول إضافة العضو إلى جدول team_members
    const { error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        team_id: team.id,
        role: 'member' // الدور الافتراضي للعضو الجديد
      });

    if (error) {
      // نتعامل مع الأخطاء الشائعة
      if (error.code === '23505') { // خطأ تكرار القيد (يعني أنه عضو بالفعل)
        toast.error("أنت عضو بالفعل في هذا الفريق.");
      } else {
        toast.error("حدث خطأ أثناء محاولة الانضمام.");
      }
    } else {
      toast.success(`تم انضمامك بنجاح إلى فريق ${team.name}!`);
    }
    setIsLoading(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
        {team.leader_title && (
          <CardDescription>{team.leader_title}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{team.description || 'لا يوجد وصف لهذا الفريق.'}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleJoinTeam} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          انضم للفريق
        </Button>
      </CardFooter>
    </Card>
  );
}