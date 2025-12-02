import os

def generate_directory_tree(root_path, prefix="", depth=0, max_depth=3):
    tree_str = ""
    if depth > max_depth:
        return ""
    try:
        entries = sorted(os.listdir(root_path))
    except PermissionError:
        return ""
    
    entries_count = len(entries)
    for idx, entry in enumerate(entries):
        path = os.path.join(root_path, entry)
        connector = "└── " if idx == entries_count - 1 else "├── "
        
        # Add folder emoji for directories, file emoji for files
        if os.path.isdir(path):
            tree_str += prefix + connector + "📁 " + entry + "/\n"
        else:
            tree_str += prefix + connector + "📄 " + entry + "\n"
            
        if os.path.isdir(path):
            extension = "    " if idx == entries_count - 1 else "│   "
            tree_str += generate_directory_tree(path, prefix + extension, depth + 1, max_depth)
    return tree_str

# Generate tree from current directory
result = generate_directory_tree('.')

# Save to file
with open("directory_tree.txt", "w", encoding="utf-8") as f:
    f.write("📁 CompleteModelwithBackend/\n" + result)

print("Directory tree saved to directory_tree.txt")
print(result[:500] + "...")  # Preview first 500 characters
