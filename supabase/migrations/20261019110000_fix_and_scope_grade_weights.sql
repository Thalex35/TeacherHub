with ranked_weights as (
  select
    id,
    row_number() over (
      partition by period_id, evaluation_type_id
      order by updated_at desc, created_at desc, id desc
    ) as row_number
  from public.grade_weights
)
delete from public.grade_weights as weights
using ranked_weights
where weights.id = ranked_weights.id
  and ranked_weights.row_number > 1;

alter table public.grade_weights
  drop constraint if exists grade_weights_unique;

create unique index if not exists grade_weights_period_evaluation_type_key
  on public.grade_weights (period_id, evaluation_type_id) nulls not distinct;
