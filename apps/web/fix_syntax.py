import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix the broken Route tags that were prematurely closed by the regex
content = content.replace("onNavigateTab={(tab) => setActiveTab(tab} />", "onNavigateTab={(tab) => setActiveTab(tab)}")
content = content.replace("onProceedToMapping={() => setActiveTab('mapping'} />", "onProceedToMapping={() => setActiveTab('mapping')}")
content = content.replace("onProceedToValidation={() => setActiveTab('validation'} />", "onProceedToValidation={() => setActiveTab('validation')}")
content = content.replace("onCommitFullMigration={() => setActiveTab('wizard'} />", "onCommitFullMigration={() => setActiveTab('wizard')}")
content = content.replace("onNavigateHome={() => setActiveTab('dashboard'} />", "onNavigateHome={() => setActiveTab('dashboard')}")
content = content.replace("onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev} />", "onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}")
content = content.replace("onClose={() => setShortcutsModalOpen(false} />", "onClose={() => setShortcutsModalOpen(false)}")
content = content.replace("onClose={() => setQuickActionsModalOpen(false} />", "onClose={() => setQuickActionsModalOpen(false)}")
content = content.replace("onClose={() => setAuthModalOpen(false} />", "onClose={() => setAuthModalOpen(false)}")


# Remove the trailing `)}` that was left behind
# We need to find all components that were in parentheses and close the Route element correctly
# Since we know the components end with /> or </FooView>, we can do:
content = re.sub(r'(\/>)\s*\n\s*\)}', r'\1\n              }', content)

# Wait, `element={<Foo />}` needs to close the brace: `element={<Foo />} />`
# Actually, the original was:
# {activeTab === 'dashboard' && (
#   <DashboardView ... />
# )}
# It became:
# <Route path="/dashboard" element={
#   <DashboardView ...
#   />
# )}
# So we need to change `\n)}` to `\n} />`
content = re.sub(r'(\/>|\>)\s*\n\s*\)}', r'\1\n              } />', content)


with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Syntax fixed")
