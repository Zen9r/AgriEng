// components/events-preview.tsx
"use client"

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

// 🌟 FIX: Reusing the reliable hooks we already built
import { useAuth } from "@/context/AuthContext";
import { useEvents, Event } from "@/hooks/useEvents";
import { useEventRegistration } from "@/hooks/useUserRegistrations";

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col bg-card">
      <Skeleton className="w-full h-48 bg-muted" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-2/3 bg-muted" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full bg-muted" />
      </CardFooter>
    </Card>
  );
}

function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center bg-destructive/10 text-destructive p-8 rounded-lg">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">حدث خطأ</h3>
            <p>{message}</p>
        </div>
    );
}

export default function EventsPreview() {
  const { user } = useAuth();
  // 🌟 FIX: Using the central useEvents hook to fetch data
  const { data: allEvents = [], isLoading, isError, error } = useEvents();
  const { mutate: register, isPending: isRegistering } = useEventRegistration();

  // This logic randomizes and selects the first 3 events for the preview
  const previewEvents = useMemo(() => {
    if (!allEvents || allEvents.length === 0) {
      return [];
    }
    
    // 🕐 فلتر الفعاليات: إخفاء أي فعالية انتهت ومر عليها أكثر من ساعة
    const now = new Date();
    const activeEvents = allEvents.filter(event => {
      // إذا لم يكن هناك وقت انتهاء، أظهر الفعالية
      if (!event.end_time) return true;
      
      const endTime = new Date(event.end_time);
      // إضافة ساعة واحدة لوقت الانتهاء
      const oneHourAfterEnd = new Date(endTime.getTime() + 60 * 60 * 1000);
      
      // إذا الوقت الحالي أكبر من (وقت الانتهاء + ساعة)، لا تظهر الفعالية
      return now < oneHourAfterEnd;
    });
    
    // Create a shuffled copy of the array and take the first 3 elements
    return [...activeEvents].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [allEvents]);

  const handleAttendEvent = (event: Event) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً للمشاركة في الفعاليات.");
      return;
    }
    register({ eventId: event.id, userId: user.id, event });
  };

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">الفعاليات القادمة</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعة متنوعة من الأنشطة والفعاليات التي ننظمها لإثراء تجربتك الجامعية
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)
          ) : isError ? (
             <ErrorDisplay message={error?.message || "فشل في تحميل الفعاليات."} />
          ) : previewEvents.length > 0 ? (
            previewEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-card text-card-foreground">
                  <div className="relative">
                    <img 
                      src={event.image_url || `https://placehold.co/600x400/e2d8d4/8c5a2b?text=${encodeURIComponent(event.category || 'فعالية')}`} 
                      alt={event.title ?? 'صورة الفعالية'} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">{event.category || 'فعالية'}</div>
                  </div>
                  <CardHeader className="flex-grow">
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{event.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center"><Calendar className="w-4 h-4 ml-2" />{new Date(event.start_time).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</div>
                      <div className="flex items-center"><Clock className="w-4 h-4 ml-2" />{new Date(event.start_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="flex items-center"><MapPin className="w-4 h-4 ml-2" />{event.location}</div>
                      <div className="flex items-center"><Users className="w-4 h-4 ml-2" />{event.registered_attendees ?? 0} / {event.max_attendees || '∞'} مشارك</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 p-4 bg-muted/50">
                    <Button className="flex-1" onClick={() => handleAttendEvent(event)} disabled={isRegistering}>
                      {isRegistering ? 'جارٍ التسجيل...' : 'تسجيل'}
                    </Button>
                    <Link href={`/${event.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">التفاصيل</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
          ) : (
             <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">لا توجد فعاليات قادمة حالياً.</p>
              </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/events">
            <Button size="lg" variant="outline">
              عرض جميع الفعاليات
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
