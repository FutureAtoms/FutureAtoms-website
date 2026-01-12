
import os
import re

def update_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Regex for href="css/main.css" allowing quotes
        # We also want to avoid double replacement if ?v=9999 is already there
        pattern = r'href=["\']css/main\.css(?![\?&]v=9999)["\']'
        
        # We want to replace it with href="css/main.css?v=9999" preserving the quote used?
        # Let's simplify: replace the whole match.
        # But we need to know which quote was used.
        
        def replacer(match):
            full_match = match.group(0)
            quote = full_match[-1] # the closing quote
            return f'href={quote}css/main.css?v=9999{quote}'

        new_content, count = re.subn(pattern, replacer, content)

        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath} ({count} matches)")
        else:
            if 'css/main.css?v=9999' in content:
                print(f"Skipped {filepath} (Already updated)")
            else:
                print(f"Skipped {filepath} (No match found)")
                # Debug logging for chipos.html
                if 'chipos.html' in filepath:
                     print(f"DEBUG {filepath} content snippet:")
                     idx = content.find('main.css')
                     print(content[idx-20:idx+20])
    
    except Exception as e:
        print(f"Error {filepath}: {e}")

def main():
    public_dir = 'public'
    files = [f for f in os.listdir(public_dir) if f.endswith('.html')]
    files.sort()
    for f in files:
        update_file(os.path.join(public_dir, f))

if __name__ == "__main__":
    main()
