alter table public.todos
  add column if not exists category text;
