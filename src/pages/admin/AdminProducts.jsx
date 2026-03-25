import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
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
    setDescription(product.description || '');
    setLongDescription(product.long_description || '');
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct({
      title: '', slug: '', price: 0, category: 'general', images: [], stock_level: 10, is_featured: false, is_bestseller: false
    });
    setDescription('');
    setLongDescription('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Parse multiple images separated by comma or newline
    const imagesRaw = formData.get('images') || '';
    const imagesArray = imagesRaw.split(/[\n,]+/).map(i => i.trim()).filter(i => i.length > 0);

    const data = {
      ...editingProduct,
      title: formData.get('title'),
      slug: formData.get('slug'),
      price: parseFloat(formData.get('price')),
      compare_at_price: parseFloat(formData.get('compare_at_price')) || undefined,
      category: formData.get('category'),
      stock_level: parseInt(formData.get('stock_level'), 10),
      images: imagesArray.length > 0 ? imagesArray : editingProduct?.images || [],
      description: description,
      long_description: longDescription,
      is_featured: formData.get('is_featured') === 'on',
      is_bestseller: formData.get('is_bestseller') === 'on'
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול מוצרים</h1>
          <p className="text-muted-foreground mt-1">נהל את הקטלוג, המלאי והמחירים של החנות.</p>
        </div>
        <Button onClick={handleCreate} className="rounded-full px-6 shadow-md hover:shadow-lg transition-all"><Plus className="w-4 h-4 mr-2" /> מוצר חדש</Button>
      </div>

      <div className="bg-background rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/10">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="חיפוש מוצר לפי שם או מזהה..." 
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
                <th className="px-6 py-4 font-medium">תמונה</th>
                <th className="px-6 py-4 font-medium">שם מוצר</th>
                <th className="px-6 py-4 font-medium">מחיר</th>
                <th className="px-6 py-4 font-medium">מלאי</th>
                <th className="px-6 py-4 font-medium">קטגוריה</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">טוען מוצרים...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">לא נמצאו מוצרים</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-14 h-14 rounded-xl object-cover border border-border/50 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center border border-border/50">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{product.title}</td>
                    <td className="px-6 py-4 font-mono text-sm">₪{product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock_level > 10 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {product.stock_level} יח'
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => {
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
              
              <div className="col-span-2 flex gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={editingProduct?.is_featured} className="w-4 h-4" />
                  <label htmlFor="is_featured" className="text-sm font-medium">מוצר מומלץ (Featured)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_bestseller" name="is_bestseller" defaultChecked={editingProduct?.is_bestseller} className="w-4 h-4" />
                  <label htmlFor="is_bestseller" className="text-sm font-medium">רב מכר (Bestseller)</label>
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">קישורים לתמונות (הפרד בפסיק או שורה חדשה)</label>
                <textarea 
                  name="images" 
                  defaultValue={editingProduct?.images?.join('\n') || ''} 
                  dir="ltr" 
                  className="w-full p-2 border border-input rounded-md text-left text-sm h-24 font-mono" 
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">תיאור קצר</label>
                <div className="bg-background rounded-md" dir="ltr">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-32 mb-12 text-right" />
                </div>
              </div>

              <div className="col-span-2 space-y-2 mt-8">
                <label className="text-sm font-medium">תיאור מלא (מופיע בעמוד המוצר)</label>
                <div className="bg-background rounded-md" dir="ltr">
                  <ReactQuill theme="snow" value={longDescription} onChange={setLongDescription} className="h-48 mb-12 text-right" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-8 border-t border-border">
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