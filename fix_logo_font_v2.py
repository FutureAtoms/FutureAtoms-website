
import glob
import os
import re

def fix_all_logos():
    log_file = "fix_log.txt"
    with open(log_file, "w") as log:
        log.write("Starting logo fix...\n")
        files = glob.glob("public/*.html")
        log.write(f"Found {len(files)} files in public/\n")
        
        # Regex to handle whitespace variations
        pattern = re.compile(r'(FUTURE\s*<span\s+class=["\']text-cyan-400["\']\s*>\s*ATOMS\s*</span>)', re.IGNORECASE)
        replacement = r'FUTURE<span class="text-cyan-400" style="font-family: \'Orbitron\', sans-serif;">ATOMS</span>'
        
        count = 0
        for path in files:
            if "chipos-docs.html" in path or "chipos-settings.html" in path:
                log.write(f"Skipping docs: {path}\n")
                continue 

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                log.write(f"Error reading {path}: {e}\n")
                continue
                
            new_content = content
            
            # Check if already fixed
            if 'FUTURE<span class="text-cyan-400" style="font-family: \'Orbitron\', sans-serif;">ATOMS</span>' in content:
                log.write(f"Skipping {path} (already fixed)\n")
                continue

            if pattern.search(content):
                new_content = pattern.sub(replacement, content)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                log.write(f"Updated {path}\n")
                count += 1
            else:
                 if "FUTURE" in content and "ATOMS" in content:
                     log.write(f"No match in {path} but found keywords.\n")
                     idx = content.find("FUTURE")
                     log.write(f"Snippet: {content[idx:idx+60]!r}\n")

        log.write(f"Total files updated: {count}\n")

if __name__ == "__main__":
    fix_all_logos()
