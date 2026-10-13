$ErrorActionPreference='Stop'
$probe=Join-Path $PSScriptRoot 'jarvis-persistent-health.ps1'
$dir=Join-Path $env:TEMP ('pegasus-r06-acceptance-'+[guid]::NewGuid().ToString('N'))
try{
 $none=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -Mode read -StorePath $dir | ConvertFrom-Json
 if($none.status -ne 'stale'){throw 'Missing snapshot must be stale'}
 $good=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -Mode capture -StorePath $dir|ConvertFrom-Json
 if($good.status -ne 'healthy' -or $good.stale){throw 'Fresh health capture failed'}
 $down=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -Mode capture -SimulateFailure ollama -StorePath $dir|ConvertFrom-Json
 if($down.status -ne 'offline' -or @($down.alerts).Count -lt 1){throw 'Missing outage alert'}
 $block=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -Mode capture -SimulateFailure queue -StorePath $dir|ConvertFrom-Json
 if($block.status -ne 'blocked'){throw 'Blocked queue not surfaced'}
 $log=@(Get-Content (Join-Path $dir 'history.jsonl'))
 if($log.Count -ne 3){throw 'History missing captures'}
 $before=(Get-Content (Join-Path $dir 'history.jsonl') -Raw).Length
 $v=Get-Content (Join-Path $dir 'latest.json') -Raw|ConvertFrom-Json
 $v.timestamp=(Get-Date).AddHours(-1).ToString('o')
 [IO.File]::WriteAllText((Join-Path $dir 'latest.json'),($v|ConvertTo-Json -Compress -Depth 10))
 $stale=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -Mode read -StorePath $dir|ConvertFrom-Json
 if($stale.status -ne 'stale' -or !$stale.stale -or @($stale.alerts|Where-Object signal -eq 'monitor').Count -ne 1){throw 'Old snapshot wrongly green'}
 if((Get-Content (Join-Path $dir 'history.jsonl') -Raw).Length -ne $before){throw 'Read-only access modified history'}
 Write-Output 'R06_PERSISTENCE_ACCEPTANCE_PASSED healthy=1 offline=1 blocked=1 stale=1 history=3 readOnly=1'
}finally{Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue}
