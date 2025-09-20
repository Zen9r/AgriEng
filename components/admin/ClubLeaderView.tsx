'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import type { QueryData } from '@supabase/supabase-js';

// --- مكونات الواجهة ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Archive, Users, RefreshCw, User, Phone, FileText, Filter } from 'lucide-react';
import { getArabicPlural } from '@/lib/utils';

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
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

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

  const uniqueTeams = useMemo(() => {
    const teams = Object.keys(requestsByTeam);
    return ['all', ...teams];
  }, [requestsByTeam]);

  const filteredRequests = useMemo(() => {
    if (selectedTeam === 'all') {
      return archivedRequests;
    }
    return requestsByTeam[selectedTeam] || [];
  }, [archivedRequests, selectedTeam, requestsByTeam]);

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
        {archivedRequests.length > 0 ? (
          <div className="space-y-4">
            {/* Team Filter */}
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="اختر الفريق" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team === 'all' ? 'جميع الفرق' : team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="mr-auto">
                {getArabicPlural(filteredRequests.length, {
                  singular: 'طلب واحد',
                  dual: 'طلبان',
                  plural: 'طلبات',
                  accusative: 'طلبًا'
                })}
              </Badge>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم العضو</TableHead>
                    <TableHead className="text-right">الفريق</TableHead>
                    <TableHead className="text-right">عنوان النشاط</TableHead>
                    <TableHead className="text-right">الساعات الممنوحة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ المراجعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{req.profiles?.full_name || 'مستخدم غير معروف'}</div>
                            {req.profiles?.phone_number && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {req.profiles.phone_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {req.profiles?.team_members?.[0]?.teams?.name || 'بدون فريق'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{req.activity_title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{req.task_description}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {req.awarded_hours ? (
                          <Badge variant="outline" className="font-mono">
                            {req.awarded_hours} ساعة
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                          {req.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString('ar-SA') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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
