// contact/page.tsx (الكود المعدّل)
"use client"

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from "@/components/ui/label"; // تم استخدام Label من ui/label

// --- Schema & Types ---
const contactFormSchema = z.object({
  name: z.string().min(3, "الاسم الكامل إجباري."),
  email: z.string().email("البريد الإلكتروني غير صحيح."),
  phone: z.string().optional(),
  title: z.string().min(5, "العنوان إجباري ويجب أن يكون 5 أحرف على الأقل."),
  subject: z.enum(['اقتراح فعالية', 'تعاون مع نادي آخر', 'استفسار عام', 'مشكلة تقنية', 'أخرى']).optional(),
  message: z.string().min(10, "الرسالة يجب أن تحتوي على 10 أحرف على الأقل."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', title: '', message: '' }
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setFormStatus(null);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        full_name: data.name, email: data.email, phone: data.phone,
        title: data.title,
        subject: data.subject || null,
        message_body: data.message,
      });

      if (error) throw error;
      
      setFormStatus({ type: 'success', message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' });
      reset();
    } catch (error: any) {
      setFormStatus({ type: 'error', message: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <main className="relative overflow-hidden bg-background" dir="rtl">
      {/* تم تغيير الخلفية لتستخدم ألوان الثيم */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-5xl font-bold mb-4">تواصل معنا</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl opacity-90 max-w-2xl mx-auto">نحن هنا للإجابة على استفساراتك واقتراحاتك.</motion.p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-1 space-y-8">
              {[{icon: <Mail/>, title: "البريد الإلكتروني", content: <a href="mailto:AgriEng.club@ksu.edu.sa" className="hover:text-primary transition-colors">AgriEng.club@ksu.edu.sa</a>},
               {icon: <Phone/>, title: "الهاتف", content: <a href="tel:+966114678451" className="hover:text-primary transition-colors" dir="ltr">+966 11 467 8451</a>},
               {icon: <MapPin/>, title: "العنوان", content: <div><a href="https://maps.app.goo.gl/yourlink" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">كلية علوم الأغذية والزراعة</a><br /><a href="https://ksu.edu.sa" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">جامعة الملك سعود</a></div>},
               {icon: <Clock/>, title: "ساعات العمل", content: <p>الأحد - الخميس: 8ص - 4م</p>}].map((item, i) => (
                <motion.div variants={itemVariants} key={i}>
                  <Card className="text-center sm:text-right shadow-md hover:shadow-lg transition-shadow bg-card">
                    {/* تم تغيير لون الأيقونة */}
                    <CardHeader><CardTitle className="flex justify-center sm:justify-start items-center text-xl text-card-foreground">{React.cloneElement(item.icon, { className: 'w-6 h-6 ml-3 text-secondary' })}{item.title}</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">{item.content}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="shadow-lg bg-card">
                <CardHeader>
                  {/* تم تغيير لون العنوان */}
                  <CardTitle className="text-2xl text-primary">أرسل لنا رسالة</CardTitle>
                  <p className="text-muted-foreground">املأ النموذج أدناه وسنتواصل معك في أقرب وقت ممكن.</p>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {formStatus && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <Alert variant={formStatus.type === 'error' ? 'destructive' : 'default'} className={formStatus.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}>
                              {formStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                              <AlertTitle>{formStatus.type === 'error' ? 'حدث خطأ' : 'تم بنجاح!'}</AlertTitle>
                              <AlertDescription>{formStatus.message}</AlertDescription>
                          </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">الاسم الكامل *</Label>
                        <Input id="name" {...register('name')} placeholder="أدخل اسمك الكامل"/>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">البريد الإلكتروني *</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="force-ltr"/>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                    
                     <div>
                        <Label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">رقم الهاتف (اختياري)</Label>
                        <Input id="phone" type="tel" {...register('phone')} placeholder="05xxxxxxxx" className="force-ltr"/>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                        <Label htmlFor="title" className="mb-2 block text-sm font-medium text-foreground">العنوان *</Label>
                        <Input id="title" {...register('title')} placeholder="اكتب عنوانًا واضحًا لرسالتك..."/>
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-foreground">الموضوع (اختياري)</Label>
                        <Controller name="subject" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="اختر موضوع الرسالة" /></SelectTrigger>
                                <SelectContent>
                                    {['اقتراح فعالية', 'تعاون مع نادي آخر', 'استفسار عام', 'مشكلة تقنية', 'أخرى'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}/>
                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">الرسالة *</Label>
                      <Textarea id="message" {...register('message')} placeholder="اكتب تفاصيل رسالتك هنا..." rows={5}/>
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                    </div>

                    {/* تم تغيير لون الزر */}
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="ml-2 h-5 w-5"/>}
                      {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}