import numpy as np
def convertxyz_to_float_lists(x, xz, y, yz):
        def convert(lst):
            try:
                arr = np.array(lst, dtype=float)
                return arr.tolist()
            except ValueError:
                # 处理无法转换为 float 的元素
                result = []
                for item in lst:
                    try:
                        result.append(float(item))
                    except ValueError:
                        result.append(None)
                return result

        x = convert(x)
        xz = convert(xz)
        y = convert(y)
        yz = convert(yz)

        return x, xz, y, yz
def convertcsv_to_float_lists(x, xz):
        def convert(lst):
            try:
                arr = np.array(lst, dtype=float)
                return arr.tolist()
            except ValueError:
                # 处理无法转换为 float 的元素
                result = []
                for item in lst:
                    try:
                        result.append(float(item))
                    except ValueError:
                        result.append(None)
                return result

        x = convert(x)
        xz = convert(xz)

        return x, xz