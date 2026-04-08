import cv2
import time
from robot import AreaACameraDetector, AreaBCameraDetector, TrackCameraDetector

def test_area_a_camera(model_path, camera_index=0, conf_threshold=0.5):
    """
    测试A区顶部相机
    :param model_path: YOLO模型路径
    :param camera_index: 摄像头索引（默认0）
    :param conf_threshold: 检测置信度阈值
    """
    print("=== 开始测试A区顶部相机 ===")
    detector = AreaACameraDetector(model_path, conf_threshold)
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"无法打开摄像头 {camera_index}")
        return
    
    print("按 'q' 键退出测试")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("无法读取摄像头画面")
            break
        
        result = detector.infer(frame)
        
        print(f"\nA1: {result['A1']}")
        print(f"A2: {result['A2']}")
        
        cv2.imshow("A区顶部相机 - 实时检测", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("=== A区顶部相机测试结束 ===\n")

def test_area_b_camera(model_path, camera_index=0, conf_threshold=0.5):
    """
    测试B区顶部相机
    :param model_path: YOLO模型路径
    :param camera_index: 摄像头索引（默认0）
    :param conf_threshold: 检测置信度阈值
    """
    print("=== 开始测试B区顶部相机 ===")
    detector = AreaBCameraDetector(model_path, conf_threshold)
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"无法打开摄像头 {camera_index}")
        return
    
    print("按 'q' 键退出测试")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("无法读取摄像头画面")
            break
        
        result = detector.infer(frame)
        
        print(f"\nB1: {result['B1']}")
        print(f"B2: {result['B2']}")
        
        cv2.imshow("B区顶部相机 - 实时检测", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("=== B区顶部相机测试结束 ===\n")

def test_track_camera(model_path, camera_index=0, conf_threshold=0.5):
    """
    测试轨迹跟踪相机
    :param model_path: YOLO模型路径
    :param camera_index: 摄像头索引（默认0）
    :param conf_threshold: 检测置信度阈值
    """
    print("=== 开始测试轨迹跟踪相机 ===")
    detector = TrackCameraDetector(model_path, conf_threshold)
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"无法打开摄像头 {camera_index}")
        return
    
    print("按 'q' 键退出测试")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("无法读取摄像头画面")
            break
        
        result = detector.infer(frame)
        
        print(f"\n夹取状态: {result}")
        
        cv2.imshow("轨迹跟踪相机 - 实时检测", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("=== 轨迹跟踪相机测试结束 ===\n")

def test_all_cameras(area_a_model, area_b_model, track_model, camera_indices=[0, 1, 2], conf_threshold=0.5):
    """
    测试所有三个相机
    :param area_a_model: A区模型路径
    :param area_b_model: B区模型路径
    :param track_model: 轨迹跟踪模型路径
    :param camera_indices: 三个摄像头的索引列表 [A区, B区, 轨迹跟踪]
    :param conf_threshold: 检测置信度阈值
    """
    print("=== 开始测试所有相机 ===")
    
    detectors = [
        AreaACameraDetector(area_a_model, conf_threshold),
        AreaBCameraDetector(area_b_model, conf_threshold),
        TrackCameraDetector(track_model, conf_threshold)
    ]
    
    caps = []
    for idx in camera_indices:
        cap = cv2.VideoCapture(idx)
        if not cap.isOpened():
            print(f"无法打开摄像头 {idx}")
            for c in caps:
                c.release()
            return
        caps.append(cap)
    
    print("按 'q' 键退出测试")
    
    while True:
        frames = []
        for cap in caps:
            ret, frame = cap.read()
            if not ret:
                print("无法读取摄像头画面")
                break
            frames.append(frame)
        
        if len(frames) != len(caps):
            break
        
        results = []
        for i, detector in enumerate(detectors):
            result = detector.infer(frames[i])
            results.append(result)
        
        print(f"\n{'='*50}")
        print(f"A区检测结果: A1={results[0]['A1']}, A2={results[0]['A2']}")
        print(f"B区检测结果: B1={results[1]['B1']}, B2={results[1]['B2']}")
        print(f"轨迹跟踪检测结果: {results[2]}")
        print(f"{'='*50}")
        
        cv2.imshow("A区顶部相机 - 实时检测", frames[0])
        cv2.imshow("B区顶部相机 - 实时检测", frames[1])
        cv2.imshow("轨迹跟踪相机 - 实时检测", frames[2])
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    for cap in caps:
        cap.release()
    cv2.destroyAllWindows()
    print("=== 所有相机测试结束 ===\n")

if __name__ == "__main__":
    # 配置参数
    AREA_A_MODEL = "models/area_a_model.pt"  # A区模型路径
    AREA_B_MODEL = "models/area_b_model.pt"  # B区模型路径
    TRACK_MODEL = "models/track_model.pt"    # 轨迹跟踪模型路径
    CONF_THRESHOLD = 0.5                     # 置信度阈值
    
    # 选择测试模式
    print("请选择测试模式:")
    print("1. 仅测试A区顶部相机")
    print("2. 仅测试B区顶部相机")
    print("3. 仅测试轨迹跟踪相机")
    print("4. 同时测试所有三个相机")
    
    choice = input("请输入选项 (1-4): ")
    
    if choice == "1":
        camera_idx = input("请输入A区摄像头索引 (默认0): ") or "0"
        test_area_a_camera(AREA_A_MODEL, int(camera_idx), CONF_THRESHOLD)
    elif choice == "2":
        camera_idx = input("请输入B区摄像头索引 (默认0): ") or "0"
        test_area_b_camera(AREA_B_MODEL, int(camera_idx), CONF_THRESHOLD)
    elif choice == "3":
        camera_idx = input("请输入轨迹跟踪摄像头索引 (默认0): ") or "0"
        test_track_camera(TRACK_MODEL, int(camera_idx), CONF_THRESHOLD)
    elif choice == "4":
        print("请输入三个摄像头的索引 (用空格分隔，默认: 0 1 2):")
        indices_input = input("或直接按回车使用默认值: ") or "0 1 2"
        indices = [int(idx) for idx in indices_input.split()]
        if len(indices) != 3:
            print("错误：需要输入3个摄像头索引")
        else:
            test_all_cameras(AREA_A_MODEL, AREA_B_MODEL, TRACK_MODEL, indices, CONF_THRESHOLD)
    else:
        print("无效的选项")
