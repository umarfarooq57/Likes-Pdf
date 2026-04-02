$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker is not installed or not on PATH.' -ForegroundColor Red
    exit 1
}

Write-Host 'Starting DocuForge stack with Docker Compose...' -ForegroundColor Cyan

docker compose up --build
