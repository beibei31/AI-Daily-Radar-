update daily_items
set report_date = (created_at at time zone 'Asia/Shanghai')::date
where created_at is not null;
