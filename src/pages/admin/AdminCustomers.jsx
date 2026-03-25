import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: b2bRequests = [], isLoading } = useQuery({
    queryKey: ['admin-b2b-requests'],
    queryFn: () => base44.entities.WholesaleRequest.list('-created_date', 100),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.WholesaleRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-b2b-requests']);
      toast({ title: "סטטוס בקשה עודכן" });
    }
  });

  const filteredRequests = b2bRequests.filter(r => 
    r.company_name?.toLowerCase().includes(search.toLowerCase()) || 
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">לקוחות וסיטונאות (B2B)</h1>
        <p className="text-muted-foreground">נהל בקשות לפתיחת חשבון סיטונאי וצפה בלקוחות.</p>
      </div>

      <div className="bg-background rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            בקשות לפתיחת חשבון סיטונאי
          </h2>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="חיפוש חברה או אימייל..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-background border-border/50 rounded-xl h-11 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider bg-muted/5">
                <th className="px-6 py-4 font-medium">תאריך</th>
                <th className="px-6 py-4 font-medium">חברה</th>
                <th className="px-6 py-4 font-medium">איש קשר</th>
                <th className="px-6 py-4 font-medium">פרטי התקשרות</th>
                <th className="px-6 py-4 font-medium">תעשייה</th>
                <th className="px-6 py-4 font-medium">סטטוס</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">טוען בקשות...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">לא נמצאו בקשות</td></tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(req.created_date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{req.company_name}</td>
                    <td className="px-6 py-4 text-foreground">{req.contact_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-foreground">{req.email}</div>
                      <div className="text-muted-foreground mt-0.5">{req.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{req.industry}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === 'approved' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {req.status === 'approved' ? 'אושר' : req.status === 'rejected' ? 'נדחה' : 'ממתין'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-500/10" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}>
                            <CheckCircle className="w-4 h-4 ml-1" /> אשר
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}>
                            <XCircle className="w-4 h-4 ml-1" /> דחה
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}