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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">לקוחות וסיטונאות (B2B)</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          בקשות לפתיחת חשבון סיטונאי
        </h2>
        
        <div className="relative max-w-md mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="חיפוש חברה או אימייל..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-3 font-medium">תאריך</th>
                <th className="pb-3 font-medium">חברה</th>
                <th className="pb-3 font-medium">איש קשר</th>
                <th className="pb-3 font-medium">פרטי התקשרות</th>
                <th className="pb-3 font-medium">תעשייה</th>
                <th className="pb-3 font-medium">סטטוס</th>
                <th className="pb-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">טוען בקשות...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">לא נמצאו בקשות</td></tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="py-3 text-sm">{format(new Date(req.created_date), 'dd/MM/yyyy')}</td>
                    <td className="py-3 font-medium">{req.company_name}</td>
                    <td className="py-3">{req.contact_name}</td>
                    <td className="py-3 text-sm">
                      <div>{req.email}</div>
                      <div className="text-muted-foreground">{req.phone}</div>
                    </td>
                    <td className="py-3">{req.industry}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status === 'approved' ? 'אושר' : req.status === 'rejected' ? 'נדחה' : 'ממתין'}
                      </span>
                    </td>
                    <td className="py-3">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}>
                            <CheckCircle className="w-4 h-4 ml-1" /> אשר
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}>
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