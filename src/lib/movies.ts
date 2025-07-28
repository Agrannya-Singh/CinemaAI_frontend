export interface Movie {
  id: string;
  imdbID: string;
  title: string;
  year: string;
  genre: string;
  poster: string;
  posterHint: string;
}

const movies: Movie[] = [
  {
    id: '1',
    imdbID: 'tt0111161',
    title: 'The Shawshank Redemption',
    year: '1994',
    genre: 'Drama',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'prison drama'
  },
  {
    id: '2',
    imdbID: 'tt0068646',
    title: 'The Godfather',
    year: '1972',
    genre: 'Crime',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'mafia film'
  },
  {
    id: '3',
    imdbID: 'tt0468569',
    title: 'The Dark Knight',
    year: '2008',
    genre: 'Action',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'superhero movie'
  },
  {
    id: '4',
    imdbID: 'tt0108052',
    title: "Schindler's List",
    year: '1993',
    genre: 'Drama',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'historical film'
  },
  {
    id: '5',
    imdbID: 'tt0167260',
    title: 'The Lord of the Rings: The Return of the King',
    year: '2003',
    genre: 'Fantasy',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'fantasy battle'
  },
  {
    id: '6',
    imdbID: 'tt0110912',
    title: 'Pulp Fiction',
    year: '1994',
    genre: 'Crime',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'crime movie'
  },
  {
    id: '7',
    imdbID: 'tt1375666',
    title: 'Inception',
    year: '2010',
    genre: 'Sci-Fi',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'sci-fi thriller'
  },
  {
    id: '8',
    imdbID: 'tt0133093',
    title: 'The Matrix',
    year: '1999',
    genre: 'Sci-Fi',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'cyberpunk action'
  },
  {
    id: '9',
    imdbID: 'tt0109830',
    title: 'Forrest Gump',
    year: '1994',
    genre: 'Drama',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'man on bench'
  },
  {
    id: '10',
    imdbID: 'tt0080684',
    title: 'Star Wars: Episode V - The Empire Strikes Back',
    year: '1980',
    genre: 'Sci-Fi',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'space opera'
  },
  {
    id: '11',
    imdbID: 'tt0120737',
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    year: '2001',
    genre: 'Fantasy',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'fantasy adventure'
  },
  {
    id: '12',
    imdbID: 'tt0137523',
    title: 'Fight Club',
    year: '1999',
    genre: 'Drama',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'psychological thriller'
  },
  {
    id: '13',
    imdbID: 'tt0099685',
    title: 'Goodfellas',
    year: '1990',
    genre: 'Crime',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'gangster movie'
  },
  {
    id: '14',
    imdbID: 'tt0120815',
    title: 'Saving Private Ryan',
    year: '1998',
    genre: 'War',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'war film'
  },
  {
    id: '15',
    imdbID: 'tt0816692',
    title: 'Interstellar',
    year: '2014',
    genre: 'Sci-Fi',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'space exploration'
  },
    {
    id: '16',
    imdbID: 'tt0114369',
    title: 'Se7en',
    year: '1995',
    genre: 'Thriller',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'crime thriller'
  },
  {
    id: '17',
    imdbID: 'tt0102926',
    title: 'The Silence of the Lambs',
    year: '1991',
    genre: 'Thriller',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'psychological horror'
  },
  {
    id: '18',
    imdbID: 'tt6751668',
    title: 'Parasite',
    year: '2019',
    genre: 'Thriller',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'social thriller'
  },
  {
    id: '19',
    imdbID: 'tt0110413',
    title: 'Léon: The Professional',
    year: '1994',
    genre: 'Action',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'hitman drama'
  },
  {
    id: '20',
    imdbID: 'tt0120689',
    title: 'The Green Mile',
    year: '1999',
    genre: 'Fantasy',
    poster: 'https://placehold.co/300x450/4B0082/E6E6FA',
    posterHint: 'fantasy drama'
  },
];

export function getMovies(): Movie[] {
  return movies;
}

export function searchMovies(identifier: string): Movie[] {
  const lowerCaseIdentifier = identifier.toLowerCase();
  return movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(lowerCaseIdentifier) ||
      movie.imdbID.toLowerCase().includes(lowerCaseIdentifier)
  );
}

export function getMoviesByIds(ids: string[]): Movie[] {
  return movies.filter((movie) => ids.includes(movie.id));
}

export function getGenres(): string[] {
    const genres = new Set(movies.map(movie => movie.genre));
    return Array.from(genres).sort();
}
