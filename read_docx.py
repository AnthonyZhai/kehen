
import zipfile
import re
import os

file_path = r'c:\Users\antho\Desktop\enter_课痕\轻近智能机器人•青少年编程学苑介绍.docx'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    with zipfile.ZipFile(file_path, 'r') as z:
        # Try to find document.xml
        if 'word/document.xml' in z.namelist():
            xml_content = z.read('word/document.xml').decode('utf-8')
            # Simple regex to remove tags. Note: This merges all text, might lose structure.
            # A better way is to replacing </w:p> with newline to keep paragraphs.
            
            # Replace paragraph ends with newlines
            xml_content = xml_content.replace('</w:p>', '\n')
            
            text = re.sub('<[^>]+>', '', xml_content)
            print(text)
        else:
            print("word/document.xml not found in zip")
except Exception as e:
    print(f"Error: {e}")
