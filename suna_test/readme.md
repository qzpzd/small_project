```text
FS 项目目录结构
├── FS_main.py
├── utils
│   ├── __init__.py
│   ├── log.py
│   ├── kafka.py
│   ├── load_config.py
│   └── update_config.py
└── Fitting
    ├── api
    │   ├── __init__.py
    │   ├── fitting
    │   │   ├── __init__.py
    │   │   ├── fitting.py
    │   │   └── fitting_rotate.py
    │   └── data_preprocess
    │       ├── __init__.py
    │       └── data_preprocess.py
    ├── tools
    │   ├── __init__.py
    │   ├── scanxz_yz.py
    │   ├── get_xyz_row_col.py
    │   ├── get_csv_row_col.py
    │   ├── scan_csv.py
    │   ├── find_filedir_xz_yz.py
    │   └── delete_files.py
    └── test
        ├── __init__.py
        └── fitting_test_file_copy.py
```

# 项目说明文档

## 一、项目概述
本项目基于 Kafka 消息队列，实现对光学表面测量文件（`.xyz`、`.csv`）的分布式并行预处理、非球面拟合计算（曲率半径 ROC、圆锥常数 Conic、高次 A 系数）、结果可视化及汇总。  
主要功能：  
- 从 Kafka 订阅任务并消费消息  
- 动态生成配置并更新模型参数  
- 数据预处理（转 `.xz`/`.yz`、并行加速）  
- 拟合算法计算（本地/并行、多种拟合策略）  
- 绘制拟合曲线并保存图像  
- 将结果写入 CSV/Excel，并将状态通过 Kafka 发送回调

## 二、模块结构

1. **FS_main.py**  
   - 程序入口，完成日志配置、加载/更新配置、创建 `KafkaConsumerProducer`  
   - 通过 `consumer_producer.run(algorithm_func=process_config)` 拉起消息监听  

2. **utils/**  
   - `log.py`：封装 `logging` 日志配置与格式化  
   - `kafka.py`：Kafka 消费者/生产者类 `KafkaConsumerProducer`  
   - `load_config.py`：默认配置加载函数 `load_config_default`  
   - `update_config.py`：动态更新配置函数 `update_model_configuration`、`save_configuration`  

3. **Fitting/api/fitting/**  
   - `fitting.py`：核心类 `Fitting`，实现数据加载、并行预处理、调用拟合函数、生成图表、输出结果  
     - `run` / `run_copy`：针对新计算和更新历史两种流程  
     - `save_plot_2`：生成并保存拟合残差图  
     - `fitrocrms4_ho1` 等：封装 ROC/Conic 搜索、残差计算、最优解提取  
   - `fitting_rotate.py`：辅助旋转变换函数 `rotate3`、`rotate31`，用于残差平面旋转  

4. **Fitting/api/data_preprocess/**  
   - `data_preprocess.py`：`PreprocessData` 类  
     - `preprocess_xyz` / `preprocess_csv`：读取原始文件，筛选有效区域，输出 `.xz`/`.yz`  
     - 并行版本 `preprocess_xyz_parallel`：使用 `ThreadPoolExecutor` 提升转码速度  

5. **Fitting/tools/**  
   - 文件扫描与行列信息提取等工具函数：  
     - `scanxz_yz.py`：读取 `.xz`/`.yz` 文件  
     - `get_xyz_row_col.py`、`get_csv_row_col.py`：根据序号定位行列  
     - `scan_csv.py`：读取并归一化 CSV 数据  
     - `find_filedir_xz_yz.py`：查找成对的 `.xz`/`.yz` 文件  
     - `delete_files.py`：批量删除目录下的中间 CSV  

6. **Fitting/test/**  
   - `fitting_test_file_copy.py`：测试或示例脚本，提供 `kafka_run`、`process_config` 等供 `FS_main.py` 调用  

## 三、执行流程

1. 启动 `FS_main.py`：  
   - 配置日志  
   - 加载默认参数、动态更新模型配置  
   - 创建并启动 `KafkaConsumerProducer`，订阅请求与响应 Topic  

2. 收到 Kafka 消息后执行 `process_config`：  
   - 解析消息体，生成 `Fitting` 实例  
   - 调用 `Fitting.run()` 或 `run_copy()` 开始处理  

3. `Fitting` 类内：  
   - 数据预处理：调用 `PreprocessData` 转码得到 `x, z` 序列  
   - 并行或单线程执行拟合：在 ROC/Conic 搜索空间中计算残差，选出最优解  
   - 生成残差图（`.png`）并保存到输出目录  
   - 汇总结果写入 CSV/Excel  

4. 任务完成，Kafka 生产者发送状态消息到响应 Topic，`FS_main.py` 记录日志并退出或继续监听。

## 四、关键点说明

- **并行处理**：数据预处理支持串行和并行两种方式，可通过 `configuration.algorithm_is_use_parallel` 开关。  
- **动态 A 系数**：在拟合过程中，高次项系数通过配置注入，并自动排序、缩放。  
- **自动/手动 ROC**：`isauto` 参数控制 ROC 搜索方式；`levelpercent` 控制是否对残差进行水平旋转对齐。  
- **容器化识别**：通过环境变量 `HOSTNAME` 获取容器 ID，用于生成唯一输出文件名。  
- **可扩展性**：  
  - 新增文件格式只需在 `PreprocessData` 中加入对应处理逻辑  
  - 拟合算法可替换或并行化接口  

以上即为项目的目录结构与整体说明，后续可根据需求细化各模块 API 和配置项文档。
