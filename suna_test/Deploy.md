# 一、ADC算法部署

## 1.挂载NFS

- 打开终端，输入命令

  ```shell
  vim /etc/fstab
  ```


- 在文件末尾添加一行，根据实际情况变动

  ```
  10.21.145.127:/data01 /home/zetatech/zetaadc/data nfs defaults 0 0
  ```

- 挂载fstab，激活新挂载点（重启电脑或输入下面命令）

  ```shell
  mount -a  # 输入该命令需确保挂载点存在，若不存在，请先创建
  ```

## 2.部署ADC Infer服务

- 创建用户

  ```shell
  useradd zetatech
  ```

- 进入用户主目录

  ```
  cd ~zetatech
  ```

- 上传算法工具包

  ```
  GTA_ADC
  ├── tools                                        # 算法服务工具
  └── adc_infer.sh -> tools/docker_adc_infer.sh    # APP脚本链接
  ```

- 进入GTA_ADC目录

  ```shell
  cd GTA_ADC
  ```

- 拉取ADC推理服务镜像

  ```shell
  # 后期算法服务代码稳定后，打包的镜像需混淆推理服务代码，并加壳（目前未作特殊处理）
  docker pull zetatech/adc-infer 
  ```

- 启动算法服务

  ```shell
  sh adc_infer.sh 8 start       # 8代表启动的服务数量, 根据具体服务器配置
  ```

- 查看算法服务状态

  ```shell
  sh adc_infer.sh 8 status
  ```

- 查看算法服务日志

  ```shell
  tail -f logs/run.log
  ```

# 二、ADC算法运维

## 1. ADC服务操作

- 启动算法服务

  ```shell
  sh adc_infer.sh 1 start       # 1代表启动的服务数量, 根据具体服务器配置
  ```

- 重启算法服务

  ```shell
  sh adc_infer.sh 1 restart
  ```

- 停止算法服务

  ```shell
  sh adc_infer.sh 1 stop
  ```

- 清理算法服务

  ```shell
  sh adc_infer.sh 1 clear
  ```

- 查看算法状态

  ```shell
  sh adc_infer.sh 1 status
  ```

## 2. 查看服务日志

- 查看最新n行日志，添加-n参数即可。下面是查看最新10行的命令

  ```shell
  tail -f -n 10 logs/run.log
  ```

- 查看包含特定条件的日志（结合grep命令，包含相关字段就会输出）

  ```shell
  grep 'container_name|host_pid|record_time|record _level|module_name|other' logs/run.log
  ```

  下面是一些举例：

  ```shell
  e.g.
  # 查看包含gta_adc_inference_1和WARNING字段的日志（与逻辑）
  cat logs/run.log | grep gta_adc_inference_1 | grep WARNING
  # 查看包含gta_adc_inference_1和WARNING字段的日志（与逻辑，且有先后顺序限制）
  grep gta_adc_inference_1.*WARNING logs/run.log
  
  # 查看包含DEBUG或INFO的日志（或逻辑）
  grep -e DEBUG -e INFO logs/run.log
  grep -E 'DEBUG|INFO' logs/run.log
  
  # 查看不包含DEBUG的信息 （非逻辑）
  grep  -v DEBUG logs/run.log
  # 查看不包含DEBUG和INFO的信息 （非逻辑）
  grep  -v -E 'DEBUG|INFO' logs/run.log
  
  # 查看匹配ERROR的上下几行（-n选项为显示行号）
  grep -n -A2 ERROR logs/run.log  # 输出包含匹配及匹配后2行
  grep -n -B2 ERROR logs/run.log  # 输出包含匹配及匹配前2行
  grep -n -C2 ERROR logs/run.log  # 输出包含匹配及匹配前后各2行
  grep -n -2 ERROR logs/run.log   # 同上，输出包含匹配及匹配前后各2行
  ```

  下面时是结合`tail`命令的一些举例

  ```shell
  eg.
  # 查看最新的匹配日志，与逻辑
  tail -f logs/run.log | grep gta_adc_inference_1 | grep WARNING
  # 查看最新的匹配日志，或逻辑
  tail -f logs/run.log | grep -e DEBUG -e INFO
  # 查看最新的匹配日志，非逻辑
  tail -f logs/run.log | grep -v DEBUG
  ```

  若需将匹配日志保存为新文件，在命令后重定向即可

  ```shell
  # 如将日志文件中的匹配到ERROR的字段的日志保存到logs/error_temp.log文件
  grep ERROR logs/run.log > logs/error_temp.log
  ```

  使用grep命令时，若日志内容也出现了该字段，也会导致该条日志被匹配到。这种情况下，可尝试下面的根据列精准查找方法。

  

- 查看包含特定条件的日志（结合awk命令，根据列精准查找，查询会更加灵活，例如按时间段查询日志）

  下面是ADC算法APP中，日志设置的关系对应表

  | 变量 | 对应关系 | 实际值举例                | 解释                                                         |
  | ---- | -------- | ------------------------- | ------------------------------------------------------------ |
  | $1   | 日期     | 2024-09-10                | 日期为2024年09月10日                                         |
  | $2   | 时间     | 20:30:00.966              | 时间为20时30分00秒966微秒                                    |
  | $4   | 容器     | [gta_adc_inference_1]     | 容器名为gta_adc_inference_1                                  |
  | $5   | 进程     | MainProcess:1(45287)      | 数字45287对应的是在宿主机的进程PID，与nvidia-smi信息中的PID一致 |
  | $7   | 模块     | api.classify.inference:30 | 输出日志的logger模块为api.classify.inference                 |
  | $9   | 日志级别 | INFO:                     | 日志级别为INFO                                               |

  查找命令如下

  ```shell
  awk 'condition' logs/run.log    
  ```

  下面是一些举例：

  ```shell
  e.g.
  # 相等查找, 查询容器[gta_adc_inference_1]的日志
  awk '$3 == "[gta_adc_inference_1]"' logs/run.log    
  
  # 查询指定时间段的日志
  awk '($1" "$2) >= "2024-09-28 18:30:00"' logs/run.log
  awk '($1" "$2) >= "2024-09-28 18:30:00" && ($1" "$2) < "2024-09-29 09:00:00"' logs/run.log
  
  # 包含查找，查询INFO级别的日志
  awk '$9 ~ /INFO/' logs/run.log
  
  # 注意：
  # 若使用条件'$3 ~ /gta_adc_inference_1/'是包含查找的方式匹配容器
  # 其会匹配到gta_adc_inference_1、gta_adc_inference_10、...等容器
  # 稍加变动，可改为条件'$3 ~ /gta_adc_inference_1]/'，使其仅匹配gta_adc_inference_1
  
  # 查找容器gta_adc_inference_1中的INFO级别的日志（与逻辑）
  awk '$9 ~ /INFO/ && $3 ~ /gta_adc_inference_1]/' logs/run.log
  
  # 查找DEBUG和INFO级别的日志（或逻辑）
  awk '$9 ~ /INFO/ || $9 ~ /DEBUG/' logs/run.log
  awk '$9 ~ /INFO|DEBUG/' logs/run.log
  
  # 不包含DEBUG级别的信息（非逻辑）
  awk '$9 !~ /DEBUG/' logs/run.log
  # 不包含DEBUG和INFO级别的信息（非逻辑）
  awk '$9 !~ /INFO|DEBUG/' logs/run.log
  
  # 匹配ERROR，查看匹配及匹配后2行
  awk -v A=2 '$9 ~ /ERROR/ {a=A+1} a-->0' logs/run.log
  
  # 匹配ERROR，查看匹配及匹配前2行
  awk -v B=2 '{r[NR]=$0}                 \
    $9 ~ /ERROR/                         \
    {                                    \
      for (i=NR-B;i<=NR;i++) {           \
        if (i>0&&f[i]!=1) {              \
          print r[i];f[i]=1              \
         }                               \
       }                                 \
     }'                                  \
    logs/run.log
  
  # 匹配ERROR，查看匹配及匹配前后各2行
  awk -v C=2 'BEGIN{n=0} {r[NR]=$0;n++;} \
    $9 ~/ERROR/                          \
    {                                    \
      for (i=NR-C;i<=NR+C;i++) {         \
        mask[i]=1                        \
      }                                  \
    } END{for(i=1;i<=n;i++) {            \
      if(i in mask) {                    \
        print r[i]}                      \
      }                                  \
    }'                                   \
    logs/run.log
  ```

  下面时是结合`tail`命令的一些举例

  ```shell
  # 查看最新的匹配日志，与逻辑
  tail -f  logs/run.log | awk '$9 ~ /INFO/ && $3 == "[gta_adc_inference_1]"'
  # 查看最新的匹配日志，或逻辑
  tail -f  logs/run.log | awk '$9 ~ /INFO/ || $9 ~ /DEBUG/'
  ```

  若需将匹配日志保存为新文件，在命令后重定向即可

  ```shell
  # 如将日志文件中的匹配到ERROR的字段的日志保存到logs/error_temp.log文件
  awk '$9 ~ /ERROR/' logs/run.log > logs/error_temp.log
  ```

- 查看日志的总行数

  ```shell
  cat logs/run.log | wc -l
  ```

- 查看特定条件日志的记录行数

  ```shell
  # 匹配关键字统计
  grep 'match_key' logs/run.log | wc -l   # 需将match_key替换为具体匹配关键字
  # 根据列的筛选条件匹配
  awk 'condition' logs/run.log | wc -l    # 需将condition替换为具体匹配条件
  ```

