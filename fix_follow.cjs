const fs = require('fs');
let code = fs.readFileSync('src/pages/enterprise-profile.tsx', 'utf8');

code = code.replace(
  'export default function EnterpriseProfilePage({ view = "owner" }: EnterpriseProfilePageProps) {',
  'export default function EnterpriseProfilePage({ view = "owner" }: EnterpriseProfilePageProps) {\n  const queryClient = useQueryClient();'
);

code = code.replace(
  /\} : prev\)\r?\n                        \}\)/g,
  `} : prev)\n                          queryClient.invalidateQueries({ queryKey: ['followedEnterprises'] })\n                        })`
);

fs.writeFileSync('src/pages/enterprise-profile.tsx', code, 'utf8');
console.log('Fixed follow cache invalidation');

