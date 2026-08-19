import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix the badly closed Route tags (e.g. trailing `}` instead of `} />`)
# Any line with just `  }` or `      }` which is immediately before another `<Route` or `</Routes>`
content = re.sub(r'(\s+)\}$(?=\s*<Route|\s*</Routes>)', r'\1} />', content, flags=re.MULTILINE)

# Fix `onProceedToWizard={() => setActiveTab('wizard'} /> />`
content = content.replace("setActiveTab('wizard'} /> />", "setActiveTab('wizard')} />")
content = content.replace("setActiveTab('dashboard'} /> />", "setActiveTab('dashboard')} />")
content = content.replace("setActiveTab('wizard'} />", "setActiveTab('wizard')}")
content = content.replace("setActiveTab('dashboard'} />", "setActiveTab('dashboard')}")
content = content.replace("setMobileSidebarOpen((prev) => !prev} />", "setMobileSidebarOpen((prev) => !prev)}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Syntax fixed")
