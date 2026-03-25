import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products-list']);
      toast({ title: "מוצר נמחק בהצלחה" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (data.id) {
        const { id, ...rest } = data;
        return base44.entities.Product.update(id, rest);
      }
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products-list']);
      setIsDialogOpen(false);
      setEditingProduct(null);
      toast({ title: "מוצר נשמר בהצלחה" });
    }
  });

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct({
      title: '', slug: '', price: 0, category: 'general', images: [], stock_level: 10
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      ...editingProduct,
      title: formData.get('title'),
      slug: formData.get('slug'),
      price: parseFloat(formData.get('price')),
      compare_at_price: parseFloat(formData.get('compare_at_price')) || undefined,
      category: formData.get('category'),
      stock_level: parseInt(formData.get('stock_level'), 10),
      images: formData.get('image') ? [formData.get('image')] : editingProduct?.images || []
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">ניהול מוצרים</h1>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> הוסף מוצר חדש</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative max-w-md mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="חיפוש מוצר..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-3 font-medium">תמונה</th>
                <th className="pb-3 font-medium">שם מוצר</th>
                <th className="pb-3 font-medium">מחיר</th>
                <th className="pb-3 font-medium">מלאי</th>
                <th className="pb-3 font-medium">קטגוריה</th>
                <th className="pb-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">טוען מוצרים...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">לא נמצאו מוצרים</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-12 h-12 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-medium">{product.title}</td>
                    <td className="py-3">₪{product.price}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.stock_level > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock_level} יח'
                      </span>
                    </td>
                    <td className="py-3">{product.category}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                          if (window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
                            deleteMutation.mutate(product.id);
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? 'עריכת מוצר' : 'מוצר חדש'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">שם המוצר</label>
                <Input name="title" defaultValue={editingProduct?.title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מזהה URL (Slug)</label>
                <Input name="slug" defaultValue={editingProduct?.slug} required dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מחיר (₪)</label>
                <Input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מחיר לפני הנחה (₪)</label>
                <Input name="compare_at_price" type="number" step="0.01" defaultValue={editingProduct?.compare_at_price} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">קטגוריה</label>
                <select name="category" defaultValue={editingProduct?.category} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="construction">בנייה ותעשייה</option>
                  <option value="lab">מעבדה ורפואה</option>
                  <option value="outdoor">שטח וספורט</option>
                  <option value="general">כללי</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מלאי</label>
                <Input name="stock_level" type="number" defaultValue={editingProduct?.stock_level} required />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">קישור לתמונה ראשית</label>
                <Input name="image" defaultValue={editingProduct?.images?.[0] || ''} dir="ltr" className="text-left" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'שומר...' : 'שמור מוצר'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}