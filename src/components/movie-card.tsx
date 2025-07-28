'use client';

import Image from 'next/image';
import { Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Star } from 'lucide-react';
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
           <div className="absolute top-0 right-0 bg-black/60 text-white p-1 m-1 rounded-md text-xs flex items-center">
             <Star className="w-3 h-3 text-yellow-400 mr-1" />
             <span>{movie.rating.toFixed(1)}</span>
           </div>
          {isSelected && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-all duration-300 group-hover:bg-gradient-to-t group-hover:from-black/95 group-hover:h-full">
            <div className="flex flex-col h-full justify-end">
                <h3 className="text-white font-bold text-sm truncate group-hover:whitespace-normal">
                {movie.title}
                </h3>
                <p className="text-xs text-gray-300">{movie.year}</p>

                <div className="mt-2 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 overflow-y-auto max-h-full">
                    <p className="font-bold">Cast:</p>
                    <p className="mb-2 italic">{movie.cast}</p>
                    <p className="font-bold">Summary:</p>
                    <p className="text-ellipsis">{movie.overview}</p>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
