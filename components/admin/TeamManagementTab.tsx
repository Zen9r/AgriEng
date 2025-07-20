'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QueryData } from '@supabase/supabase-js';

// --- استيراد الأنواع والـ Hooks ---
import { useUserProfileData } from '@/hooks/useUserProfileData';
import { useTeamManagement, type PendingRequest } from '@/hooks/useTeamManagement';
import type { Profile } from '@/hooks/useProfile';

// --- مكونات الواجهة ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Check, X, ListChecks, PlusCircle, ShieldAlert, Archive, Users, RefreshCw, User, Phone, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
  if (isClubLeadership) {
    return <ClubLeaderView />;
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


// =================================================================
// 2. واجهة قائد النادي (لوحة الإشراف) - معدلة ومحسنة
// =================================================================

// FIX 4: تحديث الاستعلام لجلب رقم الهاتف والمعلومات الإضافية
const clubLeaderQuery = supabase
  .from('extra_hours_requests')
  .select(`
    *,
    profiles!user_id (
      full_name,
      phone_number,
      team_members (
        teams ( id, name )
      )
    )
  `)
  .in('status', ['approved', 'rejected']);

// استنتاج النوع مباشرة من الاستعلام المحدث لضمان سلامة الأنواع
type ArchivedRequest = QueryData<typeof clubLeaderQuery>[0];

function ClubLeaderView() {
  const [archivedRequests, setArchivedRequests] = useState<ArchivedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchivedData = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await clubLeaderQuery;

    if (error) {
      toast.error('فشل في جلب الطلبات المؤرشفة.');
      console.error('Club Leader View Error:', error);
    } else {
      setArchivedRequests(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchArchivedData();
  }, [fetchArchivedData]);

  const requestsByTeam = useMemo(() => {
    return archivedRequests.reduce((acc, req) => {
      const teamName = req.profiles?.team_members?.[0]?.teams?.name || 'أعضاء بدون فريق';
      if (!acc[teamName]) {
        acc[teamName] = [];
      }
      acc[teamName].push(req);
      return acc;
    }, {} as Record<string, ArchivedRequest[]>);
  }, [archivedRequests]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
     <Card dir="rtl" className="max-w-5xl mx-auto">
      {/* FIX 3: تحسين تصميم الهيدر */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5"/>أرشيف طلبات الساعات</CardTitle>
          <CardDescription>عرض لجميع الطلبات التي تمت مراجعتها عبر كل الفرق.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchArchivedData} disabled={isLoading}>
          <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
          تحديث
        </Button>
      </CardHeader>
      <CardContent>
        {Object.keys(requestsByTeam).length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(requestsByTeam).map(([teamName, requests]) => (
              <AccordionItem key={teamName} value={teamName} className="border rounded-lg bg-background">
                <AccordionTrigger className="p-4 hover:no-underline font-semibold w-full text-right">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary"/>
                    <span>{teamName}</span>
                    <Badge variant="secondary">{requests.length} طلبات</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-0 pb-4">
                  {/* FIX 1 & 2: إعادة تصميم عرض الطلب */}
                  <div className="space-y-3 pt-2">
                    {requests.map(req => (
                      <div key={req.id} className="border bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                           <h4 className="font-semibold">{req.activity_title}</h4>
                           <Badge variant={req.status === 'approved' ? 'success' : 'destructive'}>
                            {req.status === 'approved' ? 'موافق عليه' : 'مرفوض'} {req.status === 'approved' ? `(${req.awarded_hours} س)`: ''}
                           </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{req.profiles?.full_name || 'مستخدم غير معروف'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{req.profiles?.phone_number || 'لا يوجد رقم هاتف'}</span>
                          </div>
                        </div>
                        <div className="text-sm pt-2">
                           <p className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                            <span>{req.task_description}</span>
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="mx-auto h-16 w-16" />
            <p className="mt-4 text-lg">لا توجد طلبات مؤرشفة.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// =================================================================
// 3. واجهة قائد الفريق (لوحة الإدارة)
// =================================================================
const manualLogSchema = z.object({
  memberId: z.string({ required_error: "يجب اختيار عضو من الفريق." }),
  description: z.string().min(10, { message: "يجب أن لا يقل الوصف عن 10 أحرف." }),
  hours: z.coerce.number().min(0.5, { message: "الحد الأدنى 0.5 ساعة." }).max(100, { message: "لا يمكن تسجيل أكثر من 100 ساعة." }),
});
type ManualLogFormData = z.infer<typeof manualLogSchema>;

function TeamLeaderView({ teamId, userId }: { teamId: string; userId: string }) {
  const { isLoading, teamMembers, pendingRequests, refreshData } = useTeamManagement(teamId);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ManualLogFormData>({ resolver: zodResolver(manualLogSchema), defaultValues: { memberId: '', description: '', hours: undefined }});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async (requestId: string, status: 'approved' | 'rejected', hours?: number) => {
    if (status === 'approved' && (!hours || hours <= 0)) {
        toast.error("للموافقة على الطلب، يجب إدخال عدد ساعات صحيح.");
        return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('extra_hours_requests')
      .update({ status, awarded_hours: hours, reviewed_by: userId })
      .eq('id', requestId);
      
    if (error) { toast.error("فشل في تحديث الطلب."); } 
    else { toast.success(`تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} الطلب بنجاح.`); await refreshData(); }
    setIsSubmitting(false);
  };

  const onManualLogSubmit = async (data: ManualLogFormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('extra_hours_requests').insert({ 
      user_id: data.memberId, 
      activity_title: "مهمة مسجلة يدويًا", 
      task_description: data.description, 
      status: 'approved', 
      awarded_hours: data.hours, 
      reviewed_by: userId,
      team_id: teamId
    });

    if (error) { toast.error("فشل في تسجيل الساعات."); } 
    else { toast.success("تم تسجيل الساعات بنجاح."); reset(); await refreshData(); }
    setIsSubmitting(false);
  };

  if (isLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Tabs defaultValue="review" dir="rtl">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="review">
            <ListChecks className="ml-2 h-4 w-4"/>مراجعة الطلبات <Badge variant="secondary" className="mr-2">{pendingRequests.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="manual"><PlusCircle className="ml-2 h-4 w-4"/>تسجيل ساعات يدويًا</TabsTrigger>
      </TabsList>
      
      <TabsContent value="review" className="mt-6">
        {pendingRequests.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {pendingRequests.map(req => <ReviewRequestItem key={req.id} request={req} onReview={handleReview} isSubmitting={isSubmitting} />)}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="mx-auto h-16 w-16" />
            <p className="mt-4 text-lg">قائمة المراجعة فارغة.</p>
            <p className="text-sm">لا توجد طلبات معلقة من أعضاء فريقك.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="manual" className="mt-6">
        <Card>
          <CardHeader><CardTitle>تسجيل ساعات لمهمة</CardTitle><CardDescription>منح ساعات مباشرة لعضو في الفريق لمهمة مكتملة.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onManualLogSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="memberId">اختر عضو الفريق</Label>
                <Controller name="memberId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><SelectTrigger id="memberId"><SelectValue placeholder="اختر عضوًا..." /></SelectTrigger><SelectContent>{teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent></Select>
                )} />
                {errors.memberId && <p className="text-red-500 text-sm mt-1">{errors.memberId.message}</p>}
              </div>
              <div className="space-y-1.5">
                 <Label htmlFor="description">وصف المهمة</Label>
                 <Controller name="description" control={control} render={({ field }) => <Textarea id="description" placeholder="مثال: تصوير وتعديل فيديو تغطية الحدث." {...field} />} />
                 {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours">عدد الساعات</Label>
                <Controller name="hours" control={control} render={({ field }) => <Input id="hours" type="number" step="0.5" placeholder="مثال: 4.5" {...field} />} />
                {errors.hours && <p className="text-red-500 text-sm mt-1">{errors.hours.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'منح الساعات'}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// --- مكون فرعي مستقل لعناصر المراجعة ---
interface ReviewRequestItemProps {
  request: PendingRequest;
  onReview: (id: string, status: 'approved' | 'rejected', hours?: number) => void;
  isSubmitting: boolean;
}

function ReviewRequestItem({ request, onReview, isSubmitting }: ReviewRequestItemProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ awarded_hours: number }>({ resolver: zodResolver(z.object({ awarded_hours: z.coerce.number().min(0.5, { message: "الرجاء إدخال عدد ساعات صحيح." }) })) });
  const awardedHours = watch('awarded_hours');
  
  return (
    <AccordionItem value={request.id} className="border rounded-lg bg-background">
      <AccordionTrigger className="p-4 hover:no-underline font-semibold w-full text-right">
        <div className="flex justify-between items-center w-full">
          <span>{request.activity_title}</span>
          <span className="text-sm font-normal text-muted-foreground">{request.profiles?.full_name || 'مستخدم غير معروف'}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-0 pb-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{request.task_description}</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor={`awarded_hours_${request.id}`}>الساعات للموافقة</Label>
              <Input id={`awarded_hours_${request.id}`} type="number" placeholder="مثال: 3" step="0.5" {...register('awarded_hours')} />
              {errors.awarded_hours && <p className="text-red-500 text-sm mt-1">{errors.awarded_hours.message}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="success" onClick={handleSubmit(data => onReview(request.id, 'approved', data.awarded_hours))} disabled={isSubmitting || !awardedHours}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Check className="ml-2 h-4 w-4" />موافقة</>}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReview(request.id, 'rejected')} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <><X className="ml-2 h-4 w-4" />رفض</>}
              </Button>
            </div>
          </form>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
