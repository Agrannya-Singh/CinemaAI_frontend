# CinemaAI Backend API Documentation

This document outlines how the frontend application interacts with the CinemaAI backend API. All requests from the client are proxied through Next.js API routes to avoid CORS issues.

The base URL for the backend API is `https://cinemaai-backend.onrender.com`.

---

## 1. Fetch All Movies

- **Frontend Route:** `GET /api/movies`
- **Backend Endpoint:** `GET /movies`
- **Description:** Retrieves a list of all available movies to display on the initial page load.
- **Request:** No request body or parameters.
- **Response Body:** An array of movie objects.

**Example Movie Object:**
```json
{
  "id": "tt0111161",
  "title": "The Shawshank Redemption",
  "overview": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
  "genres": "Drama",
  "cast": "Tim Robbins, Morgan Freeman, Bob Gunton",
  "poster_path": "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
  "vote_average": 9.3,
  "release_date": "1994"
}
```

---

## 2. Search for Movies

- **Frontend Route:** `GET /api/search/[identifier]`
- **Backend Endpoint:** `GET /search/{identifier}`
- **Description:** Searches for movies by title or IMDb ID.
- **URL Parameter:**
  - `identifier` (string): The movie title or IMDb ID to search for.
- **Response Body:** An array of movie objects matching the search query.

---

## 3. Get Movie Recommendations

- **Frontend Route:** `POST /api/recommend`
- **Backend Endpoint:** `POST /recommend`
- **Description:** Generates personalized movie recommendations based on a user's selections.
- **Request Body:**
```json
{
  "movie_ids": ["tt0111161", "tt0068646"],
  "num_recommendations": 10
}
```
  - `movie_ids` (array of strings): A list of IMDb IDs for the movies the user has selected.
  - `num_recommendations` (integer): The desired number of recommendations.
- **Response Body:** An array of recommended movie objects, with the same structure as in the `/movies` endpoint response.

---
