'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import type { QueryData } from '@supabase/supabase-js';

// --- مكونات الواجهة ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Archive, Users, RefreshCw, User, Phone, FileText } from 'lucide-react';

// FIX 4: تحديث الاستعلام لجلب رقم الهاتف والمعلومات الإضافية
const clubLeaderQuery = supabase
  .from('extra_hours_requests')
  .select(`
    *,
    profiles!user_id (
      full_name,
      phone_number,
      team_members (
        teams ( id, name )
      )
    )
  `)
  .in('status', ['approved', 'rejected']);

// استنتاج النوع مباشرة من الاستعلام المحدث لضمان سلامة الأنواع
type ArchivedRequest = QueryData<typeof clubLeaderQuery>[0];

export default function ClubLeaderView() {
  const [archivedRequests, setArchivedRequests] = useState<ArchivedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchivedData = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await clubLeaderQuery;

    if (error) {
      toast.error('فشل في جلب الطلبات المؤرشفة.');
      console.error('Club Leader View Error:', error);
    } else {
      setArchivedRequests(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchArchivedData();
  }, [fetchArchivedData]);

  const requestsByTeam = useMemo(() => {
    return archivedRequests.reduce((acc, req) => {
      const teamName = req.profiles?.team_members?.[0]?.teams?.name || 'أعضاء بدون فريق';
      if (!acc[teamName]) {
        acc[teamName] = [];
      }
      acc[teamName].push(req);
      return acc;
    }, {} as Record<string, ArchivedRequest[]>);
  }, [archivedRequests]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
     <Card dir="rtl" className="max-w-5xl mx-auto">
      {/* FIX 3: تحسين تصميم الهيدر */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5"/>أرشيف طلبات الساعات</CardTitle>
          <CardDescription>عرض لجميع الطلبات التي تمت مراجعتها عبر كل الفرق.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchArchivedData} disabled={isLoading}>
          <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
          تحديث
        </Button>
      </CardHeader>
      <CardContent>
        {Object.keys(requestsByTeam).length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(requestsByTeam).map(([teamName, requests]) => (
              <AccordionItem key={teamName} value={teamName} className="border rounded-lg bg-background">
                <AccordionTrigger className="p-4 hover:no-underline font-semibold w-full text-right">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary"/>
                    <span>{teamName}</span>
                    <Badge variant="secondary">{requests.length} طلبات</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-0 pb-4">
                  {/* FIX 1 & 2: إعادة تصميم عرض الطلب */}
                  <div className="space-y-3 pt-2">
                    {requests.map(req => (
                      <div key={req.id} className="border bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                           <h4 className="font-semibold">{req.activity_title}</h4>
                           <Badge variant={req.status === 'approved' ? 'success' : 'destructive'}>
                            {req.status === 'approved' ? 'موافق عليه' : 'مرفوض'} {req.status === 'approved' ? `(${req.awarded_hours} س)`: ''}
                           </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{req.profiles?.full_name || 'مستخدم غير معروف'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{req.profiles?.phone_number || 'لا يوجد رقم هاتف'}</span>
                          </div>
                        </div>
                        <div className="text-sm pt-2">
                           <p className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                            <span>{req.task_description}</span>
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="mx-auto h-16 w-16" />
            <p className="mt-4 text-lg">لا توجد طلبات مؤرشفة.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
