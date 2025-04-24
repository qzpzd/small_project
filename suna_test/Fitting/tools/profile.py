# tools/profiler.py
import timeit
import memory_profiler
import time

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
        start_time = time.time()
        mem_usage, result = memory_profiler.memory_usage((func, args, kwargs), retval=True, timeout=20, interval=0.1, max_usage=True)
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(mem_usage)
        # print(f"内存使用情况: {max(mem_usage) - mem_usage[0]:.4f} MiB")
        print(f"函数执行耗时: {elapsed_time:.4f} 秒")
        return result
    return wrapper