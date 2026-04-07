-- Index to speed up filtering by event_type + created_at for dashboard queries
create index if not exists idx_analytics_events_type_created
  on analytics_events(event_type, created_at desc);
