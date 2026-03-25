import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminBlog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-posts']);
      toast({ title: "פוסט נמחק" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (data.id) {
        const { id, ...rest } = data;
        return base44.entities.BlogPost.update(id, rest);
      }
      return base44.entities.BlogPost.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-posts']);
      setIsDialogOpen(false);
      setEditingPost(null);
      toast({ title: "פוסט נשמר בהצלחה" });
    }
  });

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPost({
      title: '', slug: '', excerpt: '', content: '', author: 'KROXIS Team', is_published: false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      ...editingPost,
      title: formData.get('title'),
      slug: formData.get('slug'),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      author: formData.get('author'),
      featured_image: formData.get('featured_image'),
      is_published: formData.get('is_published') === 'on',
      published_date: formData.get('is_published') === 'on' ? new Date().toISOString() : undefined
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ניהול בלוג</h1>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> פוסט חדש</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-3 font-medium">כותרת</th>
                <th className="pb-3 font-medium">מחבר</th>
                <th className="pb-3 font-medium">תאריך</th>
                <th className="pb-3 font-medium">סטטוס</th>
                <th className="pb-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">טוען פוסטים...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">לא נמצאו פוסטים בבלוג</td></tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium">{post.title}</td>
                    <td className="py-3 text-sm">{post.author}</td>
                    <td className="py-3 text-sm">{format(new Date(post.created_date), 'dd/MM/yyyy')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.is_published ? <><Globe className="w-3 h-3"/> פורסם</> : 'טיוטה'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                          if (window.confirm('למחוק את הפוסט?')) deleteMutation.mutate(post.id);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingPost?.id ? 'עריכת פוסט' : 'פוסט חדש'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">כותרת</label>
                <Input name="title" defaultValue={editingPost?.title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מזהה URL (Slug)</label>
                <Input name="slug" defaultValue={editingPost?.slug} required dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">מחבר</label>
                <Input name="author" defaultValue={editingPost?.author} required />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">תמונה ראשית (URL)</label>
                <Input name="featured_image" defaultValue={editingPost?.featured_image} dir="ltr" className="text-left" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">תקציר</label>
                <textarea name="excerpt" defaultValue={editingPost?.excerpt} required className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background resize-y" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">תוכן (Markdown נתמך)</label>
                <textarea name="content" defaultValue={editingPost?.content} required className="w-full min-h-[300px] p-3 rounded-md border border-input bg-background font-mono text-sm resize-y" dir="auto" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_published" name="is_published" defaultChecked={editingPost?.is_published} className="w-4 h-4" />
                <label htmlFor="is_published" className="text-sm font-medium">פרסם באתר (הסר סימון כדי לשמור כטיוטה)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'שומר...' : 'שמור פוסט'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}