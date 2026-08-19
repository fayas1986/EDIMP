const fs = require('fs');

let content = fs.readFileSync('src/components/MigrationAuditTrailView.tsx', 'utf-8');

// Remove selectedLogForDetails state
content = content.replace(/const \[selectedLogForDetails, setSelectedLogForDetails\].*;\n/, '');

fs.writeFileSync('src/components/MigrationAuditTrailView.tsx', content);
