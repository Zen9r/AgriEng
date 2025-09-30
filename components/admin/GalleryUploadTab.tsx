'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression'; // مكتبة ضغط الصور

// --- UI Components ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Link as LinkIcon, Image, Sparkles, Camera, Palette, Star, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';

// --- Schema & Types ---
// مخطط التحقق من صحة النموذج
const galleryFormSchema = z.object({
  alt_text: z.string().min(3, "وصف الصورة إجباري."),
  category: z.enum(['ورش عمل', 'معارض', 'زيارات', 'دورات تدريبية', 'اعمال تطوعية', 'مسابقات', 'مؤتمرات'], {
    required_error: "الرجاء اختيار فئة للصورة.",
  }),
  image_url: z.string().url({ message: "الرابط غير صحيح." }).min(1, "رابط الصورة أو رفعها إجباري."),
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

export default function GalleryUploadTab() {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
  });

  // دالة لمعالجة ورفع الصورة بعد ضغطها
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    
    // إنشاء معاينة فورية للصورة
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // إعدادات ضغط الصورة (يمكن تعديلها حسب الحاجة)
    const options = {
      maxSizeMB: 1,          // الحجم الأقصى بعد الضغط (1 ميجابايت)
      maxWidthOrHeight: 1920, // أقصى عرض أو ارتفاع
      useWebWorker: true,    // استخدام Web Worker لتسريع العملية
    };

    try {
      setUploadProgress(20);
      toast('جاري ضغط الصورة...', { icon: '⏳' });
      const compressedFile = await imageCompression(file, options);
      
      setUploadProgress(60);
      toast('جاري رفع الصورة...', { icon: '🚀' });
      const filePath = `gallery-images/${Date.now()}-${compressedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(90);
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(filePath);
      form.setValue('image_url', urlData.publicUrl, { shouldValidate: true });
      setUploadProgress(100);
      toast.success("تم رفع الصورة بنجاح!");

    } catch (error: any) {
      toast.error(error.message || "فشل رفع الصورة.");
      console.error("Upload Error:", error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // دالة الإرسال النهائية إلى قاعدة البيانات
  const onSubmit: SubmitHandler<GalleryFormValues> = async (data) => {
    const { error } = await supabase.from('gallery_images').insert({
      image_url: data.image_url,
      alt_text: data.alt_text,
      category: data.category,
    });

    if (error) {
      toast.error("فشل حفظ الصورة في قاعدة البيانات.");
      console.error("Insert Error:", error);
    } else {
      toast.success("تمت إضافة الصورة إلى المعرض بنجاح!");
      form.reset({ alt_text: '', image_url: '', category: undefined });
      setPreviewUrl(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">رفع صورة جديدة للمعرض</CardTitle>
              <CardDescription className="text-base">أضف صورًا عالية الجودة لتوثيق أنشطة النادي</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Image Upload Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">مصدر الصورة</h3>
                        <p className="text-sm text-muted-foreground">اختر طريقة إضافة الصورة</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                              <TabsTrigger value="upload" className="flex items-center gap-2">
                                <Upload className="h-4 w-4"/>
                                رفع ملف
                              </TabsTrigger>
                              <TabsTrigger value="link" className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4"/>
                                استخدام رابط
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="upload" className="space-y-4">
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleFileUpload(e.target.files[0]);
                                    }
                                  }}
                                  disabled={isUploading}
                                  className="h-12 text-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 cursor-pointer"
                                />
                                {isUploading && (
                                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-md">
                                    <div className="text-center">
                                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                                      <p className="text-sm font-medium">جاري المعالجة والرفع...</p>
                                      {uploadProgress > 0 && (
                                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                                          <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="link" className="space-y-4">
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/image.png" 
                                  {...field} 
                                  className="h-12 text-lg border-2 focus:border-blue-500 transition-all duration-200"
                                />
                              </FormControl>
                            </TabsContent>
                          </Tabs>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Preview */}
                    {(previewUrl || form.watch('image_url')) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6"
                      >
                        <div className="relative overflow-hidden rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                          <img 
                            src={previewUrl || form.watch('image_url')} 
                            alt="معاينة الصورة" 
                            className="max-w-full max-h-64 object-contain rounded-md mx-auto shadow-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              جاهزة
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          فئة الصورة
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 hover:border-purple-500 transition-all duration-200">
                              <SelectValue placeholder="اختر الفئة المناسبة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['ورش عمل', 'معارض', 'زيارات', 'دورات تدريبية', 'اعمال تطوعية', 'مسابقات', 'مؤتمرات'].map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="alt_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Palette className="h-4 w-4 text-green-500" />
                          وصف الصورة
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="وصف موجز لمحتوى الصورة، مفيد لتحسين محركات البحث والوصولية..." 
                            {...field} 
                            className="min-h-[100px] border-2 focus:border-green-500 transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </div>
              
              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-6"
              >
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl" 
                  disabled={isUploading || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      إضافة الصورة للمعرض
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}