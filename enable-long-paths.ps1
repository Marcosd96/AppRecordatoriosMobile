# Script para habilitar rutas largas en Windows
# Debe ejecutarse como Administrador

Write-Host "Habilitando rutas largas en Windows..." -ForegroundColor Yellow

try {
    $registryPath = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
    $propertyName = "LongPathsEnabled"
    
    # Verificar si ya está habilitado
    $currentValue = Get-ItemProperty -Path $registryPath -Name $propertyName -ErrorAction SilentlyContinue
    
    if ($currentValue.LongPathsEnabled -eq 1) {
        Write-Host "Las rutas largas ya están habilitadas." -ForegroundColor Green
    } else {
        # Habilitar rutas largas
        Set-ItemProperty -Path $registryPath -Name $propertyName -Value 1 -Type DWORD -Force
        Write-Host "Rutas largas habilitadas exitosamente!" -ForegroundColor Green
        Write-Host "IMPORTANTE: Debes reiniciar tu computadora para que los cambios surtan efecto." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: Debes ejecutar este script como Administrador" -ForegroundColor Red
    Write-Host "Presiona Win+X y selecciona 'Windows PowerShell (Administrador)'" -ForegroundColor Yellow
}

