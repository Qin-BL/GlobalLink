import sys
print("Python路径:", sys.path)
try:
    import app.utils
    print("成功导入app.utils模块")
except ImportError as e:
    print(f"导入失败: {e}")