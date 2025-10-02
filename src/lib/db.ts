import { Pool } from 'pg';

// Configure PostgreSQL pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Pool size
});

// Check for connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function queryDatabase(query: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Database operations
export async function getMovies() {
  return await queryDatabase('SELECT * FROM movies');
}

export async function searchMoviesInDb(query: string) {
  return await queryDatabase(
    'SELECT * FROM movies WHERE title ILIKE $1 OR overview ILIKE $1',
    [`%${query}%`]
  );
}

export async function getRecommendationsFromDb(movieId: string) {
  return await queryDatabase(
    'SELECT * FROM movie_recommendations WHERE movie_id = $1',
    [movieId]
  );
}