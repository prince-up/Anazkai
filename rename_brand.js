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
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace specifically formatted ones first
  content = content.replace(/ANAZK AI/g, 'HIDE AI');
  content = content.replace(/Anazk AI/g, 'Hide AI');
  content = content.replace(/AnazkAI/g, 'HideAI');
  content = content.replace(/Anazk/g, 'HideAI'); // General fallback
  content = content.replace(/HideAI\.online/g, 'anazk.online'); // Restore domain names
  content = content.replace(/supportHideAI@gmail\.com/gi, 'supportanazkai@gmail.com'); // Restore email
  content = content.replace(/admin@HideAI\.online/g, 'admin@anazk.online'); 
  content = content.replace(/prince@HideAI\.online/g, 'prince@anazk.online');
  content = content.replace(/HideAI:\/\/auth/g, 'anazkai://auth'); // Restore deep link protocol
  content = content.replace(/anazkai:\/\/login/g, 'anazkai://login'); // Ensure deep link remains

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
