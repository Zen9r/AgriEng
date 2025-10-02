'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { proxyClient, supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { cn } from '@/lib/utils';

// --- UI Components ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, AlertTriangle, CheckCircle, Loader2, Archive, ListChecks, FileText, Clock, User, Calendar, BarChart3, TrendingUp, Users, Award, Target, PieChart, Filter, Search, Eye, Edit3, Trash2, RefreshCw } from 'lucide-react';

// --- Types ---
type EventWithTimes = { id: number; title: string; start_time: string | null; end_time: string | null; hasReport?: boolean; };
type ParticipantProfile = { full_name: string; student_id: string; phone_number: string; };
type Participant = { role: 'attendee' | 'organizer'; status: 'attended' | 'absent' | 'registered'; profiles: ParticipantProfile; };
type ReportNotesForm = { notes: string; };
type ReportDetails = { notes: string | null; created_at: string; uploaded_by: string; uploader_name?: string; };

// --- Helper Functions ---
const calculateDuration = (start: string | null, end: string | null): string => {
    if (!start || !end) return '0.0';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diffMs) || diffMs < 0) return '0.0';
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
};

// مكون إحصائيات سريعة
function QuickStats({ events, participants }: { events: EventWithTimes[]; participants: Participant[] }) {
  const totalEvents = events.length;
  const completedReports = events.filter(e => e.hasReport).length;
  const pendingReports = totalEvents - completedReports;
  const totalParticipants = participants.length;
  const attendedCount = participants.filter(p => p.status === 'attended').length;
  const attendanceRate = totalParticipants > 0 ? ((attendedCount / totalParticipants) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">إجمالي الفعاليات</p>
            <p className="text-2xl font-bold">{totalEvents}</p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">التقارير المكتملة</p>
            <p className="text-2xl font-bold text-green-600">{completedReports}</p>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">بانتظار التوثيق</p>
            <p className="text-2xl font-bold text-orange-600">{pendingReports}</p>
          </div>
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">معدل الحضور</p>
            <p className="text-2xl font-bold text-purple-600">{attendanceRate}%</p>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}
const exportToCSV = (participants: Participant[], event: EventWithTimes) => {
  if (!participants || participants.length === 0) { toast.error('لا يوجد مشاركين لتصديرهم.'); return; }
  const headers = ['الاسم الكامل', 'الرقم الجامعي', 'رقم الهاتف', 'الدور', 'الحالة'];
  const rows = participants.map(p => {
    const profile = p.profiles;
    const name = `"${profile?.full_name?.replace(/"/g, '""') || '-'}"`;
    const studentId = `"${profile?.student_id || '-'}"`;
    const phone = `"${profile?.phone_number || '-'}"`;
    const role = p.role === 'organizer' ? '"منظم"' : '"حضور"';
    const status = p.status === 'attended' ? '"حاضر"' : p.status === 'absent' ? '"غائب"' : '"مسجل"';
    return [name, studentId, phone, role, status].join(',');
  });
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `report-${event.title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Details View Component ---
function EventDetailsView({ event, onReportSubmitted }: { event: EventWithTimes; onReportSubmitted: (eventId: number, newReportId: string) => void; }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reportDetails, setReportDetails] = useState<ReportDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ReportNotesForm>({
    defaultValues: { notes: '' }
  });
  const eventDuration = calculateDuration(event.start_time, event.end_time);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      
      // جلب المشاركين والتقرير في نفس الوقت
      const [participantsResult, reportResult] = await Promise.all([
        proxyClient
          .from('event_registrations')
          .select(`
            role,
            status,
            profiles!inner(full_name, student_id, phone_number)
          `)
          .eq('event_id', event.id),
        proxyClient
          .from('event_reports')
          .select('notes, created_at, uploaded_by')
          .eq('event_id', event.id)
          .single()
      ]);
      
      if (participantsResult.error) { 
        toast.error("فشل جلب قائمة الحضور."); 
        console.error("Participants Error:", participantsResult.error); 
      } else { 
        setParticipants(participantsResult.data as Participant[]); 
      }
      
      if (!reportResult.error && reportResult.data) {
        // جلب اسم الموثِّق
        const { data: uploaderProfile } = await proxyClient
          .from('profiles')
          .select('full_name')
          .eq('id', reportResult.data.uploaded_by)
          .single();
        
        setReportDetails({ 
          ...reportResult.data, 
          uploader_name: uploaderProfile?.full_name || undefined 
        });
      }
      
      setIsLoading(false);
    };
    fetchDetails();
  }, [event.id]);

  const onMarkAsReported: SubmitHandler<ReportNotesForm> = async (formData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const { data: report, error: reportError } = await proxyClient.from('event_reports').insert({ event_id: event.id, notes: formData.notes, uploaded_by: user.id }).select('id').single();
      if (reportError) throw reportError;
      // Note: We'll store the report_id in the event_reports table, not in events table
      // The relationship is maintained through event_id in event_reports
      toast.success('تم توثيق التقرير بنجاح!');
      onReportSubmitted(event.id, report.id);
    } catch (e: any) {
      toast.error(e.message || 'فشل توثيق التقرير.');
    }
  };

  return (
    <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg space-y-6">
      {/* معلومات الفعالية */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">معلومات الفعالية</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">تفاصيل الفعالية والإحصائيات</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-3 w-3"/>
              <span>المدة: {eventDuration} ساعة</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="h-3 w-3"/>
              <span>المشاركين: {participants.length}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Target className="h-3 w-3"/>
              <span>الحضور: {participants.filter(p => p.status === 'attended').length}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* قائمة الحضور */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">قائمة الحضور</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">تفاصيل المشاركين في الفعالية</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(participants, event)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4"/>
              تصدير CSV
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400"/>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="font-semibold">الاسم الكامل</TableHead>
                    <TableHead className="font-semibold">الرقم الجامعي</TableHead>
                    <TableHead className="font-semibold">رقم الهاتف</TableHead>
                    <TableHead className="font-semibold">الدور</TableHead>
                    <TableHead className="font-semibold">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p, i) => (
                    <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium">{p.profiles?.full_name || '-'}</TableCell>
                      <TableCell>{p.profiles?.student_id || '-'}</TableCell>
                      <TableCell>{p.profiles?.phone_number || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={p.role === 'organizer' ? 'default' : 'secondary'}>
                          {p.role === 'organizer' ? 'منظم' : 'حضور'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={p.status === 'attended' ? 'default' : p.status === 'absent' ? 'destructive' : 'outline'}
                          className={p.status === 'attended' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                        >
                          {p.status === 'attended' ? 'حاضر' : p.status === 'absent' ? 'غائب' : 'مسجل'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {/* قسم التوثيق */}
      {reportDetails ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">تم توثيق التقرير</h4>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-green-600"/>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <User className="h-4 w-4"/>
                <span className="font-medium">تم التوثيق بواسطة:</span>
                <span>{reportDetails.uploader_name || 'غير معروف'}</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Calendar className="h-4 w-4"/>
                <span className="font-medium">تاريخ التوثيق:</span>
                <span>{new Date(reportDetails.created_at).toLocaleString('ar-SA')}</span>
              </div>
              {reportDetails.notes && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">الملاحظات:</p>
                  <p className="text-gray-700 dark:text-gray-300">{reportDetails.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">تسجيل إنجاز التقرير</h4>
          </div>
          <form onSubmit={handleSubmit(onMarkAsReported)} className="space-y-4">
            <div>
              <label htmlFor={`notes-${event.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ملاحظات إضافية (اختياري)
              </label>
              <Textarea 
                id={`notes-${event.id}`} 
                {...register('notes')}
                placeholder="أضف أي ملاحظات مهمة حول الفعالية أو التقرير..."
                className="min-h-[100px] border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2"/>
                  جاري التوثيق...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ml-2"/>
                  توثيق التقرير
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- Main Tab Component ---
export default function ReportsTab() {
  const [events, setEvents] = useState<EventWithTimes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await proxyClient.from('events').select('id, title, start_time, end_time').order('end_time', { ascending: false });
      if (fetchError) throw fetchError;
      
      // جلب التقارير بطريقة محسنة
      const eventsWithReports = await Promise.all(
        (data || []).map(async (event: any) => {
          const { data: reportData } = await proxyClient
            .from('event_reports')
            .select('id')
            .eq('event_id', event.id)
            .single();
          return { ...event, hasReport: !!reportData };
        })
      );
      
      setEvents(eventsWithReports);
      
      // جلب المشاركين بطريقة محسنة - استعلام واحد لكل فعالية
      const allParticipantsData = await Promise.all(
        eventsWithReports.map(async (event) => {
          const { data: participantsData } = await proxyClient
            .from('event_registrations')
            .select(`
              role,
              status,
              profiles!inner(full_name, student_id, phone_number)
            `)
            .eq('event_id', event.id);
          return (participantsData as Participant[]) || [];
        })
      );
      
      setAllParticipants(allParticipantsData.flat());
    } catch (e: any) { setError("فشل جلب الفعاليات"); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  
  const handleReportSubmitted = (eventId: number, newReportId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, hasReport: true } : e));
  };

  // دوال التصفية والبحث
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending' && !event.hasReport) ||
      (filterStatus === 'completed' && event.hasReport);
    return matchesSearch && matchesFilter;
  });

  const now = new Date();
  const awaitingReport = filteredEvents.filter(e => !e.hasReport && e.end_time && new Date(e.end_time) < now);
  const archivedEvents = filteredEvents.filter(e => e.hasReport);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* الإحصائيات السريعة */}
      <QuickStats events={events} participants={allParticipants} />

      {/* البحث والتصفية */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">توثيق تقارير الفعاليات</CardTitle>
              <CardDescription className="text-base">متابعة وتوثيق تقارير الفعاليات المنتهية وتصدير بيانات الحضور</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchEvents}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
              تحديث
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* أدوات البحث والتصفية */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الفعاليات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفعاليات</SelectItem>
                <SelectItem value="pending">بانتظار التوثيق</SelectItem>
                <SelectItem value="completed">مكتملة التوثيق</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="awaiting">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="awaiting" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4"/>
                بانتظار التوثيق ({awaitingReport.length})
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4"/>
                الأرشيف ({archivedEvents.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="awaiting" className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400"/>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل الفعاليات...</p>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertTitle>خطأ في التحميل</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : awaitingReport.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertTriangle className="h-4 w-4 text-orange-500"/>
                    <span>يوجد {awaitingReport.length} فعالية بانتظار توثيق تقريرها</span>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {awaitingReport.map(e => (
                      <AccordionItem value={String(e.id)} key={e.id} className="border border-orange-200 dark:border-orange-800 rounded-lg">
                        <AccordionTrigger className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                          <div className="flex w-full justify-between items-center pr-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{e.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                انتهت في: {e.end_time ? new Date(e.end_time).toLocaleDateString('ar-SA') : 'تاريخ غير محدد'}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              <Clock className="h-3 w-3 ml-1"/>
                              بانتظار التوثيق
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0">
                          <EventDetailsView event={e} onReportSubmitted={handleReportSubmitted}/>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">ممتاز!</h3>
                  <p className="text-gray-500 dark:text-gray-500">لا توجد فعاليات بانتظار توثيق تقريرها</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="archive" className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400"/>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأرشيف...</p>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertTitle>خطأ في التحميل</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : archivedEvents.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-green-500"/>
                    <span>يوجد {archivedEvents.length} تقرير مكتمل التوثيق</span>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {archivedEvents.map(e => (
                      <AccordionItem value={String(e.id)} key={e.id} className="border border-green-200 dark:border-green-800 rounded-lg">
                        <AccordionTrigger className="px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20">
                          <div className="flex w-full justify-between items-center pr-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{e.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                انتهت في: {e.end_time ? new Date(e.end_time).toLocaleDateString('ar-SA') : 'تاريخ غير محدد'}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <FileText className="h-3 w-3 ml-1"/>
                              تم التوثيق
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0">
                          <EventDetailsView event={e} onReportSubmitted={handleReportSubmitted}/>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Archive className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">لا توجد تقارير في الأرشيف</h3>
                  <p className="text-gray-500 dark:text-gray-500">سيتم عرض التقارير المكتملة هنا</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
