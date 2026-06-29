-- user_id migration was recorded but column was never created (empty migration at push time)
alter table public.todos
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

drop policy if exists "Allow all access for now" on public.todos;
drop policy if exists "Allow public read access on todos" on public.todos;
drop policy if exists "Allow public insert access on todos" on public.todos;
drop policy if exists "Allow public update access on todos" on public.todos;
drop policy if exists "Allow public delete access on todos" on public.todos;

drop policy if exists "Users can read own todos" on public.todos;
drop policy if exists "Users can create own todos" on public.todos;
drop policy if exists "Users can update own todos" on public.todos;
drop policy if exists "Users can delete own todos" on public.todos;

create policy "Users can read own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can create own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on public.todos for update
  using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on public.todos for delete
  using (auth.uid() = user_id);
