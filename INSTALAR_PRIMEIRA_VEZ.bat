@echo off
title TaxiRecibo - Instalacao inicial
color 0A
echo.
echo  ==========================================
echo    TAXIRECIBO - Instalacao inicial
echo    (execute apenas na primeira vez)
echo  ==========================================
echo.

:: Verifica Node.js
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERRO: Node.js nao encontrado!
    echo.
    echo  Instale o Node.js primeiro:
    echo  1. Abra o navegador
    echo  2. Acesse: https://nodejs.org
    echo  3. Clique em "LTS" para baixar
    echo  4. Instale com todas as opcoes padrao
    echo  5. Reinicie o computador
    echo  6. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)

echo  Node.js encontrado! Versao:
node --version
echo.

echo  [1/4] Instalando dependencias principais...
cd /d "%~dp0"
call npm install
if errorlevel 1 goto erro

echo.
echo  [2/4] Instalando dependencias do servidor...
cd /d "%~dp0server"
call npm install
if errorlevel 1 goto erro

echo.
echo  [3/4] Instalando dependencias da interface...
cd /d "%~dp0client"
call npm install
if errorlevel 1 goto erro

echo.
echo  [4/4] Criando banco de dados e dados de exemplo...
cd /d "%~dp0server"
call npx prisma migrate deploy >nul 2>&1
call npx prisma generate >nul 2>&1
call npx ts-node src/seed.ts
if errorlevel 1 (
    echo  Aviso: seed falhou, mas o app funcionara normalmente.
)

echo.
echo  ==========================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo.
echo    Agora use o arquivo INICIAR.bat
echo    para abrir o aplicativo.
echo.
echo    Login de demonstracao:
echo    Email: taxista@demo.com
echo    Senha: senha123
echo  ==========================================
echo.
pause
exit /b 0

:erro
color 0C
echo.
echo  ERRO durante a instalacao!
echo  Verifique sua conexao com a internet e tente novamente.
echo.
pause
exit /b 1
