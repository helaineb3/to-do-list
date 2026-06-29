alter table public.todos
  add column if not exists sort_order integer;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, day_date
      order by created_at
    ) as position
  from public.todos
)
update public.todos t
set sort_order = r.position
from ranked r
where t.id = r.id
  and t.sort_order is null;

alter table public.todos
  alter column sort_order set default 0;

update public.todos
set sort_order = 0
where sort_order is null;

alter table public.todos
  alter column sort_order set not null;
