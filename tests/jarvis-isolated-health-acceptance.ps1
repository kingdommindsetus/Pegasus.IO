$ErrorActionPreference='Stop'
$probe=Join-Path $PSScriptRoot 'jarvis-isolated-health.ps1'
$expected=[ordered]@{none='healthy';database='offline';ollama='offline';workers='offline';queue='blocked'}
foreach($mode in $expected.Keys){
 $raw=& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $probe -SimulateFailure $mode -Json
 if($LASTEXITCODE -ne 0){throw "R06 health probe command failed: $mode"}
 $result=$raw|ConvertFrom-Json
 if($result.overall -ne $expected[$mode]){throw "R06 assertion failed for ${mode}: expected $($expected[$mode]), got $($result.overall)"}
 if($result.scope -ne 'windows-isolated-development'){throw "Unscoped health result: $mode"}
 if($mode -ne 'none' -and @($result.alerts).Count -eq 0){throw "Missing alert for $mode"}
 Write-Output "R06_HEALTH_STATE_PASS mode=$mode status=$($result.overall)"
}
Write-Output 'R06_HEALTH_PROBE_TESTS_PASSED'
