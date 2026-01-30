
import zipfile
import re
import os

file_path = r'c:\Users\antho\Desktop\enter_课痕\轻近智能机器人•青少年编程学苑介绍.docx'

try:
    with zipfile.ZipFile(file_path, 'r') as z:
        print("Files in zip:")
        for name in z.namelist():
            if 'header' in name or 'footer' in name:
                print(name)
                
        print("\n--- Header/Footer Content ---")
        for name in z.namelist():
            if 'header' in name or 'footer' in name:
                content = z.read(name).decode('utf-8')
                text = re.sub('<[^>]+>', '', content)
                print(f"[{name}]: {text}")
except Exception as e:
    print(f"Error: {e}")
