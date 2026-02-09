"""Test the template path fix"""
import os

# Check if files exist
template_files = [
    "template_grp.docx",
    "pipeco_template.docx",
    "template_colex.docx",
    "apex_template.docx"
]

print("="*60)
print("VERIFYING TEMPLATE FILES")
print("="*60)

script_dir = os.path.dirname(__file__)

for template_name in template_files:
    # Test without .docx (database format)
    template_without_ext = template_name.replace('.docx', '')
    
    # Add .docx extension
    template_with_ext = template_without_ext if template_without_ext.endswith('.docx') else template_without_ext + '.docx'
    
    template_path = os.path.join(script_dir, template_with_ext)
    
    exists = os.path.exists(template_path)
    status = "✓" if exists else "✗"
    
    print(f"\n{status} Database: {template_without_ext}")
    print(f"  File: {template_with_ext}")
    print(f"  Path: {template_path}")
    print(f"  Exists: {exists}")

print("\n" + "="*60)
print("Testing template path logic from api_server.py")
print("="*60)

# Simulate the logic from api_server.py
test_paths = ["template_grp", "pipeco_template", "template/old_format"]

for test_path in test_paths:
    template_filename = test_path
    if not template_filename.endswith('.docx'):
        template_filename = template_filename + '.docx'
    
    full_path = os.path.join(script_dir, template_filename)
    exists = os.path.exists(full_path)
    status = "✓" if exists else "✗"
    
    print(f"\n{status} Input: {test_path}")
    print(f"  Processed: {template_filename}")
    print(f"  Exists: {exists}")
