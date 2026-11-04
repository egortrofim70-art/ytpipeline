# Windows bootstrap: makes sure Node 18+ exists (installs a private copy into the user
# folder if not — no admin rights needed), then runs setup.mjs for the project folder.
#   powershell -ExecutionPolicy Bypass -File <skill>\scripts\setup.ps1 -Project "<folder>"
param([string]$Project = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Get-NodeMajor {
	try { $v = (& node -v) 2>$null; if ($v -match '^v(\d+)') { return [int]$Matches[1] } } catch {}
	return 0
}

if ((Get-NodeMajor) -lt 18) {
	$ver = 'v22.11.0'
	$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
	$root = Join-Path $env:LOCALAPPDATA 'what-if-node'
	$dir = Join-Path $root "node-$ver-win-$arch"
	if (-not (Test-Path (Join-Path $dir 'node.exe'))) {
		New-Item -ItemType Directory -Force $root | Out-Null
		$zip = Join-Path $root 'node.zip'
		Write-Host "installing Node $ver…"
		Invoke-WebRequest "https://nodejs.org/dist/$ver/node-$ver-win-$arch.zip" -OutFile $zip -UseBasicParsing
		Expand-Archive $zip -DestinationPath $root -Force
		Remove-Item $zip
	}
	$env:Path = "$dir;$env:Path"
	# remember it for new terminals too (user PATH only, no admin)
	$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
	if (-not ($userPath -split ';' | Where-Object { $_ -eq $dir })) {
		[Environment]::SetEnvironmentVariable('Path', "$dir;$userPath", 'User')
	}
	Write-Host "Node installed: $dir"
}
& node (Join-Path $PSScriptRoot 'setup.mjs') $Project
exit $LASTEXITCODE
