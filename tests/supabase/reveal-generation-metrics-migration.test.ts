/** @jest-environment node */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const migrationFileName = "20260721233853_reveal_generation_metrics.sql";
const rollbackFileName =
  "20260721233853_reveal_generation_metrics.rollback.sql";
const migrationDirectory = path.join(process.cwd(), "supabase", "migrations");
const rollbackDirectory = path.join(process.cwd(), "supabase", "rollbacks");
const migrationPath = path.join(migrationDirectory, migrationFileName);
const rollbackPath = path.join(rollbackDirectory, rollbackFileName);

const readSqlIfPresent = (filePath: string) =>
  existsSync(filePath) ? readFileSync(filePath, "utf8") : "";

const listMetricsArtifacts = (directory: string) =>
  existsSync(directory)
    ? readdirSync(directory)
        .filter((fileName) => fileName.includes("reveal_generation_metrics"))
        .sort()
    : [];

describe("METRICS-DB-01 Supabase 마이그레이션", () => {
  const migrationSql = readSqlIfPresent(migrationPath);
  const rollbackSql = readSqlIfPresent(rollbackPath);

  test("Given: 메트릭 DB 설계, When: 산출물을 조회, Then: 단일 migration과 rollback이 존재", () => {
    // Given
    const expectedMigrationArtifacts = [migrationFileName];
    const expectedRollbackArtifacts = [rollbackFileName];

    // When
    const migrationArtifacts = listMetricsArtifacts(migrationDirectory);
    const rollbackArtifacts = listMetricsArtifacts(rollbackDirectory);

    // Then
    expect(migrationArtifacts).toEqual(expectedMigrationArtifacts);
    expect(rollbackArtifacts).toEqual(expectedRollbackArtifacts);
    expect(migrationSql).not.toHaveLength(0);
    expect(rollbackSql).not.toHaveLength(0);
  });

  test("Given: 이벤트 저장 계약, When: migration을 검사, Then: 컬럼·제약·인덱스가 설계와 일치", () => {
    // Given
    const requiredColumns = [
      /event_id\s+uuid\s+primary\s+key/i,
      /occurred_at\s+timestamptz\s+not\s+null\s+default\s+(?:pg_catalog\.)?now\(\)/i,
      /creation_mode\s+text\s+not\s+null/i,
      /country_code\s+text/i,
      /baby_count\s+smallint\s+not\s+null/i,
      /animation_type\s+text\s+not\s+null/i,
      /device_platform\s+text\s+not\s+null/i,
      /due_month\s+date/i,
    ];

    // When
    const tableDefinition = migrationSql.match(
      /create\s+table\s+public\.reveal_generation_events\s*\(([\s\S]*?)\);/i,
    )?.[1];

    // Then
    expect(tableDefinition).toBeDefined();
    for (const columnPattern of requiredColumns) {
      expect(tableDefinition).toMatch(columnPattern);
    }
    expect(tableDefinition).toMatch(
      /creation_mode\s+in\s*\(\s*'instant'\s*,\s*'dday'\s*\)/i,
    );
    expect(tableDefinition).toMatch(
      /country_code\s+is\s+null\s+or\s+country_code\s*~\s*'\^\[A-Z\]\{2\}\$'/i,
    );
    expect(tableDefinition).toMatch(/baby_count\s*>=\s*1/i);
    expect(tableDefinition).toMatch(
      /animation_type\s+in\s*\(\s*'confetti'\s*,\s*'balloons'\s*,\s*'fireworks'\s*,\s*'falling'\s*,\s*'reveal'\s*,\s*'lootbox'\s*,\s*'balloonpop'\s*,\s*'scratch'\s*\)/i,
    );
    expect(tableDefinition).toMatch(
      /device_platform\s+in\s*\(\s*'ios'\s*,\s*'android'\s*,\s*'other'\s*,\s*'unknown'\s*\)/i,
    );
    expect(tableDefinition).toMatch(
      /due_month\s+is\s+null\s+or\s+(?:pg_catalog\.)?extract\s*\(\s*day\s+from\s+due_month\s*\)\s*=\s*1/i,
    );
    expect(migrationSql).toMatch(
      /create\s+index\s+reveal_generation_events_occurred_at_idx\s+on\s+public\.reveal_generation_events\s*\(\s*occurred_at\s+desc\s*\)/i,
    );
  });

  test("Given: 브라우저 직접 접근 금지, When: 객체 권한을 검사, Then: RLS 기본 거부와 service_role 최소 권한만 부여", () => {
    // Given
    const untrustedRoles = /public\s*,\s*anon\s*,\s*authenticated/i;

    // When
    const accessSql = migrationSql;

    // Then
    expect(accessSql).toMatch(
      /alter\s+table\s+public\.reveal_generation_events\s+enable\s+row\s+level\s+security/i,
    );
    expect(accessSql).not.toMatch(/create\s+policy/i);
    expect(accessSql).toMatch(
      new RegExp(
        `revoke\\s+all(?:\\s+privileges)?\\s+on\\s+table\\s+public\\.reveal_generation_events\\s+from\\s+${untrustedRoles.source}`,
        "i",
      ),
    );
    expect(accessSql).toMatch(
      /revoke\s+all(?:\s+privileges)?\s+on\s+table\s+public\.reveal_generation_events\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role/i,
    );
    expect(accessSql).toMatch(
      /grant\s+select\s*,\s*insert\s*,\s*delete\s+on\s+table\s+public\.reveal_generation_events\s+to\s+service_role/i,
    );
  });

  test("Given: 유효한 관리자 집계 범위, When: 집계 함수를 검사, Then: SECURITY INVOKER·KST·24개월 계약을 유지", () => {
    // Given
    const requiredResponseKeys = [
      "period",
      "total",
      "daily",
      "byCreationMode",
      "byCountry",
      "byBabyCount",
      "byAnimation",
      "byDevice",
      "byDueMonth",
    ];

    // When
    const aggregateSql = migrationSql;

    // Then
    expect(aggregateSql).toMatch(
      /create\s+function\s+public\.get_reveal_generation_metrics\s*\(\s*p_from\s+timestamptz\s*,\s*p_to\s+timestamptz\s*\)/i,
    );
    expect(aggregateSql).toMatch(/stable\s+security\s+invoker/i);
    expect(aggregateSql).toMatch(/set\s+search_path\s*=\s*''/i);
    expect(aggregateSql).toMatch(/p_from\s+is\s+null\s+or\s+p_to\s+is\s+null/i);
    expect(aggregateSql).toMatch(/p_from\s*>=\s*p_to/i);
    expect(aggregateSql).toMatch(
      /v_to_kst\s*>\s*v_from_kst\s*\+\s*interval\s*'24 months'/i,
    );
    expect(
      aggregateSql.match(/'Asia\/Seoul'/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(4);
    expect(aggregateSql).toMatch(
      /occurred_at\s*>=\s*\(\s*v_from_kst\s+at\s+time\s+zone\s+'Asia\/Seoul'\s*\)/i,
    );
    expect(aggregateSql).toMatch(
      /occurred_at\s*<\s*\(\s*v_to_kst\s+at\s+time\s+zone\s+'Asia\/Seoul'\s*\)/i,
    );
    for (const responseKey of requiredResponseKeys) {
      expect(aggregateSql).toContain(`'${responseKey}'`);
    }
    expect(aggregateSql).toContain("'[]'::jsonb");
    expect(aggregateSql).toMatch(
      /revoke\s+all(?:\s+privileges)?\s+on\s+function\s+public\.get_reveal_generation_metrics\s*\(\s*timestamptz\s*,\s*timestamptz\s*\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i,
    );
    expect(aggregateSql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.get_reveal_generation_metrics\s*\(\s*timestamptz\s*,\s*timestamptz\s*\)\s+to\s+service_role/i,
    );
  });

  test("Given: 국가별 소규모 집단, When: 집계 함수를 검사, Then: 개별 저빈도 키를 숨기고 상위 10개와 안전한 other만 반환", () => {
    // Given
    const countryAggregationSql = migrationSql;

    // When
    const hasMinimumCohort =
      /eligible_country_counts\s+as[\s\S]*where\s+event_count\s*>=\s*10/i.test(
        countryAggregationSql,
      );
    const hasTopTen = /country_rank\s*<=\s*10/i.test(countryAggregationSql);
    const hasOtherBucket =
      /'other'[\s\S]*from\s+country_counts[\s\S]*not\s+exists[\s\S]*country_rank\s*<=\s*10[\s\S]*having\s+(?:pg_catalog\.)?sum\s*\(\s*event_count\s*\)\s*>=\s*10/i.test(
        countryAggregationSql,
      );

    // Then
    expect(hasMinimumCohort).toBe(true);
    expect(countryAggregationSql).toMatch(/row_number\s*\(\s*\)\s+over/i);
    expect(hasTopTen).toBe(true);
    expect(hasOtherBucket).toBe(true);
  });

  test("Given: 24개월 초과 원시 이벤트, When: 월별 retention을 검사, Then: bounded batch를 소진할 때까지 반복", () => {
    // Given
    const retentionSql = migrationSql;

    // When
    const boundedDelete =
      /with\s+expired_events\s+as[\s\S]*limit\s+10000[\s\S]*delete\s+from\s+public\.reveal_generation_events[\s\S]*using\s+expired_events/i.test(
        retentionSql,
      );

    // Then
    expect(retentionSql).toMatch(
      /create\s+extension\s+if\s+not\s+exists\s+pg_cron/i,
    );
    expect(retentionSql).toMatch(
      /create\s+procedure\s+public\.purge_reveal_generation_events\s*\(\s*\)/i,
    );
    expect(retentionSql).toMatch(
      /create\s+procedure\s+public\.purge_reveal_generation_events\s*\(\s*\)[\s\S]*security\s+invoker[\s\S]*set\s+search_path\s*=\s*''/i,
    );
    expect(retentionSql).toMatch(
      /occurred_at\s*<\s*(?:pg_catalog\.)?now\s*\(\s*\)\s*-\s*interval\s*'24 months'/i,
    );
    expect(boundedDelete).toBe(true);
    expect(retentionSql).not.toMatch(/skip\s+locked/i);
    expect(retentionSql).toMatch(/loop[\s\S]*exit\s+when\s+v_deleted\s*=\s*0/i);
    expect(retentionSql).toContain("metrics_retention_deleted_count=%");
    expect(retentionSql).toMatch(
      /cron\.schedule\s*\([\s\S]*'purge_reveal_generation_events_monthly'/i,
    );
    expect(retentionSql).toMatch(
      /revoke\s+all(?:\s+privileges)?\s+on\s+procedure\s+public\.purge_reveal_generation_events\s*\(\s*\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i,
    );
    expect(retentionSql).toMatch(
      /grant\s+execute\s+on\s+procedure\s+public\.purge_reveal_generation_events\s*\(\s*\)\s+to\s+service_role/i,
    );
  });

  test("Given: 운영 rollback 필요, When: rollback을 검사, Then: 작업·함수만 해제하고 원시 테이블은 보존", () => {
    // Given
    const safeRollbackSql = rollbackSql;

    // When
    const removesCronJob = /cron\.unschedule/i.test(safeRollbackSql);
    const removesRetentionProcedure =
      /drop\s+procedure\s+if\s+exists\s+public\.purge_reveal_generation_events/i.test(
        safeRollbackSql,
      );
    const removesAggregateFunction =
      /drop\s+function\s+if\s+exists\s+public\.get_reveal_generation_metrics/i.test(
        safeRollbackSql,
      );
    const cronPosition = safeRollbackSql.indexOf("cron.unschedule");
    const procedurePosition = safeRollbackSql.indexOf("drop procedure");
    const functionPosition = safeRollbackSql.indexOf("drop function");
    const privilegePosition = safeRollbackSql.indexOf("revoke all privileges");

    // Then
    expect(safeRollbackSql).toContain("purge_reveal_generation_events_monthly");
    expect(removesCronJob).toBe(true);
    expect(removesRetentionProcedure).toBe(true);
    expect(removesAggregateFunction).toBe(true);
    expect(safeRollbackSql).toMatch(
      /(?:pg_catalog\.)?to_regclass\s*\(\s*'cron\.job'\s*\)/i,
    );
    expect(safeRollbackSql).toMatch(
      /(?:pg_catalog\.)?to_regclass\s*\(\s*'public\.reveal_generation_events'\s*\)/i,
    );
    expect(safeRollbackSql).toMatch(
      /revoke\s+all(?:\s+privileges)?\s+on\s+table\s+public\.reveal_generation_events\s+from\s+service_role/i,
    );
    expect(safeRollbackSql).toMatch(
      /to_regprocedure\s*\(\s*'cron\.unschedule\(bigint\)'\s*\)\s+is\s+null\s+then\s+raise\s+exception/i,
    );
    expect(safeRollbackSql).not.toMatch(/raise\s+warning/i);
    expect(cronPosition).toBeLessThan(procedurePosition);
    expect(procedurePosition).toBeLessThan(functionPosition);
    expect(functionPosition).toBeLessThan(privilegePosition);
    expect(safeRollbackSql).not.toMatch(/drop\s+table/i);
    expect(safeRollbackSql).not.toMatch(/drop\s+extension/i);
  });

  test("Given: 최소 수집 원칙, When: 저장 컬럼과 DDL을 검사, Then: 원시 개인정보·비밀·비의도 파괴 구문이 없음", () => {
    // Given
    const forbiddenRawFields =
      /\b(?:ip_address|user_agent|parent_name|baby_name|gender|message|jwt|token|reveal_id)\b/i;

    // When
    const tableDefinition = migrationSql.match(
      /create\s+table\s+public\.reveal_generation_events\s*\(([\s\S]*?)\);/i,
    )?.[1];

    // Then
    expect(tableDefinition).toBeDefined();
    expect(tableDefinition).not.toMatch(forbiddenRawFields);
    expect(migrationSql).not.toMatch(/\btruncate\b/i);
    expect(migrationSql).not.toMatch(/drop\s+(?:table|schema|extension)\b/i);
    expect(migrationSql).not.toMatch(/^\s*(?:begin|commit)\s*;/im);
    expect(migrationSql).not.toMatch(
      /\b(?:api_key|access_token|private_key)\s*=\s*['"]/i,
    );
  });
});
