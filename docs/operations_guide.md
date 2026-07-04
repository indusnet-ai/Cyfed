# Operations Guide: Day-2 Maintenance and Monitoring

This guide provides administration instructions for ongoing maintenance, audits, and performance tuning of the FedSOC AI platform.

---

## 1. Audit Log Inspection

All user actions, logins, and threat simulation events write log records to the PostgreSQL `public.audit_logs` table.
To query audit logs via SQL or Supabase dashboard:

```sql
-- View latest 50 security actions
SELECT user_role, action, target, timestamp 
FROM public.audit_logs 
ORDER BY timestamp DESC 
LIMIT 50;
```

---

## 2. Model Checkpoint Rotation

When training rounds complete, the model state is persisted locally inside `python/fedcore/checkpoints/` as `.pkl` files.
- **Rotation recommendation**: Retain the latest 5 checkpoints. Archive checkpoints older than 30 days.
- **Pruning command**:
  ```powershell
  # Keep latest 5 checkpoints, delete the rest
  Get-ChildItem python/fedcore/checkpoints/*.pkl | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item -Force
  ```

---

## 3. Database Backup & Recovery

To create a backup copy of the Postgres database:
```bash
docker exec -t fedsoc-db pg_dumpall -c -U fedsoc_admin > fedsoc_backup_$(date +%F).sql
```

To restore from a backup file:
```bash
cat fedsoc_backup_2026-07-03.sql | docker exec -i fedsoc-db psql -U fedsoc_admin -d fedsoc_db
```
