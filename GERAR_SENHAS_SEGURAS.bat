@echo off
title TaxiRecibo - Gerar Senhas Seguras
echo.
echo  Gerando senhas seguras para o Railway...
echo.

:: Escreve o script JS em arquivo separado
set TMPJS=%TEMP%\gerar_senhas_taxirecibo.js
echo var c = require('crypto'); > "%TMPJS%"
echo var s1 = c.randomBytes(32).toString('hex'); >> "%TMPJS%"
echo var s2 = c.randomBytes(32).toString('hex'); >> "%TMPJS%"
echo console.log(''); >> "%TMPJS%"
echo console.log('============================================'); >> "%TMPJS%"
echo console.log(' COPIE E SALVE EM LOCAL SEGURO (ex: bloco de notas)'); >> "%TMPJS%"
echo console.log('============================================'); >> "%TMPJS%"
echo console.log(''); >> "%TMPJS%"
echo console.log('JWT_SECRET=' + s1); >> "%TMPJS%"
echo console.log(''); >> "%TMPJS%"
echo console.log('JWT_REFRESH_SECRET=' + s2); >> "%TMPJS%"
echo console.log(''); >> "%TMPJS%"
echo console.log('============================================'); >> "%TMPJS%"

node "%TMPJS%"
del "%TMPJS%" >nul 2>&1

echo.
echo  Anote os dois valores acima antes de fechar esta janela!
echo.
pause
