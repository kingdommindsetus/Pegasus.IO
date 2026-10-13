param(
 [ValidateSet('capture','read')][string]$Mode='read',
 [ValidateSet('none','database','ollama','workers','queue')][string]$SimulateFailure='none',
 [int]$MaxAgeSeconds=180,
 [string]$StorePath='C:\Users\info\PegasusVoiceEngine\acceptance-isolated\jarvis-health'
)
$ErrorActionPreference='Stop'
$probe=Join-Path $PSScriptRoot 'jarvis-isolated-health.ps1'
$history=Join-Path $StorePath 'history.jsonl'
$latest=Join-Path $StorePath 'latest.json'
function Read-Status {
 if(!(Test-Path $latest)){return [ordered]@{schemaVersion=1;source='jarvis-isolated';status='stale';stale=$true;ageSeconds=$null;lastSeen=$null;signals=@{};alerts=@(@{signal='monitor';severity='stale';detail='No snapshot has been recorded'})}}
 try{
  $snapshot=Get-Content -LiteralPath $latest -Raw | ConvertFrom-Json
  if($snapshot.scope -ne 'windows-isolated-development'){throw 'Unexpected scope'}
  $stamp=[datetimeoffset]::Parse($snapshot.timestamp)
  $age=[math]::Floor(([datetimeoffset]::Now-$stamp).TotalSeconds)
  if($age -lt -5){throw 'Future timestamp'}
  $stale=$age -gt $MaxAgeSeconds
  $alerts=@($snapshot.alerts)
  if($stale){$alerts+=@{signal='monitor';severity='stale';detail='Snapshot exceeded freshness limit'}}
  return [ordered]@{schemaVersion=1;source='jarvis-isolated';status=$(if($stale){'stale'}else{$snapshot.overall});stale=$stale;ageSeconds=$age;lastSeen=$snapshot.timestamp;scope=$snapshot.scope;signals=$snapshot.signals;alerts=$alerts}
 }catch{return [ordered]@{schemaVersion=1;source='jarvis-isolated';status='stale';stale=$true;ageSeconds=$null;lastSeen=$null;signals=@{};alerts=@(@{signal='monitor';severity='stale';detail='Snapshot corrupt or invalid'})}}
}
if($Mode -eq 'capture'){
 $snapshot=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -SimulateFailure $SimulateFailure -Json | ConvertFrom-Json
 if($LASTEXITCODE -ne 0 -or $snapshot.scope -ne 'windows-isolated-development'){throw 'Isolated probe failed'}
 New-Item -ItemType Directory -Force -Path $StorePath | Out-Null
 $json=$snapshot | ConvertTo-Json -Depth 10 -Compress
 $temp=Join-Path $StorePath ('snapshot-'+[guid]::NewGuid().ToString('N')+'.tmp')
 [IO.File]::WriteAllText($temp,$json,[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath $temp -Destination $latest -Force
 [IO.File]::AppendAllText($history,$json+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
}
Read-Status | ConvertTo-Json -Depth 12 -Compress
