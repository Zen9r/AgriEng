// app/events/[id]/page.tsx
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

// UI Components & Icons
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Users, Tag, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// ✅ This interface perfectly matches the output of our new database function
interface Event {
  id: number;
  created_at: string;
  team_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  image_url: string | null;
  check_in_code: string | null;
  category: string | null;
  details: string | null;
  organizer_whatsapp_link: string | null;
  max_attendees: number | null;
  report_id: string | null;
  registered_attendees: number;
}

// Component for 6-digit PIN input
const PinInput = ({ onComplete }: { onComplete: (pin: string) => void }) => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      const fullPin = newPin.join('');
      if (fullPin.length === 6) {
        onComplete(fullPin);
      } else if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (value === '') {
      const newPin = [...pin];
      newPin[index] = '';
      setPin(newPin);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (/^[0-9]{6}$/.test(paste)) {
      const newPin = paste.split('');
      setPin(newPin);
      onComplete(paste);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div dir="ltr" className="flex justify-center gap-2 md:gap-3">
      {pin.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="tel"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-2xl font-bold rounded-md aspect-square"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

const CheckInForm = ({ onConfirm }: { onConfirm: (code: string) => void }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <Label className="text-foreground font-semibold">كود التحقق من الحضور</Label>
        <p className="text-sm text-muted-foreground">أدخل الكود المكون من 6 أرقام الذي تم تزويدك به.</p>
      </div>
      <PinInput onComplete={onConfirm} />
    </div>
  );
};

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'registered' | 'attended'>('not_registered');
  const [isOrganizerModalOpen, setOrganizerModalOpen] = useState(false); 
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const eventIdAsNumber = parseInt(id, 10);
      if (isNaN(eventIdAsNumber)) {
        setLoading(false);
        setEvent(null);
        toast.error("معرف الفعالية غير صالح.");
        return;
      }
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // 🌟 FIX: We use a type assertion `as any` on the function name to bypass the outdated list,
        // and then we explicitly tell TypeScript the expected return type with `<Event>`.
        const { data, error: eventError } = await supabase
          .rpc('get_event_details' as any, { p_event_id: eventIdAsNumber });

        // Since .rpc with a single object return doesn't have .single(), we check the result directly.
        const eventData = Array.isArray(data) ? data[0] : data;

        if (eventError || !eventData) {
          console.error("Supabase RPC error:", eventError);
          toast.error("لم يتم العثور على الفعالية أو حدث خطأ.");
          setLoading(false);
          setEvent(null);
          return;
        }

        if (user) {
          const { data: registration } = await supabase.from('event_registrations').select('status').eq('user_id', user.id).eq('event_id', eventIdAsNumber).maybeSingle();
          setRegistrationStatus(registration?.status === 'attended' ? 'attended' : registration ? 'registered' : 'not_registered');
        }
        
        // This is now safe because we've told TypeScript what to expect from the RPC call.
        setEvent(eventData as Event);

      } catch (error) {
        toast.error('حدث خطأ في جلب بيانات الفعالية');
        console.error("Catch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleAttendEvent = async (eventId: number, role: 'attendee' | 'organizer') => {
    if (!user || !event) return;
    const toastId = toast.loading('جارٍ تسجيلك...');
    try {
      const { data: existingRegistration } = await supabase.from('event_registrations').select().eq('user_id', user.id).eq('event_id', eventId).maybeSingle();
      if (existingRegistration) {
        toast.error('لقد سجلت في هذه الفعالية مسبقاً', { id: toastId });
        return;
      }
      if (event.max_attendees && (event.registered_attendees ?? 0) >= event.max_attendees) {
        toast.error('لا توجد مقاعد متاحة', { id: toastId });
        return;
      }
      const { error } = await supabase.from('event_registrations').insert({ user_id: user.id, event_id: eventId, status: 'registered', role: role });
      if (error) throw error;
      setEvent(prev => prev ? { ...prev, registered_attendees: (prev.registered_attendees || 0) + 1 } : null);
      setRegistrationStatus('registered');
      if (role === 'organizer') {
        toast.dismiss(toastId);
        setOrganizerModalOpen(true);
      } else {
        toast.success('تم التسجيل في الفعالية بنجاح!', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل', { id: toastId });
    }
  };

  const handleCheckIn = async (verificationCode: string) => {
    if (!event || !user) return;
    const toastId = toast.loading("جارٍ التحقق...");
    try {
      if (verificationCode.toLowerCase() !== event.check_in_code?.toLowerCase()) {
        throw new Error("كود التحقق غير صحيح");
      }
      const { error } = await supabase.from('event_registrations').update({ status: 'attended' }).eq('user_id', user.id).eq('event_id', event.id);
      if (error) throw error;
      setRegistrationStatus('attended');
      toast.success('تم التحقق من حضورك بنجاح!', { id: toastId });
    } catch (error) {
      toast.error('فشل التحقق: ' + (error as Error).message, { id: toastId });
    }
  };
  
  const renderActionSection = () => {
    if (!event || !event.start_time) return null;
    if (!user) {
      return <Button className="w-full h-12 text-lg" onClick={() => router.push('/login')}>سجل دخولك للتسجيل</Button>;
    }

    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;
    const isEventEnded = endTime ? now > endTime : false;
    
    const checkInDeadline = endTime ? new Date(endTime.getTime() + 60 * 60 * 1000) : null;
    const isCheckInWindow = endTime && now >= startTime && checkInDeadline && now <= checkInDeadline;
    const hasCheckInEnded = checkInDeadline && now > checkInDeadline;

    switch (registrationStatus) {
      case 'attended':
        return <div className="flex items-center justify-center p-3 rounded-lg bg-green-100 text-green-800 font-semibold"><CheckCircle className="ml-2" /> تم تأكيد حضورك</div>;
      case 'registered':
        if (isCheckInWindow) return <CheckInForm onConfirm={handleCheckIn} />;
        if (hasCheckInEnded) return <div className="text-center p-3 rounded-lg bg-destructive/20 text-destructive"><XCircle className="inline mr-2" />انتهى وقت التحقق من الحضور</div>;
        return <div className="text-center p-3 rounded-lg bg-blue-100 text-blue-700"><Clock className="inline mr-2" />التحقق من الحضور لم يبدأ بعد</div>;
      default:
        if (isEventEnded) return <Button className="w-full h-12 text-lg" disabled>انتهت الفعالية</Button>;
        const isFull = event.max_attendees !== null && (event.registered_attendees ?? 0) >= event.max_attendees;
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1 h-12 text-lg" onClick={() => handleAttendEvent(event.id, 'attendee')} disabled={isFull}>
              {isFull ? 'المقاعد ممتلئة' : 'تسجيل كحضور'}
            </Button>
            <Button className="flex-1 h-12 text-lg" variant="secondary" onClick={() => handleAttendEvent(event.id, 'organizer')}>
              تسجيل كمنظم
            </Button>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <h1 className="text-2xl font-bold mb-4">الفعالية غير موجودة</h1>
        <Link href="/events"><Button variant="outline"><ArrowRight className="ml-2 h-4 w-4"/>العودة لجميع الفعاليات</Button></Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Toaster position="bottom-center"/>
      <div className="fixed inset-0 -z-10">
        <img 
          src={event.image_url || `https://placehold.co/1200x800/8c5a2b/e2d8d4?text=${encodeURIComponent(event.title ?? 'فعالية')}`} 
          alt={event.title ?? 'صورة الفعالية'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="sticky top-28">
              <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-card-foreground">
                <CardHeader><CardTitle className="text-xl font-bold">معلومات الفعالية</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: <Calendar />, label: "التاريخ", value: event.start_time ? new Date(event.start_time).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }) : 'غير محدد' },
                    { icon: <Clock />, label: "الوقت", value: event.start_time ? `${new Date(event.start_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}${event.end_time ? ` - ${new Date(event.end_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}` : ''}` : 'غير محدد' },
                    { icon: <MapPin />, label: "المكان", value: event.location },
                    { icon: <Tag />, label: "الفئة", value: event.category },
                    { icon: <Users />, label: "الحضور", value: `${event.registered_attendees || 0}${event.max_attendees ? ` / ${event.max_attendees}` : ''}` }
                  ].map((item, index) => item.value && (
                    <div key={index} className="flex items-start gap-4">
                      <div className="mt-1 text-primary w-5 h-5 flex-shrink-0">{item.icon}</div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.label}</h4>
                        <p className="text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="pt-4"><div className="w-full">{renderActionSection()}</div></CardFooter>
              </Card>
            </motion.div>
          </div>
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-card-foreground">
                <CardHeader><CardTitle className="text-2xl md:text-3xl font-bold text-primary">{event.title ?? 'فعالية بدون عنوان'}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">وصف الفعالية</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.description ?? 'لا يوجد وصف لهذه الفعالية.'}</p>
                  </div>
                  {event.details && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-xl font-semibold text-foreground mb-3">تفاصيل إضافية</h3>
                      <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">{event.details}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Link href="/events"><Button variant="outline" size="lg" className="bg-card/80 backdrop-blur-sm hover:bg-card"><ArrowRight className="ml-2 h-4 w-4"/>العودة لجميع الفعاليات</Button></Link>
        </div>
      </div>
      <Dialog open={isOrganizerModalOpen} onOpenChange={setOrganizerModalOpen}>
        <DialogContent className="sm:max-w-md text-center p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">تهانينا! لقد انضممت كمنظم</DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground">نشكر لك تطوعك للمساعدة. خطوتك التالية هي الانضمام لمجموعة الواتساب الخاصة بالمنظمين لمتابعة آخر التحديثات.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <a href={event?.organizer_whatsapp_link || '#'} target="_blank" rel="noopener noreferrer" className="w-full" onClick={() => setOrganizerModalOpen(false)}>
              <Button type="button" className="w-full h-12 text-lg">الانضمام لمجموعة الواتساب</Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
