alter table maintenance_records
  add column if not exists cost_tenge integer not null default 0
    check (cost_tenge >= 0);
