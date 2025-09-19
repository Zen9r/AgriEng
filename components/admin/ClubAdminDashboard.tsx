'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

// --- UI Components ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Archive, PlusCircle } from 'lucide-react';

// --- Imported Components ---
import ClubLeaderView from './ClubLeaderView';
import { ManualLogForm } from './TeamLeaderView';

// --- Types ---
interface ClubProfile {
  id: string;
  full_name: string;
}

interface ClubAdminDashboardProps {
  userId: string;
}

export default function ClubAdminDashboard({ userId }: ClubAdminDashboardProps) {
  const [clubMembers, setClubMembers] = useState<ClubProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('full_name', 'is', null)
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;
      setClubMembers(data || []);
    } catch (e: any) {
      setError("فشل في جلب قائمة أعضاء النادي");
      toast.error("فشل في جلب قائمة أعضاء النادي");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubMembers();
  }, []);

  const handleManualLogSuccess = () => {
    // Refresh the club members list if needed
    fetchClubMembers();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">{error}</p>
        <p className="text-sm">يرجى المحاولة مرة أخرى لاحقًا</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="archive" dir="rtl">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="archive">
          <Archive className="ml-2 h-4 w-4" />
          أرشيف الطلبات
        </TabsTrigger>
        <TabsTrigger value="manual">
          <PlusCircle className="ml-2 h-4 w-4" />
          تسجيل ساعات يدوي
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="archive" className="mt-6">
        <ClubLeaderView />
      </TabsContent>

      <TabsContent value="manual" className="mt-6">
        <ManualLogForm 
          members={clubMembers} 
          userId={userId} 
          onSuccess={handleManualLogSuccess}
        />
      </TabsContent>
    </Tabs>
  );
}
