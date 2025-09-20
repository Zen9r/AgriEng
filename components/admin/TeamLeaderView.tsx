'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- استيراد الأنواع والـ Hooks ---
import { useTeamManagement, type PendingRequest, type ArchivedRequest } from '@/hooks/useTeamManagement';

// --- مكونات الواجهة ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HoursInput from '@/components/ui/HoursInput';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Check, X, ListChecks, PlusCircle, Archive } from 'lucide-react';
import { Label } from '@/components/ui/label';

// --- Schema ---
const manualLogSchema = z.object({
  memberId: z.string({ required_error: "يجب اختيار عضو من الفريق." }),
  description: z.string().min(10, { message: "يجب أن لا يقل الوصف عن 10 أحرف." }),
  hours: z.coerce.number().min(0.5, { message: "الحد الأدنى 0.5 ساعة." }).max(100, { message: "لا يمكن تسجيل أكثر من 100 ساعة." }),
});

type ManualLogFormData = z.infer<typeof manualLogSchema>;

// --- Manual Log Form Component ---
interface ManualLogFormProps {
  members: Array<{ id: string; full_name: string | null }>;
  userId: string;
  onSuccess?: () => void;
}

export function ManualLogForm({ members, userId, onSuccess }: ManualLogFormProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ManualLogFormData>({ 
    resolver: zodResolver(manualLogSchema), 
    defaultValues: { memberId: '', description: '', hours: undefined }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onManualLogSubmit = async (data: ManualLogFormData) => {
    setIsSubmitting(true);
    
    const insertObject = { 
      user_id: data.memberId, 
      activity_title: "مهمة مسجلة يدويًا", 
      task_description: data.description, 
      status: 'approved', 
      awarded_hours: data.hours, 
      reviewed_by: userId
    };
    
    const { error } = await supabase.from('extra_hours_requests').insert(insertObject);

    if (error) { toast.error("فشل في تسجيل الساعات."); } 
    else { toast.success("تم تسجيل الساعات بنجاح."); reset(); onSuccess?.(); }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>تسجيل ساعات لمهمة</CardTitle><CardDescription>منح ساعات مباشرة لعضو في النادي لمهمة مكتملة.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onManualLogSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="memberId">اختر عضو النادي</Label>
            <Controller name="memberId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl"><SelectTrigger id="memberId"><SelectValue placeholder="اختر عضوًا..." /></SelectTrigger><SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name || 'مستخدم غير معروف'}</SelectItem>)}</SelectContent></Select>
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
            <Controller name="hours" control={control} render={({ field }) => <HoursInput value={field.value} onChange={field.onChange} placeholder="اختر عدد الساعات" />} />
            {errors.hours && <p className="text-red-500 text-sm mt-1">{errors.hours.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'منح الساعات'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---
export default function TeamLeaderView({ teamId, userId }: { teamId: string; userId: string }) {
  const { isLoading, teamMembers, pendingRequests, archivedRequests, refreshData } = useTeamManagement(teamId);
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

  if (isLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Tabs defaultValue="review" dir="rtl">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="review">
            <ListChecks className="ml-2 h-4 w-4"/>مراجعة الطلبات <Badge variant="secondary" className="mr-2">{pendingRequests.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">
            <Archive className="ml-2 h-4 w-4"/>أرشيف الطلبات <Badge variant="secondary" className="mr-2">{archivedRequests.length}</Badge>
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

      <TabsContent value="archived" className="mt-6">
        {archivedRequests.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {archivedRequests.map(req => <ArchivedRequestItem key={req.id} request={req} />)}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="mx-auto h-16 w-16" />
            <p className="mt-4 text-lg">لا توجد طلبات مؤرشفة.</p>
            <p className="text-sm">لم يتم مراجعة أي طلبات من أعضاء فريقك بعد.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="manual" className="mt-6">
        <ManualLogForm 
          members={teamMembers} 
          userId={userId} 
          onSuccess={refreshData}
        />
      </TabsContent>
    </Tabs>
  );
}

// --- مكون فرعي لعناصر الأرشيف ---
interface ArchivedRequestItemProps {
  request: ArchivedRequest;
}

function ArchivedRequestItem({ request }: ArchivedRequestItemProps) {
  return (
    <AccordionItem value={request.id} className="border rounded-lg bg-background">
      <AccordionTrigger className="p-4 hover:no-underline font-semibold w-full text-right">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span>{request.activity_title}</span>
            <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
              {request.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
            </Badge>
            {request.status === 'approved' && request.awarded_hours && (
              <Badge variant="secondary">
                {request.awarded_hours} ساعة
              </Badge>
            )}
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {request.profiles?.full_name || 'مستخدم غير معروف'}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-0 pb-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
            {request.task_description}
          </p>
          <div className="text-xs text-muted-foreground">
            <p>تاريخ المراجعة: {request.created_at ? new Date(request.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// --- مكون فرعي مستقل لعناصر المراجعة ---
interface ReviewRequestItemProps {
  request: PendingRequest;
  onReview: (id: string, status: 'approved' | 'rejected', hours?: number) => void;
  isSubmitting: boolean;
}

function ReviewRequestItem({ request, onReview, isSubmitting }: ReviewRequestItemProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ awarded_hours: number }>({ 
    resolver: zodResolver(z.object({ awarded_hours: z.coerce.number().min(0.5, { message: "الرجاء إدخال عدد ساعات صحيح." }) })) 
  });
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
