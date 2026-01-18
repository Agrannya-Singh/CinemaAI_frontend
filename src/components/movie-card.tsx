import { Movie } from "@/lib/movies";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MovieCardProps {
    movie: Movie;
    isSelected: boolean;
    onSelect: (movie: Movie) => void;
}

export function MovieCard({ movie, isSelected, onSelect }: MovieCardProps) {
    const [imageError, setImageError] = useState(false);

    const posterSrc = imageError || !movie.poster_url
        ? 'https://placehold.co/300x450.png?text=No+Poster'
        : movie.poster_url;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card
                    onClick={() => onSelect(movie)}
                    className={cn(
                        "group relative overflow-hidden rounded-md border-0 bg-gray-900 cursor-pointer transition-all duration-300",
                        isSelected ? "ring-2 ring-purple-600 scale-105" : "hover:scale-105 hover:shadow-2xl"
                    )}
                >
                    <CardContent className="p-0 aspect-[2/3] relative">
                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100" />

                        <div className="absolute bottom-2 left-2 right-2">
                            <h3 className="text-white font-bold truncate text-sm">{movie.title}</h3>
                            <div className="flex items-center justify-between text-xs text-white/80 mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span>
                                        {movie.score
                                            ? `${(movie.score * 100).toFixed(0)}% Match`
                                            : (movie.release_date?.split('-')[0] || 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent>
                <div className="bg-black text-white p-2 text-xs rounded border border-gray-700">
                    {movie.title}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
