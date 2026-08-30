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
                        "group relative overflow-hidden rounded-xl border border-white/10 bg-gray-900 cursor-pointer transition-all duration-500 ease-out",
                        isSelected
                            ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105"
                            : "hover:scale-105 hover:shadow-2xl hover:shadow-black/50"
                    )}
                >
                    <CardContent className="p-0 aspect-[2/3] relative">
                        <div 
                            className="absolute top-2 right-2 z-20" 
                            onClick={(e) => e.stopPropagation()} 
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <a
                                href={`https://www.imdb.com/title/${movie.id}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded shadow hover:bg-yellow-400 transition-colors block"
                            >
                                IMDb
                            </a>
                        </div>
                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
                            <h3 className="text-white font-bold truncate text-lg mb-1 drop-shadow-md">{movie.title}</h3>

                            {/* Description added to card face as requested */}
                            <p className="text-zinc-300 text-xs line-clamp-2 mb-3 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                {movie.overview || "No description available."}
                            </p>

                            <div className="flex items-center justify-between text-xs text-white/90">
                                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-yellow-50">
                                        {movie.score !== undefined
                                            ? (movie.score <= 1.0 
                                                ? `${(movie.score * 100).toFixed(0)}% Match` 
                                                : `${movie.score.toFixed(1)}/10`)
                                            : (movie.release_date?.split('-')[0] || 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent>
                <div className="bg-zinc-900 text-white p-2.5 text-xs rounded-lg border border-zinc-800 shadow-xl">
                    {/* Simplified tooltip just for title if needed, or remove completely if description is on card */}
                    {movie.title}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
