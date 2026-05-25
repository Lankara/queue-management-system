# Database Validation Checklist

Run these checks in pgAdmin 4 after migrations `001` to `005` complete successfully.

## 1. Installed Extensions

```sql
SELECT extname
FROM pg_extension
ORDER BY extname;
```

Expected result:

- `pgcrypto` exists.

## 2. Enum Types

```sql
SELECT t.typname AS enum_type,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
```

Expected result:

- 11 enum types exist.

## 3. Core Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected result:

- 17 core tables exist.

## 4. Notification Template Count

```sql
SELECT language,
       COUNT(*) AS template_count
FROM notification_templates
WHERE business_id IS NULL
GROUP BY language
ORDER BY language;
```

Expected result:

- 22 total global notification templates.
- 11 English templates.
- 11 Sinhala templates.

Optional total count check:

```sql
SELECT COUNT(*) AS total_global_templates
FROM notification_templates
WHERE business_id IS NULL;
```

Expected total:

- `22`

## 5. Indexes

```sql
SELECT tablename,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Expected result:

- Indexes from primary keys, unique constraints, and `004_indexes_constraints.sql` are listed.
