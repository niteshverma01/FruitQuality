param(
  [string]$VenvPath = "venv"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $VenvPath)) {
  python -m venv $VenvPath
}

& "$VenvPath\\Scripts\\python.exe" -m pip install --upgrade pip
& "$VenvPath\\Scripts\\python.exe" -m pip install -r requirements.txt

Write-Host "Done. Activate with: $VenvPath\\Scripts\\Activate.ps1"

