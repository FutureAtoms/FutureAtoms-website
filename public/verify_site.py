import os
import re
from html.parser import HTMLParser

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.title = None
        self.description = None
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for name, value in attrs:
                if name == 'href':
                    self.links.append(value)
        elif tag == 'title':
            self._in_title = True
        elif tag == 'meta':
            attr_dict = dict(attrs)
            if attr_dict.get('name') == 'description':
                self.description = attr_dict.get('content')

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title = data

def get_html_files(root_dir):
    html_files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.html'):
                html_files.append(os.path.join(dirpath, filename))
    return html_files

def verify_links_and_extract_meta(root_dir):
    html_files = get_html_files(root_dir)
    broken_links = []
    page_metadata = []

    print(f"Found {len(html_files)} HTML files.")

    for file_path in html_files:
        rel_path = os.path.relpath(file_path, root_dir)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                parser = LinkParser()
                parser.feed(content)
                
                title = parser.title.strip() if parser.title else "No Title"
                description = parser.description.strip() if parser.description else "No Description"
                
                page_metadata.append({
                    'path': rel_path,
                    'title': title,
                    'description': description
                })

                # Verify Links
                for href in parser.links:
                    href = href.strip()
                    if not href or href.startswith(('http', 'https', 'mailto:', 'tel:', '#', 'javascript:')):
                        continue
                    
                    # Handle anchors in local links
                    href_clean = href.split('#')[0]
                    if not href_clean:
                        continue

                    # Resolve path
                    target_path = os.path.join(os.path.dirname(file_path), href_clean)
                    target_path = os.path.normpath(target_path)
                    
                    if not os.path.exists(target_path):
                        broken_links.append({
                            'source': rel_path,
                            'link': href,
                            'target_abs': target_path
                        })

        except Exception as e:
            print(f"Error processing {rel_path}: {e}")

    return broken_links, page_metadata

if __name__ == "__main__":
    root_directory = "."
    broken, metadata = verify_links_and_extract_meta(root_directory)

    print("\n--- Page Metadata ---")
    for page in metadata:
        print(f"File: {page['path']}")
        print(f"Title: {page['title']}")
        print(f"Desc: {page['description']}")
        print("-" * 20)

    print("\n--- Broken Links ---")
    if broken:
        for link in broken:
            print(f"Source: {link['source']}")
            print(f"Broken Link: {link['link']}")
            print("-" * 20)
    else:
        print("No broken links found!")
