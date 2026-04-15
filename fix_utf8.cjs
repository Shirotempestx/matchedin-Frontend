const fs = require('fs');

const path = 'C:/Users/pc/OneDrive/Desktop/MatchedIn-v2/MatchendIN/FrontEnd/src/pages/explore/FollowedEnterprises.tsx';
let content = fs.readFileSync(path, 'utf8');

// Clean up UTF-8 artifacts
content = content.replace(/dÃƒÂ©fini/g, 'défini')
                 .replace(/dÃ©fini/g, 'défini')
                 .replace(/{'VOIR L\\'ENTREPRISE'}/g, '{"VOIR L\\'ENTREPRISE"}')
                 .replace(/\\\\'VOIR L\\'ENTREPRISE\\\\'/g, '{"VOIR L\\'ENTREPRISE"}')
                 .replace(/{'VOIR L(\\\\?)'ENTREPRISE'}/g, '{"VOIR L\\'ENTREPRISE"}');

fs.writeFileSync(path, content, 'utf8');
