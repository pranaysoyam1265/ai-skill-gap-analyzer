import os

def generate_directory_tree(
    root_path,
    prefix="",
    ignore_dirs=None,
    ignore_files=None,
    max_depth=None,
    current_depth=0
):
    """
    Generates a directory tree with options to ignore specific folders/files
    and set a maximum depth.
    """
    
    if ignore_dirs is None:
        ignore_dirs = set()
    if ignore_files is None:
        ignore_files = set()
    
    tree_str = ""
    
    # Check max depth
    if max_depth is not None and current_depth > max_depth:
        return ""
    
    try:
        # Filter entries to ignore
        entries = sorted([
            e for e in os.listdir(root_path) 
            if e not in ignore_dirs and not any(pattern in e for pattern in ignore_files)
        ])
    except PermissionError:
        return ""
    
    entries_count = len(entries)
    for idx, entry in enumerate(entries):
        path = os.path.join(root_path, entry)
        connector = "└── " if idx == entries_count - 1 else "├── "
        
        # Add emoji for directories/files
        if os.path.isdir(path):
            tree_str += prefix + connector + "📁 " + entry + "/\n"
        else:
            tree_str += prefix + connector + "📄 " + entry + "\n"
        
        # Recursive call for directories
        if os.path.isdir(path):
            extension = "    " if idx == entries_count - 1 else "│   "
            tree_str += generate_directory_tree(
                path,
                prefix + extension,
                ignore_dirs,
                ignore_files,
                max_depth,
                current_depth + 1
            )
            
    return tree_str

# ============================================
# CONFIGURATION
# ============================================
ROOT_DIRECTORY = '.'
OUTPUT_FILENAME = "directory_tree_complete.txt"
STARTING_TEXT = "📁 CompleteModelwithBackend/\n"

# Folders to ignore (avoids clutter)
IGNORE_DIRECTORIES = {
    '__pycache__',
    '.next',
    'node_modules',
    '.git',
    'cache',
    'archive' # Ignoring this to keep output clean
}

# File patterns to ignore
IGNORE_FILE_PATTERNS = {
    '.pyc',
    '.log',
    '.DS_Store'
}

# Set max_depth to None for complete tree, or a number for limited depth
MAX_DEPTH = None

# ============================================
# EXECUTION
# ============================================

if __name__ == "__main__":
    print("Generating directory tree...")
    
    # Generate tree
    result = generate_directory_tree(
        ROOT_DIRECTORY,
        ignore_dirs=IGNORE_DIRECTORIES,
        ignore_files=IGNORE_FILE_PATTERNS,
        max_depth=MAX_DEPTH
    )
    
    # Save to file
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        f.write(STARTING_TEXT + result)
    
    print(f"✅ Directory tree saved to {OUTPUT_FILENAME}")
    
    # Preview
    print("\n--- PREVIEW ---")
    print(result[:1000] + "...")
