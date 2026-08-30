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
                        "tron-card group relative overflow-hidden rounded-none border border-cyan-500/10 bg-black cursor-pointer transition-all duration-500 ease-out",
                        isSelected
                            ? "border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.03]"
                            : "hover:scale-[1.03] hover:border-cyan-500/30"
                    )}
                >
                    <CardContent className="p-0 aspect-[2/3] relative">
                        {/* IMDb Link */}
                        <div 
                            className="absolute top-2 right-2 z-20" 
                            onClick={(e) => e.stopPropagation()} 
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <a
                                href={`https://www.imdb.com/title/${movie.id}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-yellow-500/90 text-black text-[10px] font-mono font-bold px-1.5 py-0.5 shadow hover:bg-yellow-400 transition-colors block tracking-wider"
                            >
                                IMDb
                            </a>
                        </div>

                        {/* Selected indicator - corner accent */}
                        {isSelected && (
                            <svg className="absolute top-0 left-0 w-6 h-6 z-10 text-cyan-400" viewBox="0 0 24 24" fill="none">
                                <polyline points="0,12 0,0 12,0" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        )}

                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImageError(true)}
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-85" />

                        {/* Bottom info panel */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
                            <h3 className="text-white/90 font-mono font-semibold truncate text-sm mb-1 tracking-wide">{movie.title}</h3>

                            {/* Description on hover */}
                            <p className="text-cyan-100/50 text-[10px] font-mono line-clamp-2 mb-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                {movie.overview || "No description available."}
                            </p>

                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 border border-cyan-500/15 px-2 py-0.5 bg-black/50">
                                    <Star className="w-3 h-3 text-cyan-400 fill-cyan-400/50" />
                                    <span className="font-mono text-cyan-200/80 text-[10px]">
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
                <div className="bg-black text-cyan-100 p-2 text-[10px] font-mono border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    {movie.title}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
