create unique index if not exists cars_id_user_unique_idx on cars (id, user_id);

create table if not exists maintenance_records (
  id serial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  car_id integer not null,
  service_type text not null check (service_type in ('oil', 'filters', 'brakes', 'tires', 'coolant', 'inspection', 'other')),
  service_date date not null,
  mileage integer not null check (mileage >= 0),
  notes text not null default '' check (char_length(notes) <= 1000),
  next_service_date date,
  next_service_mileage integer check (next_service_mileage is null or next_service_mileage >= mileage),
  created_at timestamptz not null default now(),
  constraint maintenance_car_owner_fk foreign key (car_id, user_id)
    references cars (id, user_id) on delete cascade
);

create index if not exists maintenance_user_date_idx on maintenance_records (user_id, service_date desc);
create index if not exists maintenance_car_date_idx on maintenance_records (car_id, service_date desc);
