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
                        <img
                            src={posterSrc}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                        <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold truncate text-base mb-2 drop-shadow-md">{movie.title}</h3>
                            <div className="flex items-center justify-between text-xs text-white/90">
                                <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-yellow-50">
                                        {movie.score
                                            ? `${movie.score.toFixed(1)}/10`
                                            : (movie.release_date?.split('-')[0] || 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent>
                <div className="bg-zinc-900 text-white p-3 text-xs rounded-lg border border-zinc-800 shadow-xl max-w-[300px]">
                    <div className="font-bold mb-1 text-base">{movie.title}</div>
                    <p className="text-zinc-400 leading-relaxed line-clamp-6">
                        {movie.overview || "No description available."}
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
