'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { format } from 'date-fns';

// --- UI Components ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleCalendar } from '@/components/ui/simple-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, Edit, Loader2, CalendarIcon, Upload, Link as LinkIcon, AlertTriangle, Copy, Check, Trash, Sparkles, Clock, MapPin, Users, Image, MessageCircle, Star, Zap } from 'lucide-react';

// --- Types & Schema ---
type DatabaseEvent = {
  id: number;
  title: string;
  description: string;
  details: string;
  location: string;
  start_time: string;
  end_time: string;
  category: 'ورش عمل' | 'معارض' | 'زيارات' | 'دورات تدريبية' | 'اعمال تطوعية' | 'مسابقات' | 'مؤتمرات';
  image_url: string | null;
  organizer_whatsapp_link: string | null;
  max_attendees: number | null;
  check_in_code: string;
};

const eventFormSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب."),
  description: z.string().min(1, "الوصف المختصر مطلوب."),
  details: z.string().min(1, "التفاصيل الكاملة مطلوبة."),
  location: z.string().min(1, "الموقع مطلوب."),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب." }),
  startHour: z.string({ required_error: "الساعة مطلوبة." }),
  startMinute: z.string({ required_error: "الدقيقة مطلوبة." }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب." }),
  endHour: z.string({ required_error: "الساعة مطلوبة." }),
  endMinute: z.string({ required_error: "الدقيقة مطلوبة." }),
  category: z.enum(['ورش عمل', 'معارض', 'زيارات', 'دورات تدريبية', 'اعمال تطوعية', 'مسابقات', 'مؤتمرات']),
  max_attendees: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: "الرجاء إدخال رقم صحيح."})
     .int()
     .positive("يجب أن يكون الرقم أكبر من صفر.")
     .optional()
  ),
  image_url: z.string().url("الرابط غير صحيح.").optional().or(z.literal('')),
  organizer_whatsapp_link: z.string().url("رابط الواتساب غير صحيح.").optional().or(z.literal('')),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// --- Helper Functions ---
const combineDateTime = (date: Date, hour: string, minute: string): string => {
  const combined = new Date(date);
  combined.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
  return combined.toISOString();
};

const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutesOptions = ['00', '15', '30', '45'];


// --- Reusable Form Component ---
function EventForm({ mode, initialData, onSubmit, onCancel }: {
  mode: 'create' | 'edit';
  initialData?: Partial<DatabaseEvent>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            details: initialData?.details || '',
            location: initialData?.location || '',
            startDate: initialData?.start_time ? new Date(initialData.start_time) : undefined,
            startHour: initialData?.start_time ? format(new Date(initialData.start_time), 'HH') : undefined,
            startMinute: initialData?.start_time ? format(new Date(initialData.start_time), 'mm') : undefined,
            endDate: initialData?.end_time ? new Date(initialData.end_time) : undefined,
            endHour: initialData?.end_time ? format(new Date(initialData.end_time), 'HH') : undefined,
            endMinute: initialData?.end_time ? format(new Date(initialData.end_time), 'mm') : undefined,
            category: initialData?.category,
            max_attendees: initialData?.max_attendees || undefined,
            image_url: initialData?.image_url || '',
            organizer_whatsapp_link: initialData?.organizer_whatsapp_link || '',
        },
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
            const filePath = `events/${Date.now()}-${compressedFile.name}`;
            const { error } = await supabase.storage.from('event-images').upload(filePath, compressedFile);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
            form.setValue('image_url', publicUrl, { shouldValidate: true });
            toast.success("تم رفع الصورة بنجاح.");
        } catch (e) {
            toast.error("فشل رفع الصورة.");
        } finally {
            setIsUploading(false);
        }
    };

    const processSubmit = (data: EventFormValues) => {
        const submissionData = {
            ...data,
            start_time: combineDateTime(data.startDate, data.startHour, data.startMinute),
            end_time: combineDateTime(data.endDate, data.endHour, data.endMinute),
            max_attendees: data.max_attendees || null,
        };
        const { startDate, startTime, endDate, endTime, startHour, startMinute, endHour, endMinute, ...finalData } = submissionData as any;
        onSubmit(finalData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">المعلومات الأساسية</h3>
                                    <p className="text-sm text-muted-foreground">ابدأ بإنشاء فعاليتك المميزة</p>
                                </div>
                            </div>
                            
                            <FormField name="title" control={form.control} render={({ field }) => (
                                <FormItem className="mb-6">
                                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        عنوان الفعالية
                                    </FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            placeholder="مثال: ورشة تطوير تطبيقات الجوال"
                                            className="h-12 text-lg border-2 focus:border-blue-500 transition-all duration-200"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FormField name="description" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-orange-500" />
                                            وصف مختصر
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                {...field} 
                                                placeholder="وصف سريع عن الفعالية..."
                                                className="min-h-[100px] border-2 focus:border-orange-500 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField name="details" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            التفاصيل الكاملة
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                rows={5} 
                                                {...field} 
                                                placeholder="تفاصيل شاملة عن الفعالية، المتطلبات، الفوائد..."
                                                className="min-h-[100px] border-2 focus:border-green-500 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Separator className="my-8" />

                {/* Date and Time Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-6"
                >
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-6 border border-purple-200/50 dark:border-purple-800/50">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -translate-y-16 -translate-x-16"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">التوقيت</h3>
                                    <p className="text-sm text-muted-foreground">حدد موعد فعاليتك</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        وقت البدء
                                    </FormLabel>
                                    <div className="space-y-3">
                                        <FormField name="startDate" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button 
                                                                variant="outline" 
                                                                className="w-full justify-start text-right font-normal h-12 border-2 hover:border-purple-500 transition-all duration-200"
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span className="text-muted-foreground">اختر تاريخ البدء</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <SimpleCalendar mode="single" selected={field.value} onSelect={field.onChange} />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="flex gap-3">
                                            <FormField name="startHour" control={form.control} render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 hover:border-purple-500 transition-all duration-200">
                                                                <SelectValue placeholder="الساعة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {hoursOptions.map(h => (
                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField name="startMinute" control={form.control} render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 hover:border-purple-500 transition-all duration-200">
                                                                <SelectValue placeholder="الدقيقة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {minutesOptions.map(m => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        وقت الانتهاء
                                    </FormLabel>
                                    <div className="space-y-3">
                                        <FormField name="endDate" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button 
                                                                variant="outline" 
                                                                className="w-full justify-start text-right font-normal h-12 border-2 hover:border-purple-500 transition-all duration-200"
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span className="text-muted-foreground">اختر تاريخ الانتهاء</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <SimpleCalendar mode="single" selected={field.value} onSelect={field.onChange} />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="flex gap-3">
                                            <FormField name="endHour" control={form.control} render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 hover:border-purple-500 transition-all duration-200">
                                                                <SelectValue placeholder="الساعة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {hoursOptions.map(h => (
                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField name="endMinute" control={form.control} render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 hover:border-purple-500 transition-all duration-200">
                                                                <SelectValue placeholder="الدقيقة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {minutesOptions.map(m => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Separator />

                {/* Event Details Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-emerald-400/20 to-teal-400/20 rounded-full translate-y-16 translate-x-16"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">تفاصيل الفعالية</h3>
                                    <p className="text-sm text-muted-foreground">اكمل معلومات فعاليتك</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FormField name="category" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            فئة الفعالية
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 border-2 hover:border-emerald-500 transition-all duration-200">
                                                    <SelectValue placeholder="اختر فئة الفعالية" />
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
                                )}/>
                                <FormField name="location" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            الموقع
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                placeholder="مثال: قاعة المؤتمرات - مبنى الهندسة"
                                                className="h-12 text-lg border-2 focus:border-emerald-500 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                <FormField name="max_attendees" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            الحد الأقصى للحضور (اختياري)
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="50" 
                                                {...field} 
                                                value={field.value ?? ''} 
                                                className="h-12 text-lg border-2 focus:border-emerald-500 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField name="organizer_whatsapp_link" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            رابط قروب الواتساب (اختياري)
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                placeholder="https://chat.whatsapp.com/..."
                                                className="h-12 text-lg border-2 focus:border-emerald-500 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Separator />

                {/* Attachments & Links Section */}
                <div className="space-y-6">
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-foreground">المرفقات والروابط</h3>
                        <p className="text-sm text-muted-foreground">صورة الفعالية وروابط إضافية</p>
                    </div>
                    <div>
                        <FormLabel>صورة الفعالية (اختياري)</FormLabel>
                        <Tabs defaultValue="link"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="link"><LinkIcon className="h-4 w-4 mr-2"/>رابط</TabsTrigger><TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2"/>رفع</TabsTrigger></TabsList>
                            <TabsContent value="link" className="pt-2"><FormField name="image_url" control={form.control} render={({ field }) => (<FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/></TabsContent>
                            <TabsContent value="upload" className="pt-2"><div className="flex items-center gap-2"><Input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} disabled={isUploading}/>{isUploading && <Loader2 className="h-5 w-5 animate-spin"/>}</div></TabsContent>
                        </Tabs>
                        
                        {/* Image Preview */}
                        {form.watch('image_url') && (
                            <div className="mt-4">
                                <Label className="text-sm font-medium">معاينة الصورة</Label>
                                <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                                    <img 
                                        src={form.watch('image_url')} 
                                        alt="معاينة صورة الفعالية" 
                                        className="max-w-full max-h-48 object-contain rounded-md mx-auto"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Submit Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex gap-4 pt-8"
                >
                    <Button 
                        type="submit" 
                        className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl" 
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                {mode === 'create' ? (
                                    <>
                                        <PlusCircle className="h-5 w-5 mr-3" />
                                        إنشاء الفعالية
                                    </>
                                ) : (
                                    <>
                                        <Edit className="h-5 w-5 mr-3" />
                                        تحديث الفعالية
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                    {mode === 'edit' && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                            className="h-14 px-8 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
                        >
                            إلغاء
                        </Button>
                    )}
                </motion.div>
            </form>
        </Form>
    );
}

// --- Main Management Component ---
export default function EventManagementTab() {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [activeTab, setActiveTab] = useState('manage');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<DatabaseEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        // Cast to unknown first to avoid type mismatch
        setEvents(data as unknown as DatabaseEvent[]);
    } catch (e: any) { setError("فشل في جلب الفعاليات."); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (data: any) => {
    const { error } = await supabase.from('events').insert({ ...data, check_in_code: Math.floor(100000 + Math.random() * 900000).toString() });
    if (error) { toast.error(error.message); } 
    else { toast.success("تم إنشاء الفعالية."); await fetchEvents(); setActiveTab('manage'); }
  };
  
  const handleUpdate = async (data: any) => {
    if (!selectedEvent) return;
    const { error } = await supabase.from('events').update(data).eq('id', selectedEvent.id);
    if (error) { toast.error(error.message); }
    else { toast.success("تم تحديث الفعالية."); setMode('create'); setSelectedEvent(null); await fetchEvents(); setActiveTab('manage'); }
  };

  const handleDeleteEvent = async (eventId: number) => {
  const confirm = window.confirm("هل أنت متأكد من حذف الفعالية؟ لا يمكن التراجع.");
  if (!confirm) return;

  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) {
    toast.error("فشل الحذف: " + error.message);
  } else {
    toast.success("تم حذف الفعالية.");
    await fetchEvents(); // تحديث القائمة بعد الحذف
  }
};

  
  const handleEditClick = (event: DatabaseEvent) => {
    setSelectedEvent(event);
    setMode('edit');
    setActiveTab('form');
  };
  
  const handleCancelEdit = () => {
    setMode('create');
    setSelectedEvent(null);
    setActiveTab('manage');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success("تم نسخ الرمز!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manage">إدارة الفعاليات</TabsTrigger>
        <TabsTrigger value="form">{mode === 'create' ? 'إنشاء فعالية جديدة' : 'تعديل الفعالية'}</TabsTrigger>
      </TabsList>
      <TabsContent value="manage" className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                الفعاليات المنشأة
              </CardTitle>
              <CardDescription className="text-base">قائمة بالفعاليات التي تم إنشاؤها وإدارتها</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4"/>
                  <p className="text-muted-foreground">جاري تحميل الفعاليات...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-5 w-5"/>
                  <AlertTitle className="text-lg">خطأ في التحميل</AlertTitle>
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CalendarIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">لا توجد فعاليات</h3>
                  <p className="text-gray-500 dark:text-gray-500">ابدأ بإنشاء فعاليتك الأولى</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <AccordionItem value={String(event.id)} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-semibold">{event.title}</span>
                                <p className="text-sm text-muted-foreground">{event.category}</p>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                              {format(new Date(event.start_time), 'yyyy/MM/dd')}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="space-y-6">
                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">تفاصيل الفعالية</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">الوصف:</span> {event.description}</p>
                                    <p><span className="font-medium">الموقع:</span> {event.location}</p>
                                    <p><span className="font-medium">الوقت:</span> {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}</p>
                                    {event.max_attendees && (
                                      <p><span className="font-medium">الحد الأقصى:</span> {event.max_attendees} شخص</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">كود التحقق</h4>
                                  <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                                      <p className="font-mono text-xl font-bold text-green-700 dark:text-green-400">
                                        {event.check_in_code}
                                      </p>
                                    </div>
                                    <button 
                                      onClick={() => copyToClipboard(event.check_in_code)}
                                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                    >
                                      {copiedCode === event.check_in_code ? (
                                        <Check className="h-5 w-5 text-green-600"/>
                                      ) : (
                                        <Copy className="h-5 w-5 text-gray-600 dark:text-gray-400"/>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <button 
                                onClick={() => handleEditClick(event)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4"/>
                                تعديل الفعالية
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                              >
                                <Trash className="h-4 w-4" />
                                حذف الفعالية
                              </button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
      <TabsContent value="form" className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  {mode === 'create' ? (
                    <PlusCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Edit className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                {mode === 'create' ? 'إنشاء فعالية جديدة' : 'تعديل الفعالية'}
              </CardTitle>
              <CardDescription className="text-base">
                {mode === 'create' 
                  ? 'املأ جميع الحقول المطلوبة لإنشاء فعالية جديدة ومميزة' 
                  : 'قم بتعديل المعلومات المطلوبة وتحديث الفعالية'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EventForm 
                key={selectedEvent ? `edit-${selectedEvent.id}` : 'create'}
                mode={mode}
                initialData={selectedEvent || undefined}
                onSubmit={mode === 'create' ? handleCreate : handleUpdate}
                onCancel={handleCancelEdit}
              />
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}