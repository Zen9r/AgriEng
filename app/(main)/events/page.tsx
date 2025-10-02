// app/(main)/events/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";
import { EventFilterTabs } from "@/components/EventFilterTabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useEvents, Event } from "@/hooks/useEvents";
import { useEventRegistration } from "@/hooks/useUserRegistrations";

// Helper component for loading state
function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col bg-card">
      <Skeleton className="w-full h-48 bg-muted" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-2/3 bg-muted" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full bg-muted" />
      </CardFooter>
    </Card>
  );
}

// Helper component for error state
function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center bg-destructive/10 text-destructive p-8 rounded-lg">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">حدث خطأ</h3>
            <p>{message}</p>
        </div>
    );
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  },
};

export default function EventsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: events = [], isLoading: areEventsLoading, isError, error } = useEvents();
  const { mutate: register, isPending: isRegistering } = useEventRegistration();
  const [filter, setFilter] = useState("all");

  const isLoading = isAuthLoading || areEventsLoading;

  const handleAttendEvent = (event: Event) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً للمشاركة في الفعاليات.");
      return;
    }
    register({ eventId: event.id, userId: user.id, event });
  };

  // 🌟 Category filtering with all event types
  const categories = ["all", "ورش عمل", "دورات تدريبية", "زيارات", "اعمال تطوعية", "معارض", "مسابقات", "حفلات", "مؤتمرات"];
  
  // فلتر الفئات
  const filteredByCategory = filter === "all" ? events : events.filter(event => event.category === filter);
  
  // 🕐 فلتر الفعاليات: إخفاء أي فعالية انتهت ومر عليها أكثر من ساعة
  const now = new Date();
  const filteredEvents = filteredByCategory.filter(event => {
    // إذا لم يكن هناك وقت انتهاء، أظهر الفعالية
    if (!event.end_time) return true;
    
    const endTime = new Date(event.end_time);
    // إضافة ساعة واحدة لوقت الانتهاء
    const oneHourAfterEnd = new Date(endTime.getTime() + 60 * 60 * 1000);
    
    // إذا الوقت الحالي أكبر من (وقت الانتهاء + ساعة)، لا تظهر الفعالية
    return now < oneHourAfterEnd;
  });
  
  // This map helps in generating English text for placeholder images if needed
  const categoryMap: { [key: string]: string } = { "ورش عمل": "Workshop", "معارض": "Exhibition", "زيارات": "Visit", "دورات تدريبية": "Course", "اعمال تطوعية": "Volunteering", "مسابقات": "Competition", "حفلات": "Ceremony", "مؤتمرات": "Conference" };

  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-5xl font-bold mb-4">
                الفعاليات والأنشطة
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl opacity-90 max-w-2xl mx-auto">
                اكتشف جميع الفعاليات والأنشطة المتاحة وسجل حضورك الآن
            </motion.p>
        </div>
      </section>
      
      <section className="py-4 bg-background/80 backdrop-blur-sm border-b border-border sticky top-[80px] md:top-[96px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EventFilterTabs categories={categories} activeFilter={filter} setFilter={setFilter} />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)
            ) : isError ? (
              <ErrorDisplay message={error?.message || "فشل في جلب الفعاليات."} />
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Card className="overflow-hidden h-full flex flex-col bg-card text-card-foreground rounded-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                    <div className="relative">
                        <img 
                            src={event.image_url || `https://placehold.co/600x400/e2d8d4/8c5a2b?text=${encodeURIComponent(event.category || 'فعالية')}`} 
                            alt={event.title ?? 'صورة فعالية'} 
                            className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-md">{event.category || 'فعالية'}</div>
                    </div>
                    <CardHeader className="flex-grow">
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{event.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 h-10">{event.description}</p>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center"><Calendar className="w-4 h-4 ml-2" />{new Date(event.start_time).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                      <div className="flex items-center"><Clock className="w-4 h-4 ml-2" />{new Date(event.start_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="flex items-center"><MapPin className="w-4 h-4 ml-2" />{event.location}</div>
                      <div className="flex items-center"><Users className="w-4 h-4 ml-2" />{event.registered_attendees ?? 0} / {event.max_attendees || '∞'} مشارك</div>
                    </div>
                  </CardContent>
                    <CardFooter className="flex gap-2 p-4 bg-muted/50">
                        <Button className="flex-1" onClick={() => handleAttendEvent(event)} disabled={isRegistering}>
                         {isRegistering ? 'جارٍ التسجيل...' : 'تسجيل في الفعالية'}
                        </Button>
                        <Link href={`/${event.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                             التفاصيل
                            </Button>
                        </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">لا توجد فعاليات متاحة ضمن هذا التصنيف حالياً.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
