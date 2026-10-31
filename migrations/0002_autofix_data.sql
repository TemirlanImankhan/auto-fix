create table if not exists cars (
  id serial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  brand text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  mileage integer not null check (mileage >= 0),
  engine_type text not null check (engine_type in ('petrol', 'diesel', 'hybrid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cars_user_created_idx on cars (user_id, created_at desc);

create table if not exists diagnoses (
  id serial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  car_id integer references cars (id) on delete set null,
  car_label text not null,
  input jsonb not null,
  result jsonb not null,
  model_version text not null default 'autofix-prototype-v1',
  created_at timestamptz not null default now()
);

create index if not exists diagnoses_user_created_idx on diagnoses (user_id, created_at desc);
create index if not exists diagnoses_car_idx on diagnoses (car_id);
