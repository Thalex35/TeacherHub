alter table public.calendar_events
  add column ai_tool_call_id text;

alter table public.calendar_events
  add constraint calendar_events_ai_tool_call_id_length
  check (ai_tool_call_id is null or length(ai_tool_call_id) between 1 and 128);

alter table public.calendar_events
  add constraint calendar_events_owner_ai_tool_call_id_unique
  unique (owner_id, ai_tool_call_id);
