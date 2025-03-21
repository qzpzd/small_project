# tools/profiler.py
import timeit
import memory_profiler

class Timer:
    def __enter__(self):
        self.start = timeit.default_timer()
        return self
    
    def __exit__(self, *args):
        self.end = timeit.default_timer()
        self.duration = self.end - self.start
        print(f"代码执行耗时：{self.duration:.4f} 秒")

def profile(func):
    def wrapper(*args, **kwargs):
        mem_usage, result = memory_profiler.memory_usage((func, args, kwargs), retval=True, timeout=20, interval=0.1, max_usage=True)
        print(f"内存使用情况: {max(mem_usage) - mem_usage[0]:.4f} MiB")
        return result
    return wrapper