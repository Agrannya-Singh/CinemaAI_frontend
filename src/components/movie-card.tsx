'use client';

import Image from 'next/image';
import { Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Star } from 'lucide-react';
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
  
  const posterSrc = imageError ? 'https://placehold.co/300x450.png' : movie.poster;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Card
            onClick={() => onSelect(movie.id)}
            className={cn(
              'cursor-pointer group overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 bg-transparent border-primary/20 flex flex-col',
              isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
            )}
          >
            <CardContent className="p-0 flex-grow flex flex-col">
              <div className="aspect-[2/3] relative w-full">
                <Image
                  src={posterSrc}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover"
                  data-ai-hint={movie.posterHint}
                  onError={handleImageError}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              <div className="p-2 flex-grow flex flex-col justify-between">
                  <div>
                      <h3 className="text-white font-bold text-sm truncate">
                          {movie.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{movie.year}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Star className="w-3 h-3 text-yellow-400 mr-1 flex-shrink-0" />
                      <span>{movie.rating.toFixed(1)}</span>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent
            side="bottom"
            align="center"
            className="max-w-[250px] bg-background border-primary/50 text-foreground"
        >
            <p className="font-bold text-primary/80">Cast:</p>
            <p className="mb-2 italic text-sm">{movie.cast}</p>
            <p className="font-bold text-primary/80">Summary:</p>
            <p className="text-sm text-ellipsis">{movie.overview}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
