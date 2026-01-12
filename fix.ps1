# fix.ps1 - One command to fix blank screen issue
Write-Host "Fixing Vortex Live blank screen..." -ForegroundColor Yellow

# Step 1: Clean
Remove-Item -Path "dist", "node_modules", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue

# Step 2: Install fresh
npm install

# Step 3: Build
npm run build

# Step 4: Fix the built index.html (critical step!)
$htmlPath = "dist/index.html"
if (Test-Path $htmlPath) {
    $html = Get-Content $htmlPath -Raw
    
    # Replace wrong paths - this fixes 90% of blank screen issues
    $html = $html -replace 'src="/', 'src="./'
    $html = $html -replace 'href="/', 'href="./'
    
    Set-Content $htmlPath $html -Encoding UTF8
    Write-Host "✅ Fixed asset paths in index.html" -ForegroundColor Green
}

# Step 5: Deploy
firebase deploy --only hosting --force

Write-Host "✅ Done! Check https://vortexlive.online" -ForegroundColor Green