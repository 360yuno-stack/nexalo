@echo off
echo 🔍 NEXALO - AUDITORÍA AUTOMÁTICA
echo ======================================================================
echo.

REM Crear carpeta reports
if not exist reports mkdir reports

REM 1. Slither
echo1️⃣  Ejecutando Slither (Static Analysis)...
slither contracts/ --print human-summary > reports\slither-report.txt 2>&1
slither contracts/ --detect all >> reports\slither-report.txt 2>&1
echo    ✅ Reporte guardado en reports\slither-report.txt
echo.

REM 2. Solhint
echo 2️⃣  Ejecutando Solhint (Linter)...
solhint contracts/**/*.sol > reports\solhint-report.txt 2>&1
echo    ✅ Reporte guardado en reports\solhint-report.txt
echo.

REM 3. Hardhat Coverage
echo 3️⃣  Ejecutando Tests con Coverage...
npx hardhat coverage > reports\coverage-report.txt 2>&1
echo    ✅ Reporte guardado en reports\coverage-report.txt
echo.

REM 4. Gas Reporter
echo 4️⃣  Ejecutando Gas Report...
npx hardhat test --gas-reporter > reports\gas-report.txt 2>&1
echo    ✅ Reporte guardado en reports\gas-report.txt
echo.

echo ======================================================================
echo ✅ AUDITORÍA AUTOMÁTICA COMPLETADA
echo ======================================================================
echo.
echo 📁 Reportes generados en carpeta reports/
echo.
pause
