begin;

-- 먼저 예약 작업을 해제하여 추가 보존 삭제를 중단한다.
do $rollback_cron$
declare
  v_job_id bigint;
begin
  if pg_catalog.to_regclass('cron.job') is null then
    raise notice 'cron 작업 테이블이 없어 예약 작업 해제를 건너뜁니다.';
  elsif pg_catalog.to_regprocedure('cron.unschedule(bigint)') is null then
    raise exception 'cron 작업 해제 함수를 찾을 수 없어 rollback을 중단합니다.';
  else
    for v_job_id in execute
      'select jobid from cron.job where jobname = $1'
      using 'purge_reveal_generation_events_monthly'
    loop
      execute 'select cron.unschedule($1)' using v_job_id;
    end loop;
  end if;
end;
$rollback_cron$;

drop procedure if exists public.purge_reveal_generation_events();
drop function if exists public.get_reveal_generation_metrics(
  timestamptz,
  timestamptz
);

do $rollback_table$
begin
  if pg_catalog.to_regclass('public.reveal_generation_events') is not null then
    execute 'revoke all privileges on table public.reveal_generation_events from service_role';
  end if;
end;
$rollback_table$;

commit;

-- 애플리케이션 기록 호출 제거는 해당 서비스 배포 rollback에서 수행한다.
-- 이벤트 테이블 삭제는 백업과 별도 사용자 승인을 받은 뒤에만 수행한다.
-- 다른 예약 작업이 사용할 수 있으므로 pg_cron 확장은 제거하지 않는다.
-- 재활성화는 보존 테이블을 채택하는 별도 forward migration으로 수행한다.
