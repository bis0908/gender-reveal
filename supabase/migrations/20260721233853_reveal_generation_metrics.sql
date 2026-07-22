create table public.reveal_generation_events (
  event_id uuid primary key,
  occurred_at timestamptz not null default pg_catalog.now(),
  creation_mode text not null,
  country_code text,
  baby_count smallint not null,
  animation_type text not null,
  device_platform text not null,
  due_month date,

  constraint reveal_generation_events_creation_mode_check
    check (creation_mode in ('instant', 'dday')),
  constraint reveal_generation_events_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint reveal_generation_events_baby_count_check
    check (baby_count >= 1),
  constraint reveal_generation_events_animation_type_check
    check (
      animation_type in (
        'confetti',
        'balloons',
        'fireworks',
        'falling',
        'reveal',
        'lootbox',
        'balloonpop',
        'scratch'
      )
    ),
  constraint reveal_generation_events_device_platform_check
    check (device_platform in ('ios', 'android', 'other', 'unknown')),
  constraint reveal_generation_events_due_month_check
    check (due_month is null or extract(day from due_month) = 1)
);

create index reveal_generation_events_occurred_at_idx
  on public.reveal_generation_events (occurred_at desc);

alter table public.reveal_generation_events enable row level security;

revoke all privileges on table public.reveal_generation_events
  from public, anon, authenticated, service_role;

grant select, insert, delete on table public.reveal_generation_events
  to service_role;

create function public.get_reveal_generation_metrics(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_from_kst timestamp without time zone;
  v_to_kst timestamp without time zone;
begin
  if p_from is null or p_to is null then
    raise exception '집계 기간은 null일 수 없습니다.'
      using errcode = '22004';
  end if;

  if p_from >= p_to then
    raise exception '집계 시작 시각은 종료 시각보다 빨라야 합니다.'
      using errcode = '22023';
  end if;

  v_from_kst := p_from at time zone 'Asia/Seoul';
  v_to_kst := p_to at time zone 'Asia/Seoul';

  if v_to_kst > v_from_kst + interval '24 months' then
    raise exception '집계 기간은 최대 24개월입니다.'
      using errcode = '22023';
  end if;

  return (
    with filtered_events as (
      select
        creation_mode,
        country_code,
        baby_count,
        animation_type,
        device_platform,
        due_month,
        (occurred_at at time zone 'Asia/Seoul')::date as occurred_date_kst
      from public.reveal_generation_events
      where occurred_at >= (v_from_kst at time zone 'Asia/Seoul')
        and occurred_at < (v_to_kst at time zone 'Asia/Seoul')
    ),
    daily_counts as (
      select
        occurred_date_kst as date_key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      group by occurred_date_kst
    ),
    creation_mode_counts as (
      select
        creation_mode as key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      group by creation_mode
    ),
    country_counts as (
      select
        country_code as key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      where country_code is not null
      group by country_code
    ),
    eligible_country_counts as (
      select
        key,
        event_count
      from country_counts
      where event_count >= 10
    ),
    ranked_country_counts as (
      select
        key,
        event_count,
        pg_catalog.row_number() over (
          order by event_count desc, key asc
        ) as country_rank
      from eligible_country_counts
    ),
    country_result as (
      select
        key,
        event_count,
        country_rank as sort_order
      from ranked_country_counts
      where country_rank <= 10

      union all

      select
        'other'::text as key,
        pg_catalog.sum(event_count)::bigint as event_count,
        11::bigint as sort_order
      from country_counts
      where not exists (
        select 1
        from ranked_country_counts as top_country
        where top_country.country_rank <= 10
          and top_country.key = country_counts.key
      )
      having pg_catalog.sum(event_count) >= 10
    ),
    baby_count_counts as (
      select
        baby_count as key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      group by baby_count
    ),
    animation_counts as (
      select
        animation_type as key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      group by animation_type
    ),
    device_counts as (
      select
        device_platform as key,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      group by device_platform
    ),
    due_month_counts as (
      select
        due_month,
        pg_catalog.count(*)::bigint as event_count
      from filtered_events
      where due_month is not null
      group by due_month
    )
    select pg_catalog.jsonb_build_object(
      'period',
      pg_catalog.jsonb_build_object(
        'from',
        pg_catalog.to_char(
          v_from_kst,
          'YYYY-MM-DD"T"HH24:MI:SS.US'
        ) || '+09:00',
        'to',
        pg_catalog.to_char(
          v_to_kst,
          'YYYY-MM-DD"T"HH24:MI:SS.US'
        ) || '+09:00'
      ),
      'total',
      (
        select pg_catalog.count(*)::bigint
        from filtered_events
      ),
      'daily',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'date',
              pg_catalog.to_char(date_key, 'YYYY-MM-DD'),
              'count',
              event_count
            )
            order by date_key
          )
          from daily_counts
        ),
        '[]'::jsonb
      ),
      'byCreationMode',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object('key', key, 'count', event_count)
            order by key
          )
          from creation_mode_counts
        ),
        '[]'::jsonb
      ),
      'byCountry',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object('key', key, 'count', event_count)
            order by sort_order
          )
          from country_result
        ),
        '[]'::jsonb
      ),
      'byBabyCount',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object('key', key, 'count', event_count)
            order by key
          )
          from baby_count_counts
        ),
        '[]'::jsonb
      ),
      'byAnimation',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object('key', key, 'count', event_count)
            order by key
          )
          from animation_counts
        ),
        '[]'::jsonb
      ),
      'byDevice',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object('key', key, 'count', event_count)
            order by key
          )
          from device_counts
        ),
        '[]'::jsonb
      ),
      'byDueMonth',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'month',
              pg_catalog.to_char(due_month, 'YYYY-MM'),
              'count',
              event_count
            )
            order by due_month
          )
          from due_month_counts
        ),
        '[]'::jsonb
      )
    )
  );
end;
$function$;

revoke all privileges on function public.get_reveal_generation_metrics(
  timestamptz,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.get_reveal_generation_metrics(
  timestamptz,
  timestamptz
) to service_role;

create extension if not exists pg_cron;

create procedure public.purge_reveal_generation_events()
language plpgsql
security invoker
set search_path = ''
as $procedure$
declare
  v_deleted integer := 0;
  v_total_deleted bigint := 0;
begin
  loop
    with expired_events as (
      select event_id
      from public.reveal_generation_events
      where occurred_at < pg_catalog.now() - interval '24 months'
      order by occurred_at asc, event_id asc
      limit 10000
    )
    delete from public.reveal_generation_events as events
    using expired_events
    where events.event_id = expired_events.event_id;

    get diagnostics v_deleted = row_count;
    v_total_deleted := v_total_deleted + v_deleted;
    exit when v_deleted = 0;
  end loop;

  raise log 'metrics_retention_deleted_count=%', v_total_deleted;
end;
$procedure$;

revoke all privileges on procedure public.purge_reveal_generation_events()
  from public, anon, authenticated;

grant execute on procedure public.purge_reveal_generation_events()
  to service_role;

do $cron_guard$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'purge_reveal_generation_events_monthly'
  ) then
    raise exception '동일한 메트릭 보존 작업이 이미 존재합니다.'
      using errcode = '42710';
  end if;
end;
$cron_guard$;

select cron.schedule(
  'purge_reveal_generation_events_monthly',
  '15 18 1 * *',
  'call public.purge_reveal_generation_events()'
);
