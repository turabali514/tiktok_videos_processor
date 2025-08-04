# apply_migrations.ps1
# Assumes this is at: project/db/scripts/
# .env is two levels up (project/.env)

$envFilePath = Resolve-Path "..\..\.env"  # adjust if your .env is elsewhere
if (-Not (Test-Path $envFilePath)) {
    Write-Error "Cannot find .env at $envFilePath"
    exit 1
}

# Load .env lines like KEY=VALUE
Get-Content $envFilePath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and ($line -match '^\s*([^=]+)=(.*)$')) {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        # strip surrounding quotes if present
        if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        # set environment variable
        Set-Item -Path "env:$key" -Value $val
    }
}

# Use superuser password if provided
if ($env:POSTGRES_SUPERUSER_PASSWORD) {
    Set-Item env:PGPASSWORD $env:POSTGRES_SUPERUSER_PASSWORD
}
$originalSql = Get-Content "..\migrations\migration0_create_db.sql" -Raw
$replacedSql = $originalSql -replace "PGPASSWORD", $env:PGPASSWORD
$tempSqlPath = "..\migrations\_temp_migration0.sql"
$replacedSql | Set-Content $tempSqlPath
Write-Output "Running migration0 (create DB and user)..."
psql -h localhost -U postgres -f $tempSqlPath
Remove-Item $tempSqlPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "migration0 failed"
    exit 1
}

# Switch to app user password if present
if ($env:TIKTOK_USER_PASSWORD) {
    Set-Item env:PGPASSWORD $env:TIKTOK_USER_PASSWORD
}

Write-Output "Running migration1 (users, videos, user_videos)..."
psql -h localhost -U tiktok_user -d tiktok_processor -f "../migrations/migration1_users_videos.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Error "migration1 failed"
    exit 1
}

Write-Output "Running migration2 (highlights)..."
psql -h localhost -U tiktok_user -d tiktok_processor -f "../migrations/migration2_highlights.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Error "migration2 failed"
    exit 1
}

Write-Output "Running migration3 (collections)..."
psql -h localhost -U tiktok_user -d tiktok_processor -f "../migrations/migration3_collections.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Error "migration3 failed"
    exit 1
}

Write-Output "All migrations applied successfully."
