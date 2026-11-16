const fs = require('fs');
const files = [
  'src/components/AuthPage.jsx',
  'src/components/Dashboard.jsx',
  'src/components/SubscriptionGuard.jsx',
  'src/pages/AppLoginPage.jsx',
  'src/LandingPage.jsx',
  'src/main.jsx',
  'src/plans.js',
  'index.html'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/HIDE AI/g, 'ANAZK AI');
  content = content.replace(/Hide AI/g, 'Anazk AI');
  content = content.replace(/HideAI/g, 'Anazk AI');
  content = content.replace(/hideai/g, 'anazkai');
  fs.writeFileSync(file, content);
  console.log('Verified Anazk AI in ' + file);
});
