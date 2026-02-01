@echo off
REM Script pour lancer le serveur avec cache désactivé
echo Démarrage du serveur HTTP sans cache...
echo.
echo Le serveur sera accessible sur: http://localhost:8000
echo Appuyez sur Ctrl+C pour arrêter
echo.
npx --yes http-server -p 8000 -c-1 --cors
