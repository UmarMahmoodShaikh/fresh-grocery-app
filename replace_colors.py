import os

colors_map = {
    "#FF6B35": "#2D6A4F",
    "#F77F00": "#52B788",
    "#FFAA00": "#74C69D",
    "#FF6B9D": "#4ADE80", # The pinkish color for promo
}

files_to_update = [
    "app/(tabs)/index.tsx",
    "app/(auth)/login.tsx",
    "app/(auth)/signup.tsx",
    "app/(auth)/forgot-password.tsx",
    "app/(tabs)/account.tsx",
    "app/addresses.tsx",
    "app/profile.tsx"
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        for k, v in colors_map.items():
            content = content.replace(k, v)
            # also case-insensitive for hex? Usually we use uppercase in the code, but just in case:
            content = content.replace(k.lower(), v)
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
