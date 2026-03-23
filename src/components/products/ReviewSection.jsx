import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, Camera, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewSection({ productId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    title: '',
    content: '',
    photos: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId, status: 'approved' }, '-created_date'),
    initialData: [],
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.Review.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId]);
      setShowForm(false);
      setForm({ customer_name: '', customer_email: '', title: '', content: '', photos: [] });
      setRating(5);
      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({
      product_id: productId,
      rating,
      ...form,
      status: 'pending',
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    });
    const urls = await Promise.all(uploadPromises);
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="py-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl uppercase tracking-tight">Customer Reviews</h2>
        {!showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-6 bg-card border border-border rounded-lg">
          <div className="text-4xl font-heading font-bold mb-2">{avgRating}</div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-primary text-primary' : 'text-muted'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
        </div>

        <div className="md:col-span-2 space-y-2">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-12">{star} star</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="font-heading text-sm uppercase tracking-wider mb-4">Write Your Review</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating */}
                <div>
                  <Label>Your Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            i <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      value={form.customer_name}
                      onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.customer_email}
                      onChange={(e) => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Review Title</Label>
                  <Input
                    id="title"
                    required
                    placeholder="Sum up your experience"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Your Review</Label>
                  <Textarea
                    id="content"
                    required
                    rows={4}
                    placeholder="Tell us what you think..."
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <Label htmlFor="photos" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Add Photos (Optional)
                  </Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="mt-2"
                  />
                  {form.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {form.photos.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-md" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createReviewMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator className="my-6" />

      {/* Review list */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border border-border rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.customer_name}</span>
                    {review.verified_purchase && (
                      <span className="text-xs text-primary">✓ Verified Purchase</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_date).toLocaleDateString()}
                </span>
              </div>
              
              {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
              <p className="text-sm text-muted-foreground mb-3">{review.content}</p>

              {review.photos?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.photos.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-md" />
                  ))}
                </div>
              )}

              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Helpful ({review.helpful_count || 0})
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}