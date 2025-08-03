
'use client';

import Image from 'next/image';
import { Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Star, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MovieCardProps {
  movie: Movie;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function MovieCard({ movie, isSelected, onSelect }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const posterSrc = imageError || !movie.poster || !isValidUrl(movie.poster) ? 'https://placehold.co/300x450.png' : movie.poster;

  return (
    <Card
      onClick={() => onSelect(movie.id)}
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
            data-ai-hint={movie.posterHint}
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {isSelected ? (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
               <PlusCircle className="h-12 w-12 text-white/80" />
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-white font-bold text-base truncate shadow-black [text-shadow:_1px_1px_2px_var(--tw-shadow-color)]">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-white/80 mt-1">
                <p>{movie.year}</p>
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
