//#include "QtWidgetsApplication2.h"
//#include <QFile>
//#include <QTextStream>
//#include <QFileDialog>
//#include <QFontDialog>
//#include <QMessageBox>
//#include <opencv2/opencv.hpp>
//#include <QImage>
//#include <QLabel>
//#include <QPixmap>
//#include <onnxruntime_c_api.h>
//#include <onnxruntime_cxx_api.h>
//#include <opencv2/core.hpp>
//#include <QPainter>
//#include <filesystem>
//#include <algorithm> // for std::sort, std::remove_if
//
//
//using namespace cv;
//using namespace Ort;
//
//
//struct DetectionObject {
//    cv::Rect bbox; // 边界框
//    float confidence_score;
//
//    // 可能还包括类别标签（若模型输出包含类别信息）
//};
//std::vector<DetectionObject> detection_objects;
//bool compare_detection_objects(const DetectionObject& a, const DetectionObject& b)
//{
//    return a.confidence_score > b.confidence_score;
//}
//double compute_iou(const cv::Rect& rect1, const cv::Rect& rect2)
//{
//    cv::Rect intersection = rect1 & rect2; // 计算交集
//    cv::Rect union_rect = rect1 | rect2; // 计算并集
//
//    double iou = static_cast<double>(intersection.area()) / union_rect.area();
//    return iou;
//}
//std::vector<DetectionObject> apply_nms(const std::vector<DetectionObject>& objects, double iou_threshold)
//{
//    std::vector<DetectionObject> sorted_objects(objects);
//    std::sort(sorted_objects.begin(), sorted_objects.end(), compare_detection_objects);
//
//    std::vector<bool> keep_flags(sorted_objects.size(), true);
//    for (size_t i = 0; i < sorted_objects.size(); ++i)
//    {
//        if (!keep_flags[i])
//            continue;
//
//        const auto& obj_i = sorted_objects[i];
//        for (size_t j = i + 1; j < sorted_objects.size(); ++j)
//        {
//            if (!keep_flags[j])
//                continue;
//
//            const auto& obj_j = sorted_objects[j];
//            double overlap = compute_iou(obj_i.bbox, obj_j.bbox);
//            if (overlap >= iou_threshold)
//            {
//                keep_flags[j] = false;
//            }
//        }
//    }
//
//    std::vector<DetectionObject> filtered_objects;
//    filtered_objects.reserve(sorted_objects.size());
//    for (size_t j = 0; j < sorted_objects.size(); ++j)
//    {
//        if (keep_flags[j])
//        {
//            filtered_objects.push_back(sorted_objects[j]);
//        }
//    }
//
//    return filtered_objects;
//}
//
//QtWidgetsApplication2::QtWidgetsApplication2(QWidget* parent)
//    : QMainWindow(parent)
//{
//    ui.setupUi(this);
//    QToolButton* button = ui.toolButton;
//
//    // 连接QPushButton的clicked信号到QtWidgetsApplication2的on_openImage槽
//    connect(button, &QToolButton::clicked, this, &QtWidgetsApplication2::on_openImage);
//}
//
//QtWidgetsApplication2::~QtWidgetsApplication2()
//{}
//
//void QtWidgetsApplication2::on_openImage(bool checked)
//{
//    QString imgName = QFileDialog::getOpenFileName(this, tr("打开图片"), "", tr("JPG Files (*.jpg);;PNG Files (*.png);;All Files (*)"));
//
//    if (!imgName.isEmpty()) {
//        demoModel(imgName.toStdString().c_str());
//    }
//}
//
//void QtWidgetsApplication2::demoModel(const char* imagePath)
//{
//    Ort::Env env;
//    Ort::SessionOptions session_options;
//    session_options.SetIntraOpNumThreads(1); // 可选：设置线程数
//    session_options.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL); // 可选：启用所有优化级别
//
//    Ort::Session session{ env, LR"(C:/Users/Administrator/source/repos/QtWidgetsApplication2/QtWidgetsApplication2/best.onnx)", session_options };
//
//    static constexpr const int width_ = 640; // 模型输入宽度
//    static constexpr const int height_ = 384; // 模型输入高度
//    Ort::Value input_tensor_{ nullptr };
//    std::array<int64_t, 4> input_shape_{ 1, 3, height_, width_ }; // NCHW, 1x3xHxW
//
//    // 将大数组移到堆上动态分配
//    std::vector<float> input_image(width_ * height_ * 3); // 输入图片，HWC
//    
//    cv::Mat img = cv::imread(imagePath);
//    cv::Mat preprocessed_img = preprocess_image(img, height_, width_);
//    
//// 将预处理后的图像数据填充到input_image_
//    for (int i = 0; i < static_cast<int>(height_); ++i) {
//        for (int j = 0; j < static_cast<int>(width_); ++j) {
//            const cv::Vec3b& pixel = preprocessed_img.at<cv::Vec3b>(i, j);
//
//            // 明确地将每个操作数转换为long long，以避免潜在的溢出
//            long long idx_base = static_cast<long long>(i) * static_cast<long long>(width_);
//            long long idx = idx_base * 3 + static_cast<long long>(j) * 3;
//
//            input_image[idx + 0] = pixel[2]; // R
//            input_image[idx + 1] = pixel[1]; // G
//            input_image[idx + 2] = pixel[0]; // B
//        }
//    }
//    
//    
//    auto memory_info = Ort::MemoryInfo::CreateCpu(OrtDeviceAllocator, OrtMemTypeCPU);
//    Ort::Value inputTensor = Ort::Value::CreateTensor<float>(memory_info, input_image.data(), input_image.size(), input_shape_.data(), input_shape_.size());
//
//    
//    const char* inputNames[] = { "images" }; // 输入节点名称列表，假设只有一个输入节点
//    const char* outputNames[] = { "output0" }; // 输出节点名称列表，假设只有一个输出节点
//    /*try
//    {*/
//    std::vector<Ort::Value> outputValues = session.Run(Ort::RunOptions{ nullptr }, inputNames, &inputTensor, 1, outputNames, 1);
//   
//    // 获取输出形状信息
//    Ort::TypeInfo type_info = outputValues[0].GetTypeInfo();
//    Ort::TensorTypeAndShapeInfo shape_info = type_info.GetTensorTypeAndShapeInfo();
//
//    // 获取输出维度
//    size_t num_dims = shape_info.GetDimensionsCount();
//    std::vector<int64_t> output_dims(num_dims);
//    shape_info.GetDimensions(output_dims.data(), num_dims);
//    float* output_data = outputValues[0].GetTensorMutableData<float>();
//    // 假设输出张量按行存储检测目标信息
//    for (size_t i = 0; i < output_dims[0]; i++) // 遍历所有检测目标
//
//    {
//        float* row_data = output_data + i * output_dims[1];
//
//        float confidence = row_data[4];
//        int x1 = static_cast<int>(row_data[0] * img.cols);
//        int y1 = static_cast<int>(row_data[1] * img.rows);
//        int x2 = static_cast<int>(row_data[2] * img.cols);
//        int y2 = static_cast<int>(row_data[3] * img.rows);
//
//        DetectionObject obj;
//        
//        obj.bbox.x = x1;
//        obj.bbox.y = y1;
//        obj.bbox.width = x2 - x1;
//        obj.bbox.height = y2 - y1;
//        obj.confidence_score = confidence;
//
//        detection_objects.push_back(obj);
//    }
//
//    double nms_threshold = 0.5; // 调整此阈值以适应您的需求
//    std::vector<DetectionObject> filtered_objects = apply_nms(detection_objects, nms_threshold);
//    cv::Mat annotated_img = img.clone(); // 创建图像副本
//
//    for (const auto& obj : filtered_objects)
//    {   
//        cv::Rect bbox = obj.bbox; // 假设 obj.bbox 是一个 cv::Rect 类型，或者您可以直接从其属性提取 x, y, width, height
//
//        // 计算右下角坐标
//        int right = bbox.x + bbox.width;
//        int bottom = bbox.y + bbox.height;
//
//        // 使用左上角与右下角坐标绘制矩形
//        cv::Point top_left(bbox.x, bbox.y);
//        cv::Point bottom_right(right, bottom);
//        cv::rectangle(annotated_img, top_left, bottom_right, cv::Scalar(0, 255, 0), 2); // 绿色边框
//
//        // 可选：在边界框内显示信心分数
//        std::ostringstream ss;
//        ss << std::fixed << std::setprecision(2) << obj.confidence_score;
//        cv::putText(annotated_img, ss.str(), cv::Point(obj.bbox.x, obj.bbox.y - 10), cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 0, 255), 1, cv::LINE_AA);
//    }
//
//    // 将 OpenCV Mat 转换为 QPixmap
//    QPixmap pixmap = QPixmap::fromImage(QImage(annotated_img.data, annotated_img.cols, annotated_img.rows, QImage::Format_RGB888).rgbSwapped());
//
//    // 在 QLabel 上显示标注后的图像
//    ui.label_6->setPixmap(pixmap);
//
//
//    // 输出形状和维度信息（仅作示例）
//    qDebug() << "Output shape: (" << output_dims[0] << ", " << output_dims[1] << ", " << output_dims[2] <<")";
//
//    //// 获取输出数据
//    //float* output_data = outputValues[0].GetTensorMutableData<float>();
//
//    // 处理输出数据（具体取决于您的模型输出含义）
//    for (size_t i = 0; i < output_dims[2]; i++)
//    {
//        qDebug() << "Output value[" << i << "]: " << output_data[i];
//    }
//    /*}
//    catch (const Ort::Exception& e)
//    {
//        qDebug() << "ONNX Runtime Exception caught: " << e.what();
//    }*/
//
//    // 输出形状和维度信息（仅作示例）
//    qDebug() << "filtered_objects shape: (" << output_dims[0] << ", " << output_dims[1] << ", " << output_dims[2] << ")";
//}
//
//cv::Mat QtWidgetsApplication2::preprocess_image(const cv::Mat& img, int target_height, int target_width)
//{
//    cv::Mat resized_img;
//    cv::resize(img, resized_img, cv::Size(target_width, target_height));
//    cv::cvtColor(resized_img, resized_img, cv::COLOR_BGR2RGB);
//    /*cv::Mat img_float;
//    resized_img.convertTo(img_float, CV_32FC3, 1.0 / 255.0);*/
//    
//    return resized_img;
//}
//
//
#include <iostream>
#include "net.h"
#include "QtWidgetsApplication2.h"
#include "./ui_QtWidgetsApplication2.h"
#include <QFile>
#include <QTextStream>
#include <QFileDialog>
#include <QFontDialog>
#include <QMessageBox>
#include <QDirIterator> 
#include <QImage>
#include <QLabel>
#include <QPixmap>
#include <QTimer>
#include <opencv2/opencv.hpp>
#include <opencv2/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>

using namespace cv;

QtWidgetsApplication2::QtWidgetsApplication2(QWidget* parent)
    : QMainWindow(parent)
{
    ui.setupUi(this);
    QToolButton* button = ui.toolButton;
	QToolButton* button_2 = ui.toolButton_2;
	QToolButton* button_3 = ui.toolButton_3;
	QToolButton* button_4 = ui.toolButton_4;
	QToolButton* button_5 = ui.toolButton_5;
	QToolButton* button_6 = ui.toolButton_6;
	QComboBox* comboBox = ui.comboBox;
	// 假设你在UI中已经创建了QSpinBox，其对象名为spinBoxConfidence和spinBoxNMS
	ui.spinBox->setRange(0, 100); // 设置范围，这里以百分比形式表示
	ui.spinBox_2->setRange(0, 100);
	connect(ui.spinBox, QOverload<int>::of(&QSpinBox::valueChanged), this, &QtWidgetsApplication2::onConfidenceThresholdChanged);
	connect(ui.spinBox_2, QOverload<int>::of(&QSpinBox::valueChanged), this, &QtWidgetsApplication2::onNMSThresholdChanged);
    // 连接QPushButton的clicked信号到QtWidgetsApplication2的on_openImage槽
    connect(button, &QToolButton::clicked, this, &QtWidgetsApplication2::on_openImage);
	connect(button_2, &QToolButton::clicked, this, &QtWidgetsApplication2::on_openFolderButton_clicked);
	connect(button_3, &QToolButton::clicked, this, &QtWidgetsApplication2::openVideo);
	connect(button_4, &QToolButton::clicked, this, &QtWidgetsApplication2::on_saveImageButton_clicked);
	connect(button_5, &QToolButton::clicked, this, &QtWidgetsApplication2::on_startCameraButton_clicked);
	connect(button_6, &QToolButton::clicked, this, &QtWidgetsApplication2::on_stopOperationButton_clicked);
	connect(comboBox, QOverload<int>::of(&QComboBox::currentIndexChanged), this, &QtWidgetsApplication2::onComboBoxChanged);
	
}

QtWidgetsApplication2::~QtWidgetsApplication2()
{}

void QtWidgetsApplication2::on_openImage(bool checked)
{
    QString imgName = QFileDialog::getOpenFileName(this, tr("打开图片"), "", tr("JPG Files (*.jpg);;PNG Files (*.png);;All Files (*)"));
    demoModel(imgName);
}
void QtWidgetsApplication2::on_openFolderButton_clicked()
{
	QString folderPath = QFileDialog::getExistingDirectory(this, tr("选择文件夹"));
	if (!folderPath.isEmpty())
	{
		QDirIterator it(folderPath, QStringList() << "*.jpg" << "*.png", QDir::Files, QDirIterator::Subdirectories);
		while (it.hasNext())
		{
			QString filePath = it.next();
			demoModel(filePath); // 处理每一个图片
		}
	}
}
void QtWidgetsApplication2::openVideo()
{
	QString videoPath = QFileDialog::getOpenFileName(this, tr("打开视频"), "", tr("Video Files (*.mp4 *.avi)"));
	if (!videoPath.isEmpty())
	{
		videoPlayer.open(videoPath.toStdString());
		if (!videoPlayer.isOpened())
		{
			QMessageBox::warning(this, "错误", "无法打开视频文件");
			return;
		}

		// 启动视频处理的定时器
		videoTimer = new QTimer(this);
		connect(videoTimer, &QTimer::timeout, this, &QtWidgetsApplication2::processVideoFrame);
		videoTimer->start(30); // 每30ms处理一帧，根据需要调整
		isVideoPlaying = true;
	}
}

void QtWidgetsApplication2::processVideoFrame()
{
	cv::Mat frame;
	if (videoPlayer.read(frame)) // 从视频读取一帧
	{
		video_demoModel(frame); // 处理视频帧
		//displayFrame(frame);
	}
	else
	{
		videoPlayer.release();
		videoTimer->stop();
		delete videoTimer;
		videoTimer = nullptr;
		isVideoPlaying = false;
		QMessageBox::information(this, "提示", "视频播放结束");
	}
}
void QtWidgetsApplication2::video_demoModel(cv::Mat im0)
{
	if (true) {
		// 在开始处理新图片前，先清空组合框
		ui.comboBox->clear();

		int width = im0.cols;
		int height = im0.rows;

		const int width_new = 700;
		const int height_new = 500;

		float ratio = static_cast<float>(width) / height;
		int new_height, new_width;

		if (ratio >= static_cast<float>(width_new) / height_new) {
			new_width = width_new;
			new_height = static_cast<int>(height * ratio * width_new / width);
		}
		else {
			new_height = height_new;
			new_width = static_cast<int>(width / ratio * height_new / height);
		};

		cv::resize(im0, im0, cv::Size(new_width, new_height));

		ncnn::Net detector;
		detector.load_param("models/yolo-fastest/yolo-fastest-1.1.param");
		detector.load_model("models/yolo-fastest/yolo-fastest-1.1.bin");
		int detector_size_width = 300;
		int detector_size_height = 300;

		static const char* class_names[] = { "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
		"fire hydrant","stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
		"giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
		"kite","baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
		"knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
		"donut","cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
		"keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
		"scissors","teddy bear", "hair drier", "toothbrush"
		};

		cv::Mat bgr = im0.clone();
		int image_width = bgr.cols;
		int image_height = bgr.rows;

		ncnn::Mat input = ncnn::Mat::from_pixels_resize(bgr.data, ncnn::Mat::PIXEL_BGR2RGB,
			bgr.cols, bgr.rows, detector_size_width, detector_size_height);
		const float mean_vals[3] = { 0.f, 0.f, 0.f };
		const float norm_vals[3] = { 1 / 255.f,1 / 255.f,1 / 255.f };
		input.substract_mean_normalize(mean_vals, norm_vals);

		// 在执行推理前记录当前时间
		auto start = std::chrono::high_resolution_clock::now();
		ncnn::Extractor ex = detector.create_extractor();
		ex.set_num_threads(8);
		ex.input("data", input);
		ncnn::Mat out;
		ex.extract("output", out);
		// 推理结束后记录当前时间
		auto end = std::chrono::high_resolution_clock::now();
		std::chrono::duration<double, std::milli> elapsed = end - start;
		double inferenceTimeMs = elapsed.count();

		for (int i = 0; i < out.h; ++i) {
			int label;
			float x1, y1, x2, y2, score;
			const float* values = out.row(i);

			label = values[0] - 1;
			std::cout << "The answer is: " << label << '\n';
			score = values[1];
			// 应用置信度阈值过滤
			if (score * 100 < confidenceThreshold * 100) continue; // 如果分数低于阈值则跳过
			x1 = values[2] * image_width;
			y1 = values[3] * image_height;
			x2 = values[4] * image_width;
			y2 = values[5] * image_height;

			if (x1 < 0)x1 = 0;
			if (y1 < 0)y1 = 0;
			if (x2 < 0)x2 = 0;
			if (y2 < 0)y2 = 0;
			if (x1 > image_width)x1 = image_width;
			if (y1 > image_height)y1 = image_height;
			if (x2 > image_width)x2 = image_width;
			if (y2 > image_height)y2 = image_height;

			cv::rectangle(im0, cv::Point(x1, y1), cv::Point(x2, y2), cv::Scalar(255, 255, 0), 1, 1, 0);

			char text[256];
			sprintf_s(text, "%s %.1f%%", class_names[label], score * 100);
			int baseLine = 0;
			cv::Size label_size = cv::getTextSize(text, cv::FONT_HERSHEY_SIMPLEX, 0.5, 1, &baseLine);
			cv::putText(im0, text, cv::Point(x1, y1 + label_size.height),
				cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 0, 0));

			QString itemText = class_names[label] + ' ' + QString::number(score * 100, 'f', 2); // 将类别和分数结合为一项的文本
			ui.comboBox->addItem(class_names[label] + QString::number(i));

			// 存储额外数据：类别名称和分数
			ui.comboBox->setItemData(ui.comboBox->count() - 1, class_names[label], Qt::UserRole + 1); // 类别名称
			ui.comboBox->setItemData(ui.comboBox->count() - 1, score * 100, Qt::UserRole + 2); // 分数
			// 存储x1, y1, x2, y2
			ui.comboBox->setItemData(ui.comboBox->count() - 1, x1, Qt::UserRole + 3); // 类别名称
			ui.comboBox->setItemData(ui.comboBox->count() - 1, y1, Qt::UserRole + 4); // 分数
			ui.comboBox->setItemData(ui.comboBox->count() - 1, x2, Qt::UserRole + 5); // 类别名称
			ui.comboBox->setItemData(ui.comboBox->count() - 1, y2, Qt::UserRole + 6); // 分数

			onComboBoxChanged(0);
		}

		cv::imshow("demo", im0);
		cv::waitKey(0);
		// 创建QImage并转换为QPixmap
		QImage image((uchar*)im0.data, im0.cols, im0.rows, im0.step, QImage::Format_RGB888);
		QPixmap pixmap = QPixmap::fromImage(image.rgbSwapped());
		ui.label_6->setPixmap(pixmap.scaled(ui.label_6->width(), ui.label_6->height()));
		ui.label_4->setText(QString::number(out.h));
		// 显示推理时间在ui.label_5上
		ui.label_5->setText(QString("Inference Time: %1 ms").arg(inferenceTimeMs));

	}
}
void QtWidgetsApplication2::startCamera()
{
	if (!isCameraRunning)
	{
		cap.open(0); // 打开默认摄像头
		if (!cap.isOpened())
		{
			QMessageBox::warning(this, "错误", "无法打开摄像头");
			return;
		}
		isCameraRunning = true;

		// 设置定时器，用于定期调用处理帧的槽函数
		cameraTimer = new QTimer(this);
		connect(cameraTimer, &QTimer::timeout, this, &QtWidgetsApplication2::timerUpdate);
		cameraTimer->start(30); // 假设每30毫秒更新一次，根据需要调整
	}
	else
	{
		stopCamera(); // 如果已经在运行，则停止
	}
}

void QtWidgetsApplication2::timerUpdate()
{
	cv::Mat frame;
	cap >> frame; // 从摄像头读取一帧
	if (!frame.empty())
	{
		video_demoModel(frame);
		displayFrame(frame);
	}
	else
	{
		stopCamera(); // 如果读取帧失败（如摄像头断开），则停止
	}
}

void QtWidgetsApplication2::stopCamera()
{
	if (cameraTimer)
	{
		cameraTimer->stop();
		delete cameraTimer;
		cameraTimer = nullptr;
	}
	if (cap.isOpened())
	{
		cap.release();
	}
	isCameraRunning = false;
}

void QtWidgetsApplication2::displayFrame(const cv::Mat& frame)
{
	// 将cv::Mat转换为QImage并显示在ui.label_6上
	QImage qImage(frame.cols, frame.rows, QImage::Format_RGB888);
	for (int row = 0; row < frame.rows; row++) {
		for (int col = 0; col < frame.cols; col++) {
			qImage.setPixel(col, row, qRgb(frame.at<cv::Vec3b>(row, col)[2],
				frame.at<cv::Vec3b>(row, col)[1],
				frame.at<cv::Vec3b>(row, col)[0]));
		}
	}
	ui.label_6->setPixmap(QPixmap::fromImage(qImage.rgbSwapped()));
}

void QtWidgetsApplication2::on_startCameraButton_clicked()
{
	startCamera();
}
// 假设还有一个用于停止摄像头的按钮
//void QtWidgetsApplication2::on_stopCameraButton_clicked()
//{
//	stopCamera();
//}
void QtWidgetsApplication2::on_stopOperationButton_clicked()
{
	if (isCameraRunning)
	{
		stopCamera();
	}
	else if (isVideoPlaying)
	{
		videoPlayer.release();
		videoTimer->stop();
		delete videoTimer;
		videoTimer = nullptr;
		isVideoPlaying = false;
	}
}
void QtWidgetsApplication2::onComboBoxChanged(int index)
{
	if (index >= 0) {
		// 从QComboBox中获取关联的数据
		QVariant class_name_variant = ui.comboBox->itemData(index, Qt::UserRole + 1);
		QVariant score_variant = ui.comboBox->itemData(index, Qt::UserRole + 2);
		QVariant x1_variant = ui.comboBox->itemData(index, Qt::UserRole + 3);
		QVariant y1_variant = ui.comboBox->itemData(index, Qt::UserRole + 4);
		QVariant x2_variant = ui.comboBox->itemData(index, Qt::UserRole + 5);
		QVariant y2_variant = ui.comboBox->itemData(index, Qt::UserRole + 6);

		// 更新标签文本
		if (!class_name_variant.isNull() && !score_variant.isNull()) {
			QString class_name = class_name_variant.toString();
			double score = score_variant.toDouble();
			double x1 = x1_variant.toDouble();
			double y1 = y1_variant.toDouble();
			double x2 = x2_variant.toDouble();
			double y2 = y2_variant.toDouble();

			ui.label_8->setText(class_name);
			ui.label_7->setText(QString::number(score, 'f', 2) + "%"); // 显示分数并添加百分号
			ui.label_9->setText(QString::number(x1));
			ui.label_10->setText(QString::number(y1));
			ui.label_11->setText(QString::number(x2));
			ui.label_12->setText(QString::number(y2));
		}
	}
}

void QtWidgetsApplication2::demoModel(QString imgName)
{	
    if (!imgName.isEmpty()) {

		// 在开始处理新图片前，先清空组合框
		ui.comboBox->clear();
	
        // 使用OpenCV读取图片
        cv::Mat im0 = cv::imread(imgName.toStdString());

		video_demoModel(im0);
		
    }
 }
void QtWidgetsApplication2::on_saveImageButton_clicked()
{
	QString imagePath = QFileDialog::getSaveFileName(this, tr("保存图片"), "", tr("JPEG (*.jpg);;PNG (*.png)"));
	if (!imagePath.isEmpty())
	{
		QPixmap pixmap = ui.label_6->pixmap(Qt::ReturnByValue);
		// 直接保存QPixmap为文件，无需转换到cv::Mat
		if (!pixmap.save(imagePath))
		{
			QMessageBox::warning(this, "错误", "保存图片失败！");
		}
		else
		{
			QMessageBox::information(this, "成功", "图片已保存！");
		}
	}
}
 //void saveImage(cv::Mat image, const QString& fileName)
 //{
	// cv::imwrite(fileName.toStdString(), image);
 //}

 //void saveVideo(cv::Mat image, cv::VideoWriter& videoWriter)
 //{
	// videoWriter.write(image);
 //}

 //// 触发保存图像的逻辑
 //void QtWidgetsApplication2::on_saveImageButton_clicked()
 //{
	// QString imagePath = QFileDialog::getSaveFileName(this, tr("保存图片"), "", tr("JPEG (*.jpg);;PNG (*.png)"));
	// if (!imagePath.isEmpty())
	// {	
	//	 QPixmap pixmap = ui.label_6->pixmap(Qt::ReturnByValue);
	//	 // 将QPixmap转换为QImage
	//	 QImage image = pixmap.toImage().convertToFormat(QImage::Format_BGR888); // 或者使用Format_BGR888，取决于OpenCV使用的色彩空间

	//	 // 将QImage转换为cv::Mat
	//	 cv::Mat imProcessed;
	//	 switch (image.format()) {
	//	 case QImage::Format_RGB888:
	//		 imProcessed = cv::Mat(image.height(), image.width(), CV_8UC3, (uchar*)image.bits(), image.bytesPerLine());
	//		 break;
	//	 // 如果使用的是Format_BGR888，调整以下转换
	//	 case QImage::Format_BGR888:
	//		 imProcessed = cv::Mat(image.height(), image.width(), CV_8UC3, (uchar*)image.bits(), image.bytesPerLine());
	//		 cv::cvtColor(imProcessed, imProcessed, cv::COLOR_BGR2RGB);
	//		 break;
	//	 default:
	//		 std::cerr << "Image format not handled." << std::endl;
	//		 return;
	//	 }
	//	 // 假设你有处理后的图像imProcessed
	//	 saveImage(imProcessed, imagePath);
	// }
 //}

 // 视频保存逻辑需要在开始处理视频前设置好VideoWriter，并在每次处理帧后调用saveVideo

 void QtWidgetsApplication2::on_exitButton_clicked()
 {
	 QApplication::quit();
 }

 void QtWidgetsApplication2::onConfidenceThresholdChanged(int value)
 {
	 confidenceThreshold = value / 100.0f; // 将百分比转换为浮点数
	 // 如果需要重新处理图像，可以在此调用相应函数
 }

 void QtWidgetsApplication2::onNMSThresholdChanged(int value)
 {
	 NMSThreshold = value / 100.0f; // 同样转换为浮点数
	 // 可能需要根据新的阈值重新执行目标检测
 }