const fs = require('fs');

let content = fs.readFileSync('src/components/MigrationAuditTrailView.tsx', 'utf-8');

const startTag = '{/* DETAILED AUDIT INSPECTION MODAL - Removing since we moved it inline, but leaving anchor */}';
const startIndex = content.indexOf(startTag);

if (startIndex !== -1) {
  // We want to delete from startIndex up to the final '    </div>\n  );\n};\n'
  // Let's just find the last '    </div>\n  );\n};' and keep that.
  
  const tailEnd = '    </div>\n  );\n};\n';
  
  content = content.substring(0, startIndex) + tailEnd;
  fs.writeFileSync('src/components/MigrationAuditTrailView.tsx', content);
  console.log("Successfully removed redundant modal.");
} else {
  console.log("Could not find anchor.");
}
