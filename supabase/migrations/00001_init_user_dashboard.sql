-- Create tables first
create table if not exists movies (
    id text primary key,
    title text not null,
    overview text,
    vote_average numeric(3,1),
    poster_path text,
    genre text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists user_movies (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    movie_id text references movies(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, movie_id)
);

-- Enable RLS (Row Level Security)
alter table movies enable row level security;
alter table user_movies enable row level security;
alter table user_preferences enable row level security;
alter table user_lists enable row level security;

-- Other tables
create table if not exists user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  preferred_genres text[] default '{}',
  dashboard_layout text default 'grid',
  theme text default 'light',
  notification_settings jsonb default '{"email": true, "push": false}'::jsonb,
  language text default 'en',
  unique(user_id)
);

create table if not exists user_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  is_public boolean default false,
  movies text[] default '{}',
  unique(user_id, name)
);

-- Add new columns to user_movies if they don't exist
alter table user_movies 
  add column if not exists rating smallint check (rating >= 0 and rating <= 10),
  add column if not exists notes text,
  add column if not exists is_favorite boolean default false,
  add column if not exists watched_at timestamp with time zone;

-- Create view for user movie details
create or replace view user_movie_details as
select 
  um.user_id,
  m.id as movie_id,
  m.title,
  m.overview,
  m.vote_average,
  m.poster_path,
  m.genre,
  um.rating as user_rating,
  um.notes,
  um.is_favorite,
  um.watched_at
from movies m
join user_movies um on m.id = um.movie_id;

-- RLS Policies

-- Movies table policies
create policy "Movies are viewable by everyone"
  on movies for select
  using (true);

-- User_movies policies
create policy "Users can insert their own movie selections"
  on user_movies for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own movie selections"
  on user_movies for select
  using (auth.uid() = user_id);

create policy "Users can update their own movie selections"
  on user_movies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own movie selections"
  on user_movies for delete
  using (auth.uid() = user_id);

-- User_preferences policies
create policy "Users can insert their own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

-- User_lists policies
create policy "Users can create their own lists"
  on user_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own lists and public lists"
  on user_lists for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can update their own lists"
  on user_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own lists"
  on user_lists for delete
  using (auth.uid() = user_id);