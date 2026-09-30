import os

file_path = r'f:\random\music player\src\components\app-shell.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import { signOut }' not in content:
    content = content.replace(
        'import { useCurrentUserState } from "@/lib/auth/use-current-user";',
        'import { useCurrentUserState } from "@/lib/auth/use-current-user";\nimport { signOut } from "@/lib/auth/client";'
    )

# Mobile replacement
mobile_target = """<Link to="/studio" className="flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8 shadow-sm" />
                    </Link>"""
mobile_replacement = """<div className="flex items-center gap-1">
                      <Link to="/studio" className="flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8 shadow-sm" />
                      </Link>
                      <button
                        onClick={async () => {
                          await signOut();
                          window.location.href = "/";
                        }}
                        className="flex items-center justify-center size-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="size-4" />
                      </button>
                    </div>"""

if mobile_target in content:
    content = content.replace(mobile_target, mobile_replacement)
else:
    print("Mobile target not found")

# Desktop replacement
desktop_target = """<Link to="/studio" className="flex items-center gap-3 pl-2 border-l border-border/50 hover:opacity-80 transition-opacity">
                    <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8" />
                    <span className="text-sm font-medium">{user.displayName || "User"}</span>
                  </Link>"""
desktop_replacement = """<div className="flex items-center gap-4 pl-2 border-l border-border/50">
                    <Link to="/studio" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8" />
                      <span className="text-sm font-medium">{user.displayName || "User"}</span>
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut();
                        window.location.href = "/";
                      }}
                      className="p-2 text-muted hover:text-red-500 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>"""

if desktop_target in content:
    content = content.replace(desktop_target, desktop_replacement)
else:
    print("Desktop target not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
