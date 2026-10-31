-- Better Auth two-factor authentication and persistent rate-limit storage.
alter table "user"
  add column if not exists "twoFactorEnabled" boolean not null default false;

create table if not exists "twoFactor" (
  "id" text primary key not null,
  "secret" text not null,
  "backupCodes" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "verified" boolean not null default true,
  "failedVerificationCount" integer not null default 0,
  "lockedUntil" timestamptz
);
create index if not exists "twoFactor_secret_idx" on "twoFactor" ("secret");
create index if not exists "twoFactor_userId_idx" on "twoFactor" ("userId");

create table if not exists "rateLimit" (
  "key" text primary key not null,
  "count" integer not null,
  "lastRequest" bigint not null
);
create index if not exists "rateLimit_lastRequest_idx" on "rateLimit" ("lastRequest");
