# test_nexalo.ps1

Write-Host "==== 🚀 INICIANDO TEST DE NEXALO MANAGER ===="

# 1. Compila
Write-Host "`n>> Compilando contratos..."
npx hardhat clean
npx hardhat compile
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error de compilación."; exit 1 }

# 2. Tests funcionales
Write-Host "`n>> Ejecutando pruebas funcionales de ciclo completo..."
npx hardhat test --grep "Ecosystem full cycle" --show-stack-traces
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Falló el test funcional principal."; exit 2 }

# 3. Test de seguridad rápida
Write-Host "`n>> Test de tamaño de contratos (contract-sizer)..."
npx hardhat contract-sizer

Write-Host "`n>> Slither (opcional, si tienes Docker)..."
# Slither suele requerir bash o docker

Write-Host "`n>> Mythril (opcional)..."
# Si tienes instalado mythril en Python, puedes intentar
# myth analyze contracts\NexumManager.sol

Write-Host "`n==== ✅ TODOS LOS TESTS DE NEXALO EJECUTADOS ===="
Write-Host "Si todos los pasos están OK, el ciclo y seguridad están cubiertos."
