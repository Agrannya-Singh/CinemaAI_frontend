
'use client';

import Image from 'next/image';
import { Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MovieCardProps {
  movie: Movie;
  isSelected?: boolean;
  onSelect?: (movie: Movie) => void;
  showSaveButton?: boolean;
  inCollection?: boolean;
  onCollectionChange?: () => void;
}

export function MovieCard({ 
  movie, 
  isSelected = false, 
  onSelect, 
  showSaveButton = true,
  inCollection = false,
  onCollectionChange
}: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInCollection, setIsInCollection] = useState(inCollection);
  const { user } = useAuth();
  const supabase = createClient();

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle long poster URLs and provide fallback
  const getPosterUrl = (url: string | null) => {
    if (!url) return 'https://placehold.co/300x450.png';
    // If it's an IMDB/Amazon URL, it's likely valid
    if (url.includes('m.media-amazon.com')) return url;
    // For other URLs, verify they're not truncated
    if (url.length > 255) return 'https://placehold.co/300x450.png';
    return url;
  };

  const posterUrl = getPosterUrl(movie.poster_path);
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const posterSrc = imageError || !movie.poster_path || !isValidUrl(movie.poster_path) ? 'https://placehold.co/300x450.png' : posterUrl;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click when clicking the save button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect?.(movie);
  };

  const toggleSaveMovie = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save movies');
      return;
    }

    setIsSaving(true);
    try {
      if (!isInCollection) {
        // Add to collection
        const { error } = await supabase
          .from('user_movies')
          .insert({
            user_id: user.id,
            movie_id: movie.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        
        setIsInCollection(true);
        toast.success('Movie added to your collection');
      } else {
        // Remove from collection
        const { error } = await supabase
          .from('user_movies')
          .delete()
          .match({ user_id: user.id, movie_id: movie.id });

        if (error) throw error;

        setIsInCollection(false);
        toast.success('Movie removed from your collection');
      }

      onCollectionChange?.();
    } catch (error) {
      toast.error('Failed to update collection');
      console.error('Error updating collection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          onClick={handleCardClick}
          className={cn(
            'cursor-pointer group overflow-hidden relative transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 bg-card border-border',
            isSelected ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/50'
          )}
        >
          <CardContent className="p-0 flex-grow flex flex-col">
            <div className="aspect-[2/3] relative w-full">
              <Image
                src={posterSrc}
                alt={`${movie.title} poster`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={movie.title?.toLowerCase()}
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {showSaveButton && user && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:text-primary hover:bg-background/20"
                  onClick={toggleSaveMovie}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isInCollection ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              )}

              {isSelected && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              )}

              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-white font-bold text-base truncate shadow-black [text-shadow:_1px_1px_2px_var(--tw-shadow-color)]">
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-white/80 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-xs text-sm">
        <p className="font-bold text-base mb-2">{movie.title}</p>
        <p className="text-muted-foreground">{movie.overview}</p>
      </TooltipContent>
    </Tooltip>
  );
}
