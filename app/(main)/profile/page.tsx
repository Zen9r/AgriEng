// app/profile/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from 'react-responsive';
import { supabase } from "@/lib/supabaseClient";

// --- UI Components & Icons ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, School, User as UserIcon, Edit, Loader2, ChevronsRight, ChevronsLeft, Users, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// --- Tab Components ---
import UpcomingEventsTab from "@/components/profile-tabs/UpcomingEventsTab";
import PastEventsTab from "@/components/profile-tabs/PastEventsTab";
import SubmitHoursTab from '@/components/profile-tabs/SubmitHoursTab';
import CreateEventTab from "@/components/admin/CreateEventTab";
import RecordHoursTab from "@/components/admin/TeamManagementTab";
import ReportsTab from "@/components/admin/ReportsTab";
import GalleryUploadTab from "@/components/admin/GalleryUploadTab";
import ContactMessagesTab from "@/components/admin/ContactMessagesTab";

// --- Hooks & Types ---
import { useAuth } from "@/context/AuthContext";
import { useUserProfileData } from "@/hooks/useUserProfileData";
import type { Profile } from "@/hooks/useProfile";
import type { Registration } from "@/hooks/useUserRegistrations";
import EditAvatarDialog from "@/components/EditAvatarDialog";

// --- Helper Functions ---
const getInitials = (name: string): string => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRoleLabel = (profile: Profile | undefined, team: { name: string; role_in_team: string; } | null | undefined): string => {
  if (!profile) return 'عضو';
  if (profile.club_role === 'club_leader') return 'قائد النادي';
  if (profile.club_role === 'club_deputy') return 'نائب قائد النادي';
  if (profile.club_role === 'club_supervisor') return 'مشرف النادي';

  if (team) {
    if (team?.role_in_team === 'leader') {
      return `قائد فريق ${team.name}`;
    }
    if (team.role_in_team === 'member') {
      return `عضو فريق ${team.name}`;
    }
  }
  
  return 'عضو';
};

// --- Main Page Component ---
export default function ProfilePage() {
  const router = useRouter();
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading: isDataLoading, isError, refetch } = useUserProfileData();
 
  const profile = data?.profile;
  const registrations = data?.registrations || [];
  const eventHours = data?.eventHours || 0;
  const extraHours = data?.extraHours || 0;
  
  const isLoading = isAuthLoading || isDataLoading;

  const shouldShowJoinTeamButton = !isLoading && data && !data.team && profile?.club_role === 'member';

  const [activeTab, setActiveTab] = useState('upcoming');
  const [isProfileVisible, setProfileVisible] = useState(true);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 1024 });

  useEffect(() => { setProfileVisible(!isMobile); }, [isMobile]);
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  const { upcomingRegistrations, pastRegistrations } = useMemo(() => {
    const now = new Date();
    const upcoming: Registration[] = [];
    const past: Registration[] = [];
    
    registrations.forEach(reg => {
      if (reg.events && new Date(reg.events.start_time) >= now) {
        upcoming.push(reg);
      } else if (reg.events) {
        past.push(reg);
      }
    });
    
    return { upcomingRegistrations: upcoming, pastRegistrations: past };
  }, [registrations]);

  const allTabs = useMemo(() => [
    { id: 'upcoming', label: 'الفعاليات القادمة', component: <UpcomingEventsTab registrations={upcomingRegistrations} isLoading={isLoading} />, permissionGroup: 'general' },
    { id: 'past', label: 'سجل النشاط', component: <PastEventsTab registrations={pastRegistrations} eventHours={eventHours} extraHours={extraHours} isLoading={isLoading} />, permissionGroup: 'general' },
    { id: 'submit_hours', label: 'طلب ساعات إضافية', component: <SubmitHoursTab />, permissionGroup: 'general' },
    { id: 'team_management', label: '👥 إدارة الفريق', component: <RecordHoursTab />, permissionGroup: 'team_leadership' },
    { id: 'create_event', label: '➕ إنشاء فعالية', component: <CreateEventTab />, permissionGroup: 'club_leadership' },
    { id: 'upload_photos', label: '📷 رفع صور للمعرض', component: <GalleryUploadTab />, permissionGroup: 'club_leadership' },
    { id: 'view_contact_messages', label: '📨 رسائل التواصل', component: <ContactMessagesTab />, permissionGroup: 'club_leadership' },
    { id: 'reports', label: '📊 رفع التقارير', component: <ReportsTab />, permissionGroup: 'club_leadership' },
  ], [upcomingRegistrations, pastRegistrations, eventHours, extraHours, isLoading]);

  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      if (!profile) return false;
      if (tab.permissionGroup === 'general') return true;

      const isClubLeader = ['club_leader', 'club_deputy', 'club_supervisor'].includes(profile.club_role as string);
      const isTeamLeader = data?.team?.role_in_team === 'leader';
      
      if (isClubLeader) {
        return tab.permissionGroup === 'club_leadership' || tab.permissionGroup === 'team_leadership';
      }
      if (isTeamLeader) {
        return tab.permissionGroup === 'team_leadership';
      }
      return false;
    });
  }, [profile, data?.team, allTabs]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        {/* Updated loader color to primary */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4 bg-background">
        <p className="mb-4 text-lg text-foreground">لم نتمكن من العثور على ملفك الشخصي.</p>
        <p className="text-sm text-muted-foreground mb-6">قد يكون السبب أنك لم تكمل عملية التسجيل بعد.</p>
        <Link href="/complete-profile">
            <Button>إكمال الملف الشخصي الآن</Button>
        </Link>
        <Button variant="link" className="mt-4" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
          تسجيل الخروج والمحاولة مرة أخرى
        </Button>
      </div>
    );
  }
  
  return (
    // Updated background color to use theme variable
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Updated "Join Team" alert to use theme colors with enhanced spring animation */}
        {shouldShowJoinTeamButton && (
          <motion.div 
            initial={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { 
                type: "spring",
                stiffness: 400,
                damping: 20
              }
            }}
            className="mb-6 bg-accent border-l-4 border-secondary text-accent-foreground p-4 rounded-md shadow-lg" 
            role="alert"
          >
            <div className="flex">
              <div className="py-1">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <AlertTriangle className="h-6 w-6 text-secondary mr-4"/>
                </motion.div>
              </div>
              <div>
                <p className="font-bold">أنت لست عضوًا في أي فريق بعد!</p>
                <p className="text-sm">
                  استكشف الفرق المتاحة واختر ما يناسبك لتتمكن من المشاركة الكاملة في أنشطة النادي.
                  <Link href="/teams" className="font-semibold underline ml-2 hover:text-secondary transition-colors">
                      اذهب لصفحة الفرق
                  </Link>
                </p>
              </div>
            </div>
         </motion.div>
        )}
        
        {/* Mobile Profile Card */}
        {isMobile && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <Card className="shadow-sm bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center space-x-4 pb-4 rtl:space-x-reverse">
                <div className="relative group">
                  <Avatar className="h-16 w-16 border-2 border-secondary/50">
                    <AvatarImage className="object-cover" src={profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name}`} alt={profile.full_name || ''} />
                    <AvatarFallback>{getInitials(profile.full_name || '')}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => setAvatarDialogOpen(true)} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Edit className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                  <CardDescription><Badge variant="secondary" className="mt-1">{getRoleLabel(profile, data?.team)}</Badge></CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Separator />
                <div className="space-y-4 pt-4 text-sm text-muted-foreground">
                  {/* Updated icons to use secondary color */}
                  <div className="flex items-center"><UserIcon className="h-4 w-4 ml-3 text-secondary" /><span>{profile.student_id}</span></div>
                  <div className="flex items-center"><School className="h-4 w-4 ml-3 text-secondary" /><span>{profile.major}, {profile.college}</span></div>
                  <div className="flex items-center"><Mail className="h-4 w-4 ml-3 text-secondary" /><span>{user?.email}</span></div>
                  <div className="flex items-center"><Phone className="h-4 w-4 ml-3 text-secondary" /><span>{profile.phone_number}</span></div>
                  {profile.club_role !== 'club_supervisor' && (<div className="flex items-center"><Clock className="h-4 w-4 ml-3 text-secondary" /><span>مجموع الساعات: {(eventHours + extraHours).toFixed(1)} ساعة</span></div>)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          className="flex w-full gap-8 items-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Desktop Profile Card */}
          {!isMobile && (
             <AnimatePresence>
                {isProfileVisible && (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, x: 80, scale: 0.95 }} 
                      animate={{ opacity: 1, x: 0, scale: 1 }} 
                      exit={{ opacity: 0, x: 80, scale: 0.95 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 150, 
                        damping: 25,
                        duration: 0.6
                      }} 
                      className="hidden lg:block flex-shrink-0 w-1/3"
                    >
                        <Card className="shadow-sm w-full sticky top-24 bg-card text-card-foreground">
                            <CardHeader className="flex flex-row items-center space-x-4 pb-4 rtl:space-x-reverse">
                                <div className="relative group">
                                  <Avatar className="h-16 w-16 border-2 border-secondary/50">
                                    <AvatarImage className="object-cover" src={profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name}`} alt={profile.full_name || ''} />
                                    <AvatarFallback>{getInitials(profile.full_name || '')}</AvatarFallback>
                                  </Avatar>
                                  <button onClick={() => setAvatarDialogOpen(true)} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Edit className="h-6 w-6 text-white" />
                                  </button>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                                    <CardDescription><Badge variant="secondary" className="mt-1">{getRoleLabel(profile, data?.team)}</Badge></CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Separator />
                                <div className="space-y-4 pt-4 text-sm text-muted-foreground">
                                    {/* Updated icons to use secondary color */}
                                    <div className="flex items-center"><UserIcon className="h-4 w-4 ml-3 text-secondary" /><span>{profile.student_id}</span></div>
                                    <div className="flex items-center"><School className="h-4 w-4 ml-3 text-secondary" /><span>{profile.major}, {profile.college}</span></div>
                                    <div className="flex items-center"><Mail className="h-4 w-4 ml-3 text-secondary" /><span>{user?.email}</span></div>
                                    <div className="flex items-center"><Phone className="h-4 w-4 ml-3 text-secondary" /><span>{profile.phone_number}</span></div>
                                    {profile.club_role !== 'club_supervisor' && (<div className="flex items-center"><Clock className="h-4 w-4 ml-3 text-secondary" /><span>مجموع الساعات: {(eventHours + extraHours).toFixed(1)} ساعة</span></div>)}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
             </AnimatePresence>
          )}

          <motion.div 
            layout 
            transition={{ 
              duration: 0.5, 
              type: "spring", 
              stiffness: 100, 
              damping: 20 
            }} 
            className={`flex-grow ${!isProfileVisible ? 'w-full' : 'lg:w-2/3'}`}
          >
            <div className="flex items-center mb-6">
                {!isMobile && (
                    <motion.button 
                      onClick={() => setProfileVisible(!isProfileVisible)} 
                      className="group relative flex items-center justify-center h-10 w-10 rounded-lg bg-card border hover:bg-muted mr-2 flex-shrink-0"
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                    >
                        <motion.div 
                          initial={false} 
                          animate={{ rotate: isProfileVisible ? 0 : 180 }}
                          transition={{ 
                            duration: 0.4, 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 15 
                          }}
                        >
                            {isProfileVisible ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
                        </motion.div>
                    </motion.button>
                )}

                {/* Updated Tabs container to use theme colors */}
                <motion.div 
                  className="flex-grow border bg-muted rounded-xl p-1 overflow-x-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <motion.div 
                      className="flex items-center justify-start" 
                      style={{ gap: '4px' }}
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.1
                          }
                        }
                      }}
                    >
                        {visibleTabs.map((tab, index) => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${visibleTabs.length <= 4 ? 'flex-1' : 'flex-shrink-0'} ${activeTab === tab.id ? '' : 'text-muted-foreground hover:text-foreground'}`}
                                variants={{
                                  hidden: { opacity: 0, y: 20, scale: 0.9 },
                                  visible: { 
                                    opacity: 1, 
                                    y: 0, 
                                    scale: 1,
                                    transition: {
                                      type: "spring",
                                      stiffness: 200,
                                      damping: 20
                                    }
                                  }
                                }}
                                whileHover={{ 
                                  scale: 1.02,
                                  y: -2,
                                  transition: { 
                                    duration: 0.2,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15
                                  }
                                }}
                                whileTap={{ 
                                  scale: 0.98,
                                  y: 0,
                                  transition: { 
                                    duration: 0.1,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20
                                  }
                                }}
                            >
                                {activeTab === tab.id && (
                                    // Updated active tab pill to use primary color
                                    <motion.div 
                                      layoutId="active-profile-pill" 
                                      className="absolute inset-0 bg-primary rounded-lg"
                                      transition={{ 
                                        type: "spring", 
                                        stiffness: 400, 
                                        damping: 25,
                                        duration: 0.5
                                      }} 
                                    />
                                )}
                                <span className={`relative z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-primary-foreground' : ''}`}>{tab.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab} 
                initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -20, scale: 0.98 }} 
                transition={{ 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 150,
                  damping: 20
                }}
              >
                {visibleTabs.find(tab => tab.id === activeTab)?.component}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      <EditAvatarDialog 
        profile={profile}
        isOpen={isAvatarDialogOpen}
        setIsOpen={setAvatarDialogOpen}
      />
    </div>
  );
}
