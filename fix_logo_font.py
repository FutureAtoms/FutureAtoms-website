
import glob
import os
import re

def fix_all_logos():
    print("Starting logo fix...")
    files = glob.glob("public/*.html")
    print(f"Found {len(files)} files in public/")
    
    # Regex to handle whitespace variations
    # We want to find: FUTURE<span class="text-cyan-400">ATOMS</span>
    # and replace with: FUTURE<span class="text-cyan-400" style="font-family: 'Orbitron', sans-serif;">ATOMS</span>
    
    pattern = re.compile(r'(FUTURE\s*<span\s+class=["\']text-cyan-400["\']\s*>\s*ATOMS\s*</span>)', re.IGNORECASE)
    replacement = r'FUTURE<span class="text-cyan-400" style="font-family: \'Orbitron\', sans-serif;">ATOMS</span>'
    
    count = 0
    for path in files:
        if "chipos-docs.html" in path or "chipos-settings.html" in path:
            print(f"Skipping docs: {path}")
            continue 

        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {path}: {e}")
            continue
            
        new_content = content
        
        # Check if already fixed
        if 'style="font-family: \'Orbitron\', sans-serif;"' in content and 'ATOMS</span>' in content:
            # Simple check if it might be already done
             if 'FUTURE<span class="text-cyan-400" style="font-family: \'Orbitron\', sans-serif;">ATOMS</span>' in content:
                 print(f"Skipping {path} (already fixed)")
                 continue

        if pattern.search(content):
            new_content = pattern.sub(replacement, content)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {path}")
            count += 1
        else:
             # Debug: Check if "FUTURE" exists but didn't match
             if "FUTURE" in content and "ATOMS" in content:
                 print(f"No match in {path} but found keywords. Checking snippet...")
                 # Print a snippet to see what it looks like
                 idx = content.find("FUTURE")
                 print(f"Snippet: {content[idx:idx+60]!r}")

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    fix_all_logos()
