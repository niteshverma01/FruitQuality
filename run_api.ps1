param(
  [string]$VenvPath = "venv",
  [string]$Host = "0.0.0.0",
  [int]$Port = 5000
)

$ErrorActionPreference = "Stop"

if (!(Test-Path "$VenvPath\\Scripts\\python.exe")) {
  throw "venv not found at '$VenvPath'. Run .\\setup_venv.ps1 first."
}

$env:HOST = $Host
$env:PORT = "$Port"

& "$VenvPath\\Scripts\\python.exe" app.py

