@echo off
echo 🔥 FORCE FIXING VORTEX LIVE CACHE ISSUE
echo.

echo Step 1: Building fresh...
call npm run build

echo Step 2: Deploying with cache control...
call firebase deploy --only hosting --force

echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo ==========================================
echo 🚨 IMPORTANT NEXT STEPS:
echo ==========================================
echo.
echo 1. OPEN Chrome and press Ctrl+Shift+Delete
echo 2. Select "All time" and "Cached images/files"
echo 3. Click "Clear data"
echo 4. Go to https://vortexlive.online
echo 5. Press Ctrl+Shift+R (hard refresh)
echo 6. Check DevTools → Network tab
echo    Should see: index-GI2GRNMM.js
echo    NOT: index-CI9MEJ2T.js
echo.
pause