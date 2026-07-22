import { z } from "zod";

const countSchema = z.number().int().nonnegative().safe();
const isoTimestampSchema = z.string().datetime({ offset: true });
const dateSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/);
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const keyedMetricSchema = z
  .object({
    key: z.string(),
    count: countSchema,
  })
  .strict();
const countryMetricSchema = z
  .object({
    key: z.string().regex(/^(?:[A-Z]{2}|other)$/),
    count: countSchema.min(10),
  })
  .strict();

export const metricsSummarySchema = z
  .object({
    period: z
      .object({
        from: isoTimestampSchema,
        to: isoTimestampSchema,
      })
      .strict(),
    total: countSchema,
    daily: z.array(
      z
        .object({
          date: dateSchema,
          count: countSchema,
        })
        .strict(),
    ),
    byCreationMode: z.array(keyedMetricSchema),
    byCountry: z.array(countryMetricSchema).max(11),
    byBabyCount: z.array(
      z
        .object({
          key: z.number().int().positive().safe(),
          count: countSchema,
        })
        .strict(),
    ),
    byAnimation: z.array(keyedMetricSchema),
    byDevice: z.array(keyedMetricSchema),
    byDueMonth: z.array(
      z
        .object({
          month: monthSchema,
          count: countSchema,
        })
        .strict(),
    ),
  })
  .strict();

export type MetricsSummary = z.infer<typeof metricsSummarySchema>;
