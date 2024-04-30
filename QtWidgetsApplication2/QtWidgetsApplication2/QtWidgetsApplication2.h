#pragma once

#include <QtWidgets/QMainWindow>
#include "ui_QtWidgetsApplication2.h"
#include <opencv2/core.hpp>
#include <opencv2/opencv.hpp>

using namespace cv;


class QtWidgetsApplication2 : public QMainWindow
{
    Q_OBJECT

public:
    QtWidgetsApplication2(QWidget *parent = nullptr);
    ~QtWidgetsApplication2();
    void demoModel(QString imagePath);
    void video_demoModel(cv::Mat frame);
    //void draw_bounding_boxes(cv::Mat& img, const std::vector<cv::Rect>& bboxes, const std::vector<float>& scores);
    //cv::Mat preprocess_image(const cv::Mat& img, int target_height, int target_width);
    /*double compute_iou(const cv::Rect& rect1, const cv::Rect& rect2);*/
    void displayFrame(const cv::Mat& frame);
private slots:
    
    void on_openImage(bool checked);
    void onComboBoxChanged(int index);
    void on_openFolderButton_clicked();
    void on_saveImageButton_clicked();
    void on_exitButton_clicked();
    void startCamera();
    void timerUpdate();
    void stopCamera();
    /*void on_stopCameraButton_clicked();*/
    void on_startCameraButton_clicked();
    void on_stopOperationButton_clicked();
    void openVideo();
    void processVideoFrame();
    void onConfidenceThresholdChanged(int value);
    void onNMSThresholdChanged(int value);
    
private:
    Ui::QtWidgetsApplication2Class ui;
    cv::VideoCapture cap;
    QTimer* cameraTimer;
    bool isCameraRunning = false;
    cv::VideoCapture videoPlayer;
    QTimer* videoTimer;
    bool isVideoPlaying = false;

    float confidenceThreshold = 0.25f; // 默认置信度阈值
    float NMSThreshold = 0.4f; // 默认NMS阈值
};
