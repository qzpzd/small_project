# USE_RANDOM_NUMBER_NINE = False  # 九抽一是否使用随机数
# UNDER_WAFER_ADD_MAX_NUMBER = True  # 下片加上上片最大行数
# 根据算法内部需求添加配置参数
# USE_RANDOM_NUMBER_NINE = True  # 九抽一是否使用随机数
# UNDER_WAFER_ADD_MAX_NUMBER = True  # 下片加上上片最大行数
# algorithm_is_use_parallel = True
# algorithm_max_parallel_num = 2
USE_RANDOM_NUMBER_NINE = True  # USE_RANDOM_NUMBER_NINE = False
UNDER_WAFER_ADD_MAX_NUMBER = True  # UNDER_WAFER_ADD_MAX_NUMBER = True
algorithm_is_use_parallel = False
algorithm_max_parallel_num = 1
__options__ = (
    ("USE_RANDOM_NUMBER_NINE", bool, True),
    ("UNDER_WAFER_ADD_MAX_NUMBER", bool, True),
    ("algorithm.is_use_parallel", bool, False),
    ("algorithm.max_parallel_num", int, 1)
)