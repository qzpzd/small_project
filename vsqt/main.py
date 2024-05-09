import sys
import os
import cv2
import numpy as np
from PyQt5.QtWidgets import QMainWindow,QApplication,QWidget, QPushButton, QLabel, QFileDialog, QVBoxLayout,QTableWidgetItem
from Ui_untitled import Ui_MainWindow  #导入你写的界面类
from mobile_yolov3 import MobileNetV2_YoloV3
from PyQt5.QtGui import QPixmap, QImage
from PyQt5.QtCore import Qt, QTimer
from PIL import Image, ImageDraw, ImageFont

 
class MyMainWindow(QMainWindow, Ui_MainWindow):
    def __init__(self, parent=None):
        super(MyMainWindow, self).__init__(parent)
        self.is_playing = True  # 添加播放状态标志
        self.image_paths = []  # 存储所有图片路径
        self.current_index = 0  # 当前显示图片的索引
        # self.class_results = {}  # 初始化一个字典来存储所有类别的检测结果
        self.init_font = ImageFont.truetype("arial.ttf", 24)  # 确保字体文件存在
        self.color = 'yellow'
        self.imageflag = True
        self.detector = MobileNetV2_YoloV3()  # 初始化检测器实例

        # 正确地设置self.ui
        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)
        
        self.timer = QTimer(self)  # 初始化定时器
        self.timer.timeout.connect(self.update_frame)  # 连接定时器到更新方法

        # 连接按钮点击事件
        self.ui.pushButton.clicked.connect(self.openImage)
        self.ui.pushButton_2.clicked.connect(self.openVideoFile)
        self.ui.pushButton_4.clicked.connect(self.startCamera)
        self.ui.pushButton_3.clicked.connect(self.saveCurrentImage)
        self.ui.pushButton_5.clicked.connect(self.toggle_play_pause)
        self.ui.pushButton_6.clicked.connect(self.openImageFolder)
        self.ui.pushButton_7.clicked.connect(self.showPreviousImage)
        self.ui.pushButton_8.clicked.connect(self.showNextImage)
        self.ui.comboBox.currentIndexChanged.connect(self.on_combobox_changed)
    #读取图片
    def openImage(self):
        self.imageflag = True
        # 打开文件对话框选择图片
        self.file_name, _ = QFileDialog.getOpenFileName(self, 'Open Image', '', 'Image Files (*.png *.jpg *.jpeg)')
        if self.file_name:
            # 读取并显示图片
            pixmap = QPixmap(self.file_name)
            self.ui.label.setPixmap(pixmap)
            
            # 这里调用检测器处理图片，并显示结果
            self.detectAndDisplay(self.file_name)
    #读取图片文件夹
    def openImageFolder(self):
        self.imageflag = True
        folder_path = QFileDialog.getExistingDirectory(self, 'Select Image Folder')
        if folder_path:
            self.image_paths = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if self.image_paths:  # 如果列表不为空
                self.current_index = 0  # 重置当前索引
                self.showImageAtIndex(self.current_index)  # 显示第一张图片
    def showImageAtIndex(self, index):
        if 0 <= index < len(self.image_paths):
            pixmap = QPixmap(self.image_paths[index])
            self.ui.label.setPixmap(pixmap)
            self.file_name=self.image_paths[index]
            self.detectAndDisplay(self.file_name)  # 调用检测器处理图片
            self.current_index = index  # 更新当前索引
    #读取视频
    def openVideoFile(self):
        self.imageflag = False
        file_name, _ = QFileDialog.getOpenFileName(self, 'Open Video', '', 'Video Files (*.mp4 *.avi)')
        if file_name:
            self.video_capture = cv2.VideoCapture(file_name)
            self.timer.start(30)  # 每30毫秒更新一次图像，根据需要调整
            self.update_frame()
    #读取摄像头
    def startCamera(self):
        self.imageflag = False
        self.video_capture = cv2.VideoCapture(0)  # 使用默认摄像头
        self.timer.start(30)  # 每30毫秒更新一次图像
        self.update_frame()

    def update_frame(self):
        if self.is_playing:  # 只有当正在播放时才读取和更新图像
            ret, self.frame = self.video_capture.read()
            if ret:
                self.processAndVisualizeFrame(self.frame)
            else:
                self.timer.stop()
                self.video_capture.release()
                # self.ui.label.clear()  # 根据需要决定是否清空显示
    #保存图像
    def saveCurrentImage(self):
        # 获取QLabel中的QPixmap
        pixmap = self.ui.label.pixmap()
        if pixmap:
            # 转换QPixmap为QImage
            image = pixmap.toImage()
            # 将QImage转换为OpenCV的numpy数组
            width = image.width()
            height = image.height()
            ptr = image.bits().asstring(width * height * 4)
            arr = np.frombuffer(ptr, np.uint8).reshape((height, width, 4))  # QImage默认是ARGB，因此有4个通道

            # QImage格式为ARGB，而OpenCV默认使用BGR，因此需要调整通道顺序
            bgr_image = cv2.cvtColor(arr, cv2.COLOR_RGBA2RGB)

            # 提示用户保存文件
            filename, _ = QFileDialog.getSaveFileName(self, 'Save Image', '', 'Image Files (*.png *.jpg *.jpeg)')
            if filename:
                # 保存图像
                cv2.imwrite(filename, bgr_image)
        else:
            print("No image to save.")
        
    def on_combobox_changed(self, index):
        if index >= 0:
            # 从QComboBox中获取关联的数据
            class_name_variant = self.ui.comboBox.itemData(index, Qt.UserRole + 1)
            score_variant = self.ui.comboBox.itemData(index, Qt.UserRole + 2)

            # 更新标签文本
            if class_name_variant is not None and score_variant is not None:
                class_name = class_name_variant
                score = score_variant.format(precision=2)

                self.ui.label_3.setText(class_name)
                self.ui.label_2.setText(score)  # 显示分数并添加百分号，使用f-string格式化
            
            selected_class_name = self.ui.comboBox.itemText(index)
            if selected_class_name in self.class_results:  # 假设self.class_results存储了所有类别的结果
                self.ui.tableWidget.setRowCount(len(self.class_results[selected_class_name]))
                for row, detection in enumerate(self.class_results[selected_class_name]):
                    item_class = QTableWidgetItem(selected_class_name)
                    item_prob = QTableWidgetItem(f"{detection['prob']:.2f}")
                    item_x = QTableWidgetItem(str(detection['x']))
                    item_y = QTableWidgetItem(str(detection['y']))
                    item_w = QTableWidgetItem(str(detection['w']))
                    item_h = QTableWidgetItem(str(detection['h']))
                    
                    self.ui.tableWidget.setItem(row, 0, item_class)
                    self.ui.tableWidget.setItem(row, 1, item_prob)
                    self.ui.tableWidget.setItem(row, 2, item_x)
                    self.ui.tableWidget.setItem(row, 3, item_y)
                    self.ui.tableWidget.setItem(row, 4, item_w)
                    self.ui.tableWidget.setItem(row, 5, item_h)
            else:
                self.ui.tableWidget.setRowCount(0)  # 如果没有该类别，则清空表格
            # 获取当前选择的类别名
            selected_class_name = self.ui.comboBox.itemText(index)
            
            if self.imageflag:
                # 重置图像，去除所有标注
                image_pil = Image.open(self.file_name)  # 假设current_image_path是当前显示图像的路径
                draw = ImageDraw.Draw(image_pil)
                
                # 遍历objects，仅绘制当前选择类别的边界框和标签
                for obj in self.current_objects:  # 假设current_objects是当前图像的检测结果列表
                    if obj.label == selected_class_name:
                        self.drawpilimage(obj,draw,image_pil)
                #更新图像
                pixmap = self.piltopixmap(image_pil)
            else:
                for obj in self.current_objects:  # 假设current_objects是当前图像的检测结果列表
                    if obj.label == selected_class_name:
                        self.drawcvimage(obj,self.frame)
                # 将OpenCV图像转换为QPixmap
                pixmap = self.cvtopixmap(self.frame)
                
            self.ui.label.setPixmap(pixmap)
    def detectAndDisplay(self, image_path):
        # 使用Pillow库读取图像
        image_pil = Image.open(image_path)
        # 将PIL图像转换为numpy数组，以便模型处理（如果模型需要）
        image_np = np.array(image_pil)
        # 加载图像并使用detector进行检测
        self.current_objects = self.detector(image_np)  # 假设detector有一个方法可以直接接受路径并返回检测结果
        # self.class_results = {} 
        print(self.current_objects)
        self.class_results = self.collect_results(self.current_objects)
        # for label, probs in results.items():
        #     if label not in self.class_results:
        #         self.class_results[label] = []
        #     self.class_results[label].extend(probs)
        print("self.class_results:",self.class_results)    
        visualized_image,label,prob = self.visualize_results(image_path, self.current_objects)
        self.updateLabel(visualized_image,label,prob)
        
    def processAndVisualizeFrame(self, frame):
        # 将OpenCV图像转换为PIL图像，便于处理
        image_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        image_np = np.array(image_pil)
        # 使用detector处理图像
        self.current_objects = self.detector(image_np)
        # self.class_results = {} 
        self.class_results = self.collect_results(self.current_objects)
        # for label, probs in results.items():
        #     if label not in self.class_results:
        #         self.class_results[label] = []
        #     self.class_results[label].extend(probs)
        # print(self.class_results)
        # 可视化并更新UI
        visualized_image,label,prob = self.video_visualize_results(frame, self.current_objects)  # 更新此函数以处理图像数据据
        self.updateLabel(visualized_image,label,prob)
    def video_visualize_results(self, frame, objects):
        # 直接在原图像上绘制检测结果
        for obj in objects:
            # 清空comboBox以避免重复添加
            self.ui.comboBox.clear()
            added_labels = set() 
            if obj.label not in added_labels:
                self.ui.comboBox.addItem(f"{obj.label}")
                added_labels.add(obj.label)  # Mark label as added

                # 存储额外数据：类别名称和分数
                self.ui.comboBox.setItemData(self.ui.comboBox.count() - 1, obj.label, Qt.UserRole + 1)  # 类别名称
                self.ui.comboBox.setItemData(self.ui.comboBox.count() - 1, f"{obj.prob:.2f}", Qt.UserRole + 2)  # 分数转换为百分比后存储
                
                self.drawcvimage(obj,frame)
        # self.on_combobox_changed(0)
        # 将OpenCV图像转换为QPixmap
        frame = self.resize_frame(frame)
        pixmap = self.cvtopixmap(frame)
        return pixmap, obj.label, f"{obj.prob:.2f}"
    def visualize_results(self, image_path, objects):
        try:
            image_pil = Image.open(image_path)
            draw = ImageDraw.Draw(image_pil)

            # 清空comboBox以避免重复添加
            self.ui.comboBox.clear()
            added_labels = set() 
            # 绘制边界框和标签
            for obj in objects:
                # Add label to comboBox only if it hasn't been added yet
                if obj.label not in added_labels:
                    self.ui.comboBox.addItem(f"{obj.label}")
                    added_labels.add(obj.label)  # Mark label as added

                    # 存储额外数据：类别名称和分数
                    self.ui.comboBox.setItemData(self.ui.comboBox.count() - 1, obj.label, Qt.UserRole + 1)  # 类别名称
                    self.ui.comboBox.setItemData(self.ui.comboBox.count() - 1, f"{obj.prob:.2f}", Qt.UserRole + 2)  # 分数转换为百分比后存储
                self.drawpilimage(obj,draw,image_pil)
            # 根据计算出的比例缩放图像
            resized_image_pil = self.resize_pilimage(image_pil)
            # Assuming you want to use data from the last object processed
            if objects:  # Check if the list is not empty
                self.on_combobox_changed(0)
                last_obj = objects[-1]
                label = last_obj.label
                prob = f"{last_obj.prob:.2f}"

            pixmap = self.piltopixmap(resized_image_pil)
            
            return pixmap, label, prob

        except IOError as e:
            print(f"Error loading image: {e}")
            return QPixmap(), "", "" # 返回一个空的QPixmap作为错误处理
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return QPixmap(), "", ""# 同样返回空的QPixmap
    def resize_pilimage(self,image_pil):
        image_width, image_height = image_pil.size
        
        # 窗口尺寸
        window_width = 800
        window_height = 700
        
        # 计算缩放比例，优先保证宽度适应，同时限制高度不超过窗口高度
        scale_factor = min(window_width / image_width, window_height / image_height)
        
        # 根据计算出的比例缩放图像
        resized_image_pil = image_pil.resize((int(image_width * scale_factor), int(image_height * scale_factor)), Image.ANTIALIAS)
        return resized_image_pil
    def resize_frame(self,frame):
        # 获取当前窗口尺寸
        window_width = 800
        window_height = 700
        
        # 获取原始帧尺寸
        frame_height, frame_width = frame.shape[:2]
        
        # 计算缩放比例，优先保证宽度适应，同时限制高度不超过窗口高度
        scale_factor = min(window_width / frame_width, window_height / frame_height)
        
        # 根据计算出的比例调整帧大小
        new_frame_width = int(frame_width * scale_factor)
        new_frame_height = int(frame_height * scale_factor)
        resized_frame = cv2.resize(frame, (new_frame_width, new_frame_height))
        return resized_frame
    def drawpilimage(self, obj, draw,image_pil):
        bbox = obj.rect
        label_text = f"{obj.label} ({obj.prob:.2f})"
        
        # 确保边界框在图像范围内
        bbox.x = max(0, min(bbox.x, image_pil.width))
        bbox.y = max(0, min(bbox.y, image_pil.height))
        bbox.w = max(0, min(bbox.w, image_pil.width - bbox.x))
        bbox.h = max(0, min(bbox.h, image_pil.height - bbox.y))
        
        # 绘制边界框
        draw.rectangle([bbox.x, bbox.y, bbox.x + bbox.w, bbox.y + bbox.h], outline="yellow", width=2)
        
        # 绘制标签文本
        text_size = draw.textsize(label_text, font=self.init_font )
        text_x = bbox.x + (bbox.w - text_size[0]) // 2
        text_y = bbox.y - 5  # 文本稍微向上移一点
        draw.text((text_x, text_y), label_text, fill="yellow", font=self.init_font )
    def drawcvimage(self, obj, frame):
        bbox=obj.rect
        img_h, img_w = frame.shape[:2]
        # 确保边界框在图像范围内
        bbox.x = max(0, min(bbox.x, img_w))
        bbox.y = max(0, min(bbox.y, img_h))
        bbox.w = max(0, min(bbox.w, img_w - bbox.x))
        bbox.h = max(0, min(bbox.h, img_h - bbox.y))

        cv2.rectangle(frame, (int(bbox.x), int(bbox.y)), (int(bbox.x+bbox.w), int(bbox.y+bbox.h)), (0, 255, 0), 2)  # 绿色矩形代表检测框
        cv2.putText(frame, f"{obj.label} ({obj.prob:.2f})", (int(bbox.x), int(bbox.y-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)  # 显示标签
    def collect_results(self, objects):
        results = {}  # 用来存储每个类别的所有目标信息
        for obj in objects:
            label = obj.label
            # 对坐标信息进行格式化，保留两位小数
            x = round(obj.rect.x, 2)
            y = round(obj.rect.y, 2)
            w = round(obj.rect.w, 2)
            h = round(obj.rect.h, 2)
            result_entry = {
                'prob': round(obj.prob, 2),  # 同样保留概率的小数点后两位
                'x': x,
                'y': y,
                'w': w,
                'h': h
            }
            # 确保每个类别对应的值都是一个列表，即使只有一个目标
            if label not in results:
                results[label] = []
            # 直接添加当前目标信息到对应的类别列表中
            results[label].append(result_entry)
        
        return results
    def cvtopixmap(self,frame):
        # 将OpenCV图像转换为QPixmap
        h, w, ch = frame.shape
        bytes_per_line = ch * w
        image_qt_format = QImage(frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        return QPixmap.fromImage(image_qt_format.rgbSwapped())
    def piltopixmap(self,image_pil):
        # 保存处理后的图像到内存中的BytesIO对象，然后转换为QPixmap
        from io import BytesIO
        img_byte_arr = BytesIO()
        image_pil.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        pixmap = QPixmap()
        pixmap.loadFromData(img_byte_arr)
        return pixmap
    def updateLabel(self, image,label,prob):
        # 将图像设置到QLabel上
        self.ui.label.setPixmap(image)
        self.ui.label_3.setText(label)
        self.ui.label_2.setText(prob)
        self.ui.label_7.setText(str(len(self.class_results)))
    def toggle_play_pause(self):
        self.is_playing = not self.is_playing  # 切换播放状态
        if self.is_playing:
            self.timer.start(30)  # 如果是播放状态，启动定时器
        else:
            self.timer.stop()  # 如果是暂停状态，停止定时器
    
    def showPreviousImage(self):
        if len(self.image_paths) == 0:  # 检查图片路径列表是否为空
            return  # 如果没有图片，直接返回不做任何操作
        self.current_index = (self.current_index - 1 + len(self.image_paths)) % len(self.image_paths)  # 循环回到开头
        self.showImageAtIndex(self.current_index)

    def showNextImage(self):
        if len(self.image_paths) == 0:  # 检查图片路径列表是否为空
            return  # 如果没有图片，直接返回不做任何操作
        self.current_index = (self.current_index + 1) % len(self.image_paths)  # 循环回到结尾
        self.showImageAtIndex(self.current_index)
    
if __name__ == "__main__":
    app = QApplication(sys.argv)
    myWin = MyMainWindow()
    myWin.show()
    sys.exit(app.exec_())    