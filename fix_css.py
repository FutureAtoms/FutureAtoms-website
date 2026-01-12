
import os
import sys

def update_css_link(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Target string
        target = 'href="css/main.css"'
        replacement = 'href="css/main.css?v=9999"'

        if target in content:
            new_content = content.replace(target, replacement)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
        elif 'href="css/main.css?v=9999"' in content:
            print(f"Already updated: {filepath}")
        else:
            print(f"Skipped (target not found): {filepath}")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    public_dir = 'public'
    if not os.path.exists(public_dir):
        print(f"Directory not found: {public_dir}")
        return

    files = [f for f in os.listdir(public_dir) if f.endswith('.html')]
    files.sort()
    
    for f in files:
        update_css_link(os.path.join(public_dir, f))

if __name__ == "__main__":
    main()
