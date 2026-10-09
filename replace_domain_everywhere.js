const fs = require('fs');
const path = require('path');

const targetDomain = 'anazkai.vercel.app';
const oldDomain = 'anazk.online';

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace all occurrences
    const regex1 = new RegExp(`https://${oldDomain}`, 'g');
    const regex2 = new RegExp(oldDomain, 'g');
    
    let updatedContent = content.replace(regex1, `https://${targetDomain}`);
    updatedContent = updatedContent.replace(regex2, targetDomain);

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

const filesToUpdate = [
  'index.html',
  'public/robots.txt',
  'public/sitemap.xml',
  'src/LandingPage.jsx',
  'src/pages/AppLoginPage.jsx',
  'src/components/SubscriptionGuard.jsx',
  'src/components/AuthPage.jsx',
  'README.md'
];

filesToUpdate.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath);
  } else {
    console.log(`Not found: ${fullPath}`);
  }
});

// Also update the nested cheaterboy folder if it exists
const nestedDir = path.join(__dirname, 'cheaterboy');
if (fs.existsSync(nestedDir)) {
  filesToUpdate.forEach(f => {
    const fullPath = path.join(nestedDir, f);
    if (fs.existsSync(fullPath)) {
      replaceInFile(fullPath);
    }
  });
}
