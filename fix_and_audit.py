
import os

def fix_index_font():
    path = "public/index.html"
    try:
        with open(path, 'r') as f:
            content = f.read()
        
        # Target the specific span in the navbar
        target = 'FUTURE<span class="text-cyan-400">ATOMS</span>'
        replacement = 'FUTURE<span class="font-[\'Orbitron\'] text-cyan-400">ATOMS</span>'
        
        if target in content:
            new_content = content.replace(target, replacement)
            with open(path, 'w') as f:
                f.write(new_content)
            print(f"Fixed {path}")
        else:
            print(f"Target string not found in {path}. searching for partial matches...")
            # Debugging partials
            if 'FUTURE<span' in content:
                print("Found 'FUTURE<span' start")
    except Exception as e:
        print(f"Error processing {path}: {e}")

def audit_docs():
    files = ["public/chipos-docs.html", "public/chipos-settings.html", "public/chipos-pitch.html"]
    for path in files:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
            
        with open(path, 'r') as f:
            content = f.read()
            
        if "FUTUREATOMS" in content or "FutureAtoms" in content:
            print(f"Found 'FutureAtoms' text in {path}")
            # Check context
            if 'FUTURE<span' in content:
                print(f"  - Identifying logo pattern in {path}")
            else:
                print(f"  - 'FUTURE<span' pattern NOT found in {path}")
        else:
            print(f"No 'FutureAtoms' text found in {path}")

if __name__ == "__main__":
    fix_index_font()
    audit_docs()
