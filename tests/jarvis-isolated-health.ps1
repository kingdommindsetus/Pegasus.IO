param(
 [ValidateSet('none','database','ollama','workers','queue')][string]$SimulateFailure='none',
 [switch]$Json
)
$ErrorActionPreference='Stop'
$work='C:\Users\info\PegasusVoiceEngine\acceptance-isolated'
$result=[ordered]@{timestamp=(Get-Date).ToString('o');scope='windows-isolated-development';overall='healthy';signals=[ordered]@{};alerts=@()}
function Signal($name,$status,$detail){
 $result.signals[$name]=[ordered]@{status=$status;detail=$detail}
 if($status -ne 'healthy'){$result.alerts+=@{signal=$name;severity=$status;detail=$detail}}
}
try {
 $pg=Get-Service -Name 'postgresql-x64-16' -ErrorAction Stop
 if($SimulateFailure -eq 'database'){throw 'Simulated database disconnection'}
 if($pg.Status -ne 'Running'){throw 'PostgreSQL service is not running'}
 $uri=([string](Get-Content (Join-Path $work '.windows-test-db-url') -Raw)).Trim()
 $parsed=[uri]$uri
 $parts=$parsed.UserInfo.Split(':',2)
 if($parsed.Host -ne '127.0.0.1' -or $parsed.AbsolutePath -ne '/pegasus_world_windows_accept_1011' -or [uri]::UnescapeDataString($parts[0]) -ne 'pegasus_windows_accept_role'){throw 'Isolated database URI guard failed'}
 $env:PGPASSWORD=[uri]::UnescapeDataString($parts[1])
 try{
  $exe='C:\Program Files\PostgreSQL\16\bin\psql.exe'
  $query="SELECT current_database()||'|'||current_user||'|'||(SELECT COUNT(*) FROM pegasus_core.jobs WHERE status IN ('queued','retrying'))||'|'||(SELECT COUNT(*) FROM pegasus_core.jobs WHERE status IN ('claimed','running') AND lease_expires_at<now())||'|'||(SELECT COUNT(*) FROM pegasus_core.jobs WHERE status='failed')"
  $out=@(& $exe -X -q -t -A -w -h 127.0.0.1 -p 5432 -U 'pegasus_windows_accept_role' -d 'pegasus_world_windows_accept_1011' -c $query 2>&1)
  if($LASTEXITCODE -ne 0){throw 'Isolated SQL probe exited unsuccessfully'}
  $fields=([string]($out|Select-Object -Last 1)).Trim().Split('|')
  if($fields.Count -ne 5 -or $fields[0] -ne 'pegasus_world_windows_accept_1011' -or $fields[1] -ne 'pegasus_windows_accept_role'){throw 'Database response mismatch'}
  Signal 'database' 'healthy' 'Windows isolated DB available under restricted role'
  $queued=[int]$fields[2];$expired=[int]$fields[3];$failed=[int]$fields[4]
  if($SimulateFailure -eq 'queue'){$expired=1}
  if($expired -gt 0){Signal 'queue' 'blocked' "$expired expired active leases; $queued queued/retrying; $failed failed"}
  elseif($queued -gt 10 -or $failed -gt 10){Signal 'queue' 'degraded' "$queued queued/retrying; $failed failed"}
  else{Signal 'queue' 'healthy' "$queued queued/retrying; $failed historical; no expired active leases"}
 }finally{Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue}
}catch{Signal 'database' 'offline' 'Isolated Windows database unavailable or guard failed';Signal 'queue' 'unknown' 'Queue cannot be verified while database unavailable'}
try{
 if($SimulateFailure -eq 'ollama'){throw 'Simulated Ollama disconnection'}
 $response=Invoke-WebRequest 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 4
 if([int]$response.StatusCode -ne 200){throw 'Unexpected local Ollama status'}
 Signal 'ollama' 'healthy' 'Local model endpoint returned HTTP 200'
}catch{Signal 'ollama' 'offline' 'Local model endpoint unavailable'}
try{
 if($SimulateFailure -eq 'workers'){throw 'Simulated worker interruption'}
 $ps=@(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'node.exe' -and $_.CommandLine -match 'isolated-(always-on|ollama)-worker\.ts'})
 $standard=@($ps | Where-Object {$_.CommandLine -match 'isolated-always-on-worker\.ts'}).Count
 $ai=@($ps | Where-Object {$_.CommandLine -match 'isolated-ollama-worker\.ts'}).Count
 $tasks=@(Get-ScheduledTask -TaskName 'Pegasus-Isolated-Worker-Recovery','Pegasus-Isolated-Ollama-Worker-Recovery' -ErrorAction Stop)
 if($standard -lt 1 -or $ai -lt 1 -or $tasks.Count -ne 2){Signal 'workers' 'offline' "Standard=$standard; Ollama=$ai; task definitions=$($tasks.Count)"}
 elseif(@($tasks|Where-Object {$_.State -eq 'Disabled'}).Count -gt 0){Signal 'workers' 'degraded' 'At least one recovery task disabled'}
 else{Signal 'workers' 'healthy' "Standard Node processes=$standard; Ollama Node processes=$ai; recovery tasks enabled"}
}catch{Signal 'workers' 'offline' 'Isolated worker process or scheduler inspection failed'}
$states=@($result.signals.Values|ForEach-Object {$_.status})
if($states -contains 'blocked'){$result.overall='blocked'}
elseif($states -contains 'offline'){$result.overall='offline'}
elseif($states -contains 'degraded' -or $states -contains 'unknown'){$result.overall='degraded'}
if($Json){$result|ConvertTo-Json -Depth 8 -Compress}else{$result|ConvertTo-Json -Depth 8}
