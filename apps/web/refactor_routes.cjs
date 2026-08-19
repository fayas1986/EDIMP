const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Replace useState for activeTab with useLocation and useNavigate
const hookReplacement = `
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace('/', '') || 'dashboard';
  const setActiveTab = (tab: string) => navigate('/' + tab);
`;
content = content.replace(/const \[activeTab, setActiveTab\] = useState<string>\('dashboard'\);/, hookReplacement);

// 2. Replace {activeTab === 'xxx' && (...)} with <Route path="/xxx" element={...} />
// Note: We have to handle both single line `<Foo />` and multi-line `(<Foo />)`
content = content.replace(/\{activeTab === '([^']+)' && \((.*?)\)\}/gs, '<Route path="/$1" element={$2} />');
content = content.replace(/\{activeTab === '([^']+)' && (<[^>]+>)\}/g, '<Route path="/$1" element={$2} />');

// 3. Wrap Routes
content = content.replace(/<>\s*(<Route path="\/dashboard".*?)<\/>/s, 
  '<Suspense fallback={<div className="p-8 text-white">Loading...</div>}>\n<Routes>\n$1\n<Route path="*" element={<Navigate to="/dashboard" replace />} />\n</Routes>\n</Suspense>');

// 4. Wrap the whole return in <Router> (BrowserRouter)
// Wait, we need to wrap the whole component return, or just add Router in main.tsx.
// Let's just wrap it inside App.tsx return.
// It returns <SessionManager> ... </SessionManager>.
content = content.replace(/(return \(\n\s*)<SessionManager>/, '$1<Router>\n    <SessionManager>');
content = content.replace(/<\/SessionManager>\n\s*\);/, '</SessionManager>\n    </Router>\n  );');

fs.writeFileSync(appPath, content);
console.log('Routing refactored in App.tsx');
