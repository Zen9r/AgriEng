'use client';

import React from 'react';
import { supabase } from '@/lib/supabaseClient';
// --- تعديل: استيراد Controller ---
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Send, Upload, Link as LinkIcon, Loader2, Archive, Calendar, Award } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUserHourRequests } from '@/hooks/useUserHourRequests';

type ExtraHoursRequest = {
  user_id: string;
  activity_title: string;
  task_description: string;
  task_type: 'تصميم' | 'مونتاج' | 'كتابة محتوى' | 'تنظيم لوجستي' | 'أخرى';
  image_url?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
};

export default function SubmitHoursTab() {
  const { 
    register, 
    handleSubmit, 
    reset, 
    // --- تعديل: إضافة control هنا ---
    control,
    formState: { errors, isSubmitting }, 
    setValue
  } = useForm<ExtraHoursRequest>({
    // (اختياري) يمكن وضع قيم افتراضية هنا
    defaultValues: {
      activity_title: "",
      task_description: "",
      image_url: ""
    }
  });

  const { uploadFile, isUploading } = useFileUpload();
  const { data: userRequests = [], isLoading: isLoadingRequests } = useUserHourRequests();

  const handleProofUpload = async (file: File) => {
    if (!file) return;
    const publicUrl = await uploadFile(file, 'extra-hours-proofs');
    if (publicUrl) {
      setValue('image_url', publicUrl, { shouldValidate: true });
      toast.success("تم رفع ملف الإثبات بنجاح.");
    }
  };

  const onSubmit: SubmitHandler<ExtraHoursRequest> = async (formData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول لتقديم طلب.");

      const requestData: ExtraHoursRequest = {
        ...formData,
        user_id: user.id,
        status: 'pending',
      };
      
      const { error } = await supabase.from('extra_hours_requests').insert(requestData);
      if (error) throw error;

      toast.success('تم إرسال طلبك بنجاح للمراجعة.');
      reset();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ ما أثناء إرسال الطلب.');
      console.error(error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'; // This will be green (success)
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary'; // This will be yellow (warning)
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'قيد المراجعة';
      default:
        return status;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>طلب توثيق ساعات تطوعية</CardTitle>
              <CardDescription>املأ النموذج التالي لتوثيق ساعات العمل الإضافية التي قمت بها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity_title">عنوان النشاط*</Label>
                <Input id="activity_title" {...register('activity_title', { required: 'هذا الحقل إجباري' })} placeholder="مثال: تصميم بوستر لفعالية..." />
                {errors.activity_title && <p className="text-sm text-red-500">{errors.activity_title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_description">وصف المهمة*</Label>
                <Textarea id="task_description" {...register('task_description', { required: 'هذا الحقل إجباري' })} placeholder="يرجى تقديم وصف تفصيلي للمهمة..." />
                {errors.task_description && <p className="text-sm text-red-500">{errors.task_description.message}</p>}
              </div>
              
              {/* --- تعديل: استخدام Controller لـ Select --- */}
              <div className="space-y-2">
                <Label>نوع المهمة*</Label>
                <Controller
                  name="task_type"
                  control={control}
                  rules={{ required: "الرجاء اختيار نوع المهمة" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المهمة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="تصميم">تصميم</SelectItem>
                        <SelectItem value="مونتاج">مونتاج</SelectItem>
                        <SelectItem value="كتابة محتوى">كتابة محتوى</SelectItem>
                        <SelectItem value="تنظيم لوجستي">تنظيم لوجستي</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.task_type && <p className="text-sm text-red-500">{errors.task_type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>رابط أو ملف إثبات العمل (اختياري)</Label>
                <Tabs defaultValue="link">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="link"><LinkIcon className="ml-2 h-4 w-4"/>إدخال رابط</TabsTrigger>
                    <TabsTrigger value="upload"><Upload className="ml-2 h-4 w-4"/>رفع ملف</TabsTrigger>
                  </TabsList>
                  <TabsContent value="link" className="pt-2">
                     <Input 
                       {...register('image_url')} 
                       placeholder="https://example.com/link-to-your-work.png" 
                       disabled={isUploading}
                     />
                  </TabsContent>
                  <TabsContent value="upload" className="pt-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        onChange={(e) => e.target.files && handleProofUpload(e.target.files[0])} 
                        disabled={isUploading || isSubmitting}
                      />
                      {isUploading && <Loader2 className="h-5 w-5 animate-spin"/>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                {isSubmitting ? 'جاري الإرسال...' : <> <Send className="ml-2 h-4 w-4" /> إرسال الطلب </>}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Archive Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              أرشيف طلباتي
            </CardTitle>
            <CardDescription>جميع طلبات الساعات التي قدمتها مع حالة كل طلب.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : userRequests.length > 0 ? (
              <div className="space-y-4">
                {userRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{request.activity_title}</h4>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {getStatusText(request.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.task_description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(request.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>نوع المهمة:</span>
                          <span className="font-medium">{request.task_type}</span>
                        </div>
                      </div>
                      
                      {request.status === 'approved' && request.awarded_hours && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <Award className="h-4 w-4" />
                          <span>{request.awarded_hours} ساعة</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>لم تقدم أي طلبات ساعات بعد.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}