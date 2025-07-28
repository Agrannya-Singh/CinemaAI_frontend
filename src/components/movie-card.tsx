'use client';

import Image from 'next/image';
import { Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

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
    <Card
      onClick={() => onSelect(movie.id)}
      className={cn(
        'cursor-pointer group overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in fade-in',
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      )}
    >
      <CardContent className="p-0">
        <div className="aspect-[2/3] relative">
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
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <h3 className="text-white font-bold text-sm truncate group-hover:whitespace-normal">
              {movie.title}
            </h3>
            <p className="text-xs text-gray-300">{movie.year}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
