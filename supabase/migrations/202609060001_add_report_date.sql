alter table daily_items add column if not exists report_date date;

update daily_items
set report_date = (coalesce(published_at, created_at, now()) at time zone 'Asia/Shanghai')::date
where report_date is null;

alter table daily_items
  alter column report_date set default ((now() at time zone 'Asia/Shanghai')::date);

alter table daily_items
  alter column report_date set not null;

create index if not exists daily_items_report_date_score_idx
  on daily_items (report_date desc, score desc);

alter table curiosity_items add column if not exists report_date date;

update curiosity_items
set report_date = (created_at at time zone 'Asia/Shanghai')::date
where report_date is null;

alter table curiosity_items
  alter column report_date set default ((now() at time zone 'Asia/Shanghai')::date);

alter table curiosity_items
  alter column report_date set not null;

create index if not exists curiosity_items_report_date_idx
  on curiosity_items (report_date desc, difficulty asc);
