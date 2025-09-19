'use client';

import React from 'react';

// --- استيراد الأنواع والـ Hooks ---
import { useUserProfileData } from '@/hooks/useUserProfileData';

// --- مكونات الواجهة ---
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';

// --- المكونات المستخرجة ---
import ClubAdminDashboard from './ClubAdminDashboard';
import TeamLeaderView from './TeamLeaderView';

// =================================================================
// 1. المكون الرئيسي (الموجه)
// =================================================================
export default function TeamManagementTab() {
  const { data: userProfileData, isLoading, error } = useUserProfileData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
      <Card dir="rtl" className="max-w-xl mx-auto mt-10 text-center border-destructive">
        <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-destructive"><ShieldAlert /> خطأ</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">تعذر تحميل ملفك الشخصي. يرجى المحاولة مرة أخرى لاحقًا.</p></CardContent>
      </Card>
    );
  }

  const profile = userProfileData?.profile;
  const team = userProfileData?.team;
  
  const isClubLeadership = profile?.club_role && ['club_leader', 'club_deputy', 'club_supervisor'].includes(profile.club_role);
  if (isClubLeadership && profile) {
    return <ClubAdminDashboard userId={profile.id} />;
  }

  const isTeamLeader = team?.role_in_team === 'leader';
  if (isTeamLeader && profile) {
    return <TeamLeaderView teamId={team.id} userId={profile.id} />;
  }

  return (
    <Card dir="rtl" className="max-w-xl mx-auto mt-10 text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <ShieldAlert className="h-8 w-8 text-yellow-500" />
          لا يوجد إذن وصول
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">هذا القسم متاح فقط لقادة النادي وقادة الفرق.</p>
      </CardContent>
    </Card>
  );
}


