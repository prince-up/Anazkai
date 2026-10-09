const fs = require('fs');
const file = 'src/components/AuthPage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/HideAI<span className="text-emerald-400 font-extrabold ml-1">AI<\/span>/g, 'Hide<span className="text-emerald-400 font-extrabold ml-1">AI</span>');
fs.writeFileSync(file, content);

const landingFile = 'src/LandingPage.jsx';
let lcontent = fs.readFileSync(landingFile, 'utf8');
lcontent = lcontent.replace(/HideAI<span className="text-emerald-400 font-extrabold ml-1">AI<\/span>/g, 'Hide<span className="text-emerald-400 font-extrabold ml-1">AI</span>');
fs.writeFileSync(landingFile, lcontent);
