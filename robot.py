from ultralytics import YOLO
import cv2
import numpy as np

# -------------------------- 类1：A区顶部相机推理类 --------------------------
class AreaACameraDetector:
    def __init__(self, model_path, conf_threshold=0.5):
        """
        初始化A区顶部相机推理类
        :param model_path: YOLO模型路径
        :param conf_threshold: 检测置信度阈值（默认0.5）
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold

    def _get_center_coords(self, bbox):
        """私有方法：计算边界框中心坐标 [x1,y1,x2,y2] -> [cx, cy]"""
        x1, y1, x2, y2 = bbox
        return [round((x1 + x2) / 2), round((y1 + y2) / 2)]

    def _is_point_in_box(self, point, box_bbox):
        """私有方法：判断物料中心是否在盒子内"""
        cx, cy = point
        x1, y1, x2, y2 = box_bbox
        return (x1 <= cx <= x2) and (y1 <= cy <= y2)

    def infer(self, frame):
        """
        核心推理方法：处理A区视频帧，返回A区物料状态
        :param frame: A区顶部相机视频帧（cv2.Mat格式）
        :return: dict: A区物料状态（含A1、A2盒子信息）
        """
        self.model.conf = self.conf_threshold
        results = self.model(frame)
        detections = results[0]

        # 提取A区盒子和物料数据
        boxes = []  # 存储A区盒子边界框 [x1,y1,x2,y2]
        materials = []  # 存储物料数据 [(color, bbox, center), ...]

        for box in detections.boxes:
            cls_id = int(box.cls[0])
            cls_name = self.model.names[cls_id]
            bbox = box.xyxy[0].cpu().numpy()

            if cls_name == "area_box":
                boxes.append(bbox)
            elif cls_name in ["color1_material", "color2_material"]:
                color = cls_name.split("_")[0]
                center = self._get_center_coords(bbox)
                materials.append((color, bbox, center))

        # 初始化A1、A2盒子数据
        a1_data = {"coords": None, "center": None, "has_material": False, "material_color": None, "material_center": None}
        a2_data = {"coords": None, "center": None, "has_material": False, "material_color": None, "material_center": None}

        # 区分A1（左盒）、A2（右盒）
        if len(boxes) >= 2:
            boxes_sorted = sorted(boxes, key=lambda b: self._get_center_coords(b)[0])
            a1_bbox = boxes_sorted[0]
            a2_bbox = boxes_sorted[1]
            a1_data["coords"] = a1_bbox.astype(int).tolist()
            a1_data["center"] = self._get_center_coords(a1_bbox)
            a2_data["coords"] = a2_bbox.astype(int).tolist()
            a2_data["center"] = self._get_center_coords(a2_bbox)
        elif len(boxes) == 1:
            a1_bbox = boxes[0]
            a1_data["coords"] = a1_bbox.astype(int).tolist()
            a1_data["center"] = self._get_center_coords(a1_bbox)

        # 判定物料归属
        for material_color, _, material_center in materials:
            if a1_data["coords"] and self._is_point_in_box(material_center, a1_data["coords"]):
                a1_data["has_material"] = True
                a1_data["material_color"] = material_color
                a1_data["material_center"] = material_center
            elif a2_data["coords"] and self._is_point_in_box(material_center, a2_data["coords"]):
                a2_data["has_material"] = True
                a2_data["material_color"] = material_color
                a2_data["material_center"] = material_center

        # 返回标准化结果
        return {
            "A1": a1_data,
            "A2": a2_data,
            "conf_threshold": self.conf_threshold
        }

# -------------------------- 类2：B区顶部相机推理类 --------------------------
class AreaBCameraDetector:
    def __init__(self, model_path, conf_threshold=0.5):
        """
        初始化B区顶部相机推理类（与A区类结构一致）
        :param model_path: YOLO模型路径
        :param conf_threshold: 检测置信度阈值（默认0.5）
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold

    def _get_center_coords(self, bbox):
        """私有方法：计算边界框中心坐标 [x1,y1,x2,y2] -> [cx, cy]"""
        x1, y1, x2, y2 = bbox
        return [round((x1 + x2) / 2), round((y1 + y2) / 2)]

    def _is_point_in_box(self, point, box_bbox):
        """私有方法：判断物料中心是否在盒子内"""
        cx, cy = point
        x1, y1, x2, y2 = box_bbox
        return (x1 <= cx <= x2) and (y1 <= cy <= y2)

    def infer(self, frame):
        """
        核心推理方法：处理B区视频帧，返回B区物料状态
        :param frame: B区顶部相机视频帧（cv2.Mat格式）
        :return: dict: B区物料状态（含B1、B2盒子信息）
        """
        self.model.conf = self.conf_threshold
        results = self.model(frame)
        detections = results[0]

        # 提取B区盒子和物料数据
        boxes = []  # 存储B区盒子边界框 [x1,y1,x2,y2]
        materials = []  # 存储物料数据 [(color, bbox, center), ...]

        for box in detections.boxes:
            cls_id = int(box.cls[0])
            cls_name = self.model.names[cls_id]
            bbox = box.xyxy[0].cpu().numpy()

            if cls_name == "area_box":
                boxes.append(bbox)
            elif cls_name in ["color1_material", "color2_material"]:
                color = cls_name.split("_")[0]
                center = self._get_center_coords(bbox)
                materials.append((color, bbox, center))

        # 初始化B1、B2盒子数据
        b1_data = {"coords": None, "center": None, "has_material": False, "material_color": None, "material_center": None}
        b2_data = {"coords": None, "center": None, "has_material": False, "material_color": None, "material_center": None}

        # 区分B1（左盒）、B2（右盒）
        if len(boxes) >= 2:
            boxes_sorted = sorted(boxes, key=lambda b: self._get_center_coords(b)[0])
            b1_bbox = boxes_sorted[0]
            b2_bbox = boxes_sorted[1]
            b1_data["coords"] = b1_bbox.astype(int).tolist()
            b1_data["center"] = self._get_center_coords(b1_bbox)
            b2_data["coords"] = b2_bbox.astype(int).tolist()
            b2_data["center"] = self._get_center_coords(b2_bbox)
        elif len(boxes) == 1:
            b1_bbox = boxes[0]
            b1_data["coords"] = b1_bbox.astype(int).tolist()
            b1_data["center"] = self._get_center_coords(b1_bbox)

        # 判定物料归属
        for material_color, _, material_center in materials:
            if b1_data["coords"] and self._is_point_in_box(material_center, b1_data["coords"]):
                b1_data["has_material"] = True
                b1_data["material_color"] = material_color
                b1_data["material_center"] = material_center
            elif b2_data["coords"] and self._is_point_in_box(material_center, b2_data["coords"]):
                b2_data["has_material"] = True
                b2_data["material_color"] = material_color
                b2_data["material_center"] = material_center

        # 返回标准化结果
        return {
            "B1": b1_data,
            "B2": b2_data,
            "conf_threshold": self.conf_threshold
        }

# -------------------------- 类3：轨迹跟踪相机推理类 --------------------------
class TrackCameraDetector:
    def __init__(self, model_path, conf_threshold=0.5):
        """
        初始化轨迹跟踪相机推理类
        :param model_path: YOLO模型路径
        :param conf_threshold: 检测置信度阈值（默认0.5）
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold

    def infer(self, frame):
        """
        核心推理方法：处理轨迹跟踪视频帧，返回夹取状态
        :param frame: 轨迹跟踪相机视频帧（cv2.Mat格式）
        :return: dict: 夹取状态与丢失预警信息
        """
        self.model.conf = self.conf_threshold
        results = self.model(frame)
        detections = results[0]

        # 初始化返回数据
        track_data = {
            "has_gripper": False,
            "has_material": False,
            "material_color": None,
            "warning": False,
            "conf_threshold": self.conf_threshold
        }

        # 提取夹爪和物料数据
        has_gripper = False
        has_material = False
        material_color = None

        for box in detections.boxes:
            cls_id = int(box.cls[0])
            cls_name = self.model.names[cls_id]

            if cls_name == "gripper":
                has_gripper = True
            elif cls_name in ["color1_material", "color2_material"]:
                has_material = True
                material_color = cls_name.split("_")[0]

        # 赋值夹取状态与丢失预警
        track_data["has_gripper"] = has_gripper
        track_data["has_material"] = has_material
        track_data["material_color"] = material_color
        # 丢失预警逻辑：检测到夹爪但未检测到物料
        if has_gripper and not has_material:
            track_data["warning"] = True
            track_data["material_color"] = None

        return track_data