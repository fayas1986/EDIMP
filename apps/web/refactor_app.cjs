const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add new imports
const zustandImport = `import { useAppStore } from './store/useAppStore';\nimport { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';\n`;
content = content.replace(`import React, { useState, useEffect } from 'react';`, `import React, { useState, useEffect, Suspense } from 'react';\n${zustandImport}`);

// 2. Convert standard imports to React.lazy
const lazyRegex = /import\s+({?\s*(\w+)\s*}?)\s+from\s+['"]\.\/components\/([^'"]+)['"];/g;
let lazyComponents = [];
content = content.replace(lazyRegex, (match, p1, componentName, fileName) => {
    if (['Header', 'Sidebar', 'ErrorBoundary', 'SessionManager', 'KeyboardShortcutsModal', 'GlobalQuickActionModal', 'AuthSessionManagerModal', 'LoginView', 'AccessDeniedView', 'OfflineStatusBanner'].includes(componentName)) {
        return match; // Keep these eager
    }
    // Handle BatchProcessingEngineView (default export vs named)
    if (p1.includes('{')) {
        return `const ${componentName} = React.lazy(() => import('./components/${fileName}').then(module => ({ default: module.${componentName} })));`;
    } else {
        return `const ${componentName} = React.lazy(() => import('./components/${fileName}'));`;
    }
});

// 3. Remove local state for connectors, jobs, auth, user
const stateRemovals = [
    /const \[connectors, setConnectors\] = useState.*?\}\);/s,
    /const \[jobs, setJobs\] = useState.*?\}\);/s,
    /const \[hasGeminiKey, setHasGeminiKey\] = useState<boolean>\(true\);/s,
    /const \[isAuthenticated, setIsAuthenticated\] = useState.*?\}\);/s,
    /const \[currentUser, setCurrentUser\] = useState.*?\}\);/s,
    /const \[userRole, setUserRole\] = useState<UserRole>\(currentUser\.role\);/s,
];
stateRemovals.forEach(regex => {
    content = content.replace(regex, '');
});

// 4. Inject Zustand store usage
const zustandHooks = `
  const connectors = useAppStore(state => state.connectors);
  const setConnectors = useAppStore(state => state.setConnectors);
  const jobs = useAppStore(state => state.jobs);
  const setJobs = useAppStore(state => state.setJobs);
  const hasGeminiKey = useAppStore(state => state.hasGeminiKey);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const currentUser = useAppStore(state => state.currentUser);
  const userRole = useAppStore(state => state.userRole);
  const handleLoginSuccess = useAppStore(state => state.handleLoginSuccess);
  const handleLogout = useAppStore(state => state.handleLogout);
  const handleSelectUser = useAppStore(state => state.handleSelectUser);
`;
content = content.replace(`export function App() {\n  const [activeTab, setActiveTab] = useState<string>('dashboard');`, `export function App() {\n  const [activeTab, setActiveTab] = useState<string>('dashboard');\n${zustandHooks}`);

// 5. Remove offlineCacheService useEffects (moved to store)
content = content.replace(/useEffect\(\(\) => \{\s*offlineCacheService\.saveJobsToOfflineCache.*?\}\);/s, '');
content = content.replace(/useEffect\(\(\) => \{\s*offlineCacheService\.saveConnectorsToOfflineCache.*?\}\);/s, '');

// 6. Remove handleLoginSuccess, handleLogout, handleSelectUser implementations
content = content.replace(/const handleLoginSuccess.*?setScreenReaderAnnouncement.*?};/s, `const setScreenReaderAnnouncement = (msg: string) => {\n    // temporary inline fix for screen reader\n    console.log(msg);\n  };`);
content = content.replace(/const handleLogout.*?setScreenReaderAnnouncement.*?};/s, '');
content = content.replace(/const handleSelectUser.*?setScreenReaderAnnouncement.*?};/s, '');

fs.writeFileSync(appPath, content);
console.log('App.tsx partially refactored with Zustand and React.lazy!');
