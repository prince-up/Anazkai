const fs = require('fs');
const file = 'src/components/SubscriptionGuard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the hardcoded login URL
content = content.replace(/https:\/\/anazk\.online\/app-login/g, 'https://anazkai.vercel.app/app-login');

// Replace error messages directing users to the website
content = content.replace(/at anazk\.online/g, 'at anazkai.vercel.app');
content = content.replace(/https:\/\/anazk\.online\/#pricing/g, 'https://anazkai.vercel.app/#pricing');
content = content.replace(/on anazk\.online/g, 'on anazkai.vercel.app');
content = content.replace(/>anazk\.online<\/span>/g, '>anazkai.vercel.app</span>');
content = content.replace(/https:\/\/anazk\.online\/favicon\.ico/g, 'https://anazkai.vercel.app/favicon.ico');

fs.writeFileSync(file, content);
