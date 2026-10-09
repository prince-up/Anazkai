const fs = require('fs');
const file = 'src/LandingPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Restore the filenames in the GitHub release URLs
content = content.replace(/HideAI\.Setup\.1\.0\.0\.exe/g, 'AnazkAI.Setup.1.0.0.exe');
content = content.replace(/HideAI-1\.0\.0-arm64\.dmg/g, 'AnazkAI-1.0.0-arm64.dmg');

fs.writeFileSync(file, content);
