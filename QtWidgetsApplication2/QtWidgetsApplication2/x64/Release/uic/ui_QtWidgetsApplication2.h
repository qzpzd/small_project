/********************************************************************************
** Form generated from reading UI file 'QtWidgetsApplication2.ui'
**
** Created by: Qt User Interface Compiler version 6.7.0
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_QTWIDGETSAPPLICATION2_H
#define UI_QTWIDGETSAPPLICATION2_H

#include <QtCore/QVariant>
#include <QtGui/QIcon>
#include <QtWidgets/QApplication>
#include <QtWidgets/QComboBox>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QSpinBox>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QToolBar>
#include <QtWidgets/QToolButton>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_QtWidgetsApplication2Class
{
public:
    QWidget *centralWidget;
    QHBoxLayout *horizontalLayout_10;
    QVBoxLayout *verticalLayout_5;
    QLabel *label;
    QHBoxLayout *horizontalLayout_9;
    QLabel *label_6;
    QVBoxLayout *verticalLayout_4;
    QWidget *widget_5;
    QVBoxLayout *verticalLayout;
    QWidget *widget_2;
    QHBoxLayout *horizontalLayout;
    QLabel *label_2;
    QSpinBox *spinBox;
    QLabel *label_3;
    QSpinBox *spinBox_2;
    QWidget *widget_4;
    QHBoxLayout *horizontalLayout_2;
    QLabel *label_16;
    QLabel *label_4;
    QLabel *label_17;
    QLabel *label_5;
    QWidget *widget_9;
    QHBoxLayout *horizontalLayout_6;
    QLabel *label_18;
    QComboBox *comboBox;
    QWidget *widget_6;
    QHBoxLayout *horizontalLayout_3;
    QLabel *label_19;
    QLabel *label_8;
    QLabel *label_20;
    QLabel *label_7;
    QWidget *widget_7;
    QHBoxLayout *horizontalLayout_4;
    QLabel *label_22;
    QLabel *label_9;
    QLabel *label_23;
    QLabel *label_10;
    QWidget *widget_8;
    QHBoxLayout *horizontalLayout_5;
    QLabel *label_24;
    QLabel *label_11;
    QLabel *label_25;
    QLabel *label_12;
    QWidget *widget_3;
    QHBoxLayout *horizontalLayout_8;
    QWidget *widget_11;
    QHBoxLayout *horizontalLayout_11;
    QGridLayout *gridLayout;
    QToolButton *toolButton_3;
    QToolButton *toolButton_4;
    QToolButton *toolButton_2;
    QToolButton *toolButton_6;
    QToolButton *toolButton;
    QToolButton *toolButton_5;
    QSpacerItem *horizontalSpacer;
    QMenuBar *menuBar;
    QToolBar *mainToolBar;
    QStatusBar *statusBar;

    void setupUi(QMainWindow *QtWidgetsApplication2Class)
    {
        if (QtWidgetsApplication2Class->objectName().isEmpty())
            QtWidgetsApplication2Class->setObjectName("QtWidgetsApplication2Class");
        QtWidgetsApplication2Class->resize(950, 622);
        centralWidget = new QWidget(QtWidgetsApplication2Class);
        centralWidget->setObjectName("centralWidget");
        horizontalLayout_10 = new QHBoxLayout(centralWidget);
        horizontalLayout_10->setSpacing(6);
        horizontalLayout_10->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_10->setObjectName("horizontalLayout_10");
        verticalLayout_5 = new QVBoxLayout();
        verticalLayout_5->setSpacing(6);
        verticalLayout_5->setObjectName("verticalLayout_5");
        verticalLayout_5->setSizeConstraint(QLayout::SizeConstraint::SetMinAndMaxSize);
        verticalLayout_5->setContentsMargins(2, 2, 2, 2);
        label = new QLabel(centralWidget);
        label->setObjectName("label");
        label->setMinimumSize(QSize(0, 0));
        label->setMaximumSize(QSize(16777215, 100));
        label->setContextMenuPolicy(Qt::ContextMenuPolicy::NoContextMenu);
        label->setStyleSheet(QString::fromUtf8("font: 24pt \"\345\215\216\346\226\207\346\245\267\344\275\223\";\n"
"color: rgb(85, 170, 0);\n"
"border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"background-color: #7FFFD4; /* \350\203\214\346\231\257\351\242\234\350\211\262 */"));
        label->setTextFormat(Qt::TextFormat::AutoText);
        label->setAlignment(Qt::AlignmentFlag::AlignCenter);
        label->setMargin(0);
        label->setIndent(-1);
        label->setOpenExternalLinks(false);
        label->setTextInteractionFlags(Qt::TextInteractionFlag::LinksAccessibleByMouse|Qt::TextInteractionFlag::TextEditable);

        verticalLayout_5->addWidget(label);

        horizontalLayout_9 = new QHBoxLayout();
        horizontalLayout_9->setSpacing(6);
        horizontalLayout_9->setObjectName("horizontalLayout_9");
        label_6 = new QLabel(centralWidget);
        label_6->setObjectName("label_6");
        QSizePolicy sizePolicy(QSizePolicy::Policy::Preferred, QSizePolicy::Policy::Preferred);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(label_6->sizePolicy().hasHeightForWidth());
        label_6->setSizePolicy(sizePolicy);
        label_6->setMinimumSize(QSize(500, 0));
        label_6->setStyleSheet(QString::fromUtf8("QLabel {\n"
"   \n"
"    background-image: url(:\345\215\240\344\275\215\345\233\276\347\211\207.png); /* \350\203\214\346\231\257\345\233\276\347\211\207 */\n"
"    background-repeat: no-repeat; /* \350\203\214\346\231\257\345\233\276\347\211\207\344\270\215\351\207\215\345\244\215 */\n"
"    background-position: center; /* \350\203\214\346\231\257\345\233\276\347\211\207\345\261\205\344\270\255 */\n"
"	border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"	border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"	border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"}\n"
""));
        label_6->setTextFormat(Qt::TextFormat::MarkdownText);
        label_6->setAlignment(Qt::AlignmentFlag::AlignCenter);

        horizontalLayout_9->addWidget(label_6);

        verticalLayout_4 = new QVBoxLayout();
        verticalLayout_4->setSpacing(6);
        verticalLayout_4->setObjectName("verticalLayout_4");
        widget_5 = new QWidget(centralWidget);
        widget_5->setObjectName("widget_5");
        widget_5->setStyleSheet(QString::fromUtf8("QWidget{border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"#border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */}"));
        verticalLayout = new QVBoxLayout(widget_5);
        verticalLayout->setSpacing(6);
        verticalLayout->setContentsMargins(11, 11, 11, 11);
        verticalLayout->setObjectName("verticalLayout");
        widget_2 = new QWidget(widget_5);
        widget_2->setObjectName("widget_2");
        widget_2->setContextMenuPolicy(Qt::ContextMenuPolicy::ActionsContextMenu);
        widget_2->setLayoutDirection(Qt::LayoutDirection::LeftToRight);
        widget_2->setStyleSheet(QString::fromUtf8(""));
        horizontalLayout = new QHBoxLayout(widget_2);
        horizontalLayout->setSpacing(6);
        horizontalLayout->setContentsMargins(11, 11, 11, 11);
        horizontalLayout->setObjectName("horizontalLayout");
        label_2 = new QLabel(widget_2);
        label_2->setObjectName("label_2");
        label_2->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout->addWidget(label_2);

        spinBox = new QSpinBox(widget_2);
        spinBox->setObjectName("spinBox");
        spinBox->setStyleSheet(QString::fromUtf8(""));

        horizontalLayout->addWidget(spinBox);

        label_3 = new QLabel(widget_2);
        label_3->setObjectName("label_3");
        label_3->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout->addWidget(label_3);

        spinBox_2 = new QSpinBox(widget_2);
        spinBox_2->setObjectName("spinBox_2");

        horizontalLayout->addWidget(spinBox_2);


        verticalLayout->addWidget(widget_2);

        widget_4 = new QWidget(widget_5);
        widget_4->setObjectName("widget_4");
        horizontalLayout_2 = new QHBoxLayout(widget_4);
        horizontalLayout_2->setSpacing(6);
        horizontalLayout_2->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_2->setObjectName("horizontalLayout_2");
        label_16 = new QLabel(widget_4);
        label_16->setObjectName("label_16");
        label_16->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_2->addWidget(label_16);

        label_4 = new QLabel(widget_4);
        label_4->setObjectName("label_4");

        horizontalLayout_2->addWidget(label_4);

        label_17 = new QLabel(widget_4);
        label_17->setObjectName("label_17");
        label_17->setAutoFillBackground(false);
        label_17->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_2->addWidget(label_17);

        label_5 = new QLabel(widget_4);
        label_5->setObjectName("label_5");

        horizontalLayout_2->addWidget(label_5);


        verticalLayout->addWidget(widget_4);

        widget_9 = new QWidget(widget_5);
        widget_9->setObjectName("widget_9");
        horizontalLayout_6 = new QHBoxLayout(widget_9);
        horizontalLayout_6->setSpacing(6);
        horizontalLayout_6->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_6->setObjectName("horizontalLayout_6");
        label_18 = new QLabel(widget_9);
        label_18->setObjectName("label_18");
        label_18->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_6->addWidget(label_18);

        comboBox = new QComboBox(widget_9);
        comboBox->setObjectName("comboBox");

        horizontalLayout_6->addWidget(comboBox);


        verticalLayout->addWidget(widget_9);

        widget_6 = new QWidget(widget_5);
        widget_6->setObjectName("widget_6");
        horizontalLayout_3 = new QHBoxLayout(widget_6);
        horizontalLayout_3->setSpacing(6);
        horizontalLayout_3->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_3->setObjectName("horizontalLayout_3");
        label_19 = new QLabel(widget_6);
        label_19->setObjectName("label_19");
        label_19->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_3->addWidget(label_19);

        label_8 = new QLabel(widget_6);
        label_8->setObjectName("label_8");

        horizontalLayout_3->addWidget(label_8);

        label_20 = new QLabel(widget_6);
        label_20->setObjectName("label_20");
        label_20->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_3->addWidget(label_20);

        label_7 = new QLabel(widget_6);
        label_7->setObjectName("label_7");

        horizontalLayout_3->addWidget(label_7);


        verticalLayout->addWidget(widget_6);

        widget_7 = new QWidget(widget_5);
        widget_7->setObjectName("widget_7");
        horizontalLayout_4 = new QHBoxLayout(widget_7);
        horizontalLayout_4->setSpacing(6);
        horizontalLayout_4->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_4->setObjectName("horizontalLayout_4");
        label_22 = new QLabel(widget_7);
        label_22->setObjectName("label_22");
        label_22->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_4->addWidget(label_22);

        label_9 = new QLabel(widget_7);
        label_9->setObjectName("label_9");

        horizontalLayout_4->addWidget(label_9);

        label_23 = new QLabel(widget_7);
        label_23->setObjectName("label_23");
        label_23->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_4->addWidget(label_23);

        label_10 = new QLabel(widget_7);
        label_10->setObjectName("label_10");

        horizontalLayout_4->addWidget(label_10);


        verticalLayout->addWidget(widget_7);

        widget_8 = new QWidget(widget_5);
        widget_8->setObjectName("widget_8");
        horizontalLayout_5 = new QHBoxLayout(widget_8);
        horizontalLayout_5->setSpacing(6);
        horizontalLayout_5->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_5->setObjectName("horizontalLayout_5");
        label_24 = new QLabel(widget_8);
        label_24->setObjectName("label_24");
        label_24->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_5->addWidget(label_24);

        label_11 = new QLabel(widget_8);
        label_11->setObjectName("label_11");

        horizontalLayout_5->addWidget(label_11);

        label_25 = new QLabel(widget_8);
        label_25->setObjectName("label_25");
        label_25->setStyleSheet(QString::fromUtf8("QLabel {\n"
"	color: #333333; /* \346\226\207\346\234\254\351\242\234\350\211\262 */\n"
"    font-size: 14px; /* \345\255\227\344\275\223\345\244\247\345\260\217 */\n"
"    font-weight: bold; /* \345\255\227\344\275\223\347\262\227\347\273\206 */\n"
"    font-family: Arial; /* \345\255\227\344\275\223\345\256\266\346\227\217 */\n"
"\n"
"    border-style: solid; /* \350\276\271\346\241\206\346\240\267\345\274\217 */\n"
"    border-width: 2px; /* \350\276\271\346\241\206\345\256\275\345\272\246 */\n"
"    border-color: #1c7cd6; /* \350\276\271\346\241\206\351\242\234\350\211\262 */\n"
"    border-radius: 5px; /* \350\276\271\346\241\206\345\234\206\350\247\222 */\n"
"	background-color: #5F9EA0; /* \350\203\214\346\231\257\351\242\234\350\211\262 */\n"
"	padding: 0px; /* \345\206\205\350\276\271\350\267\235 */\n"
"    margin: 0px; /* \345\244\226\350\276\271\350\267\235 */\n"
" 	opacity: 0.5; /* 50% \351\200\217\346\230\216\345\272\246 */\n"
"}\n"
""));

        horizontalLayout_5->addWidget(label_25);

        label_12 = new QLabel(widget_8);
        label_12->setObjectName("label_12");

        horizontalLayout_5->addWidget(label_12);


        verticalLayout->addWidget(widget_8);

        widget_3 = new QWidget(widget_5);
        widget_3->setObjectName("widget_3");
        widget_3->setSizeIncrement(QSize(50, 0));
        widget_3->setLayoutDirection(Qt::LayoutDirection::LeftToRight);
        horizontalLayout_8 = new QHBoxLayout(widget_3);
        horizontalLayout_8->setSpacing(0);
        horizontalLayout_8->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_8->setObjectName("horizontalLayout_8");
        horizontalLayout_8->setContentsMargins(0, 0, 0, 0);
        widget_11 = new QWidget(widget_3);
        widget_11->setObjectName("widget_11");
        QSizePolicy sizePolicy1(QSizePolicy::Policy::MinimumExpanding, QSizePolicy::Policy::MinimumExpanding);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(widget_11->sizePolicy().hasHeightForWidth());
        widget_11->setSizePolicy(sizePolicy1);
        widget_11->setFocusPolicy(Qt::FocusPolicy::NoFocus);
        horizontalLayout_11 = new QHBoxLayout(widget_11);
        horizontalLayout_11->setSpacing(0);
        horizontalLayout_11->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_11->setObjectName("horizontalLayout_11");
        horizontalLayout_11->setContentsMargins(0, 0, 0, 0);
        gridLayout = new QGridLayout();
        gridLayout->setSpacing(0);
        gridLayout->setObjectName("gridLayout");
        gridLayout->setSizeConstraint(QLayout::SizeConstraint::SetMaximumSize);
        toolButton_3 = new QToolButton(widget_11);
        toolButton_3->setObjectName("toolButton_3");
        QSizePolicy sizePolicy2(QSizePolicy::Policy::Expanding, QSizePolicy::Policy::Expanding);
        sizePolicy2.setHorizontalStretch(0);
        sizePolicy2.setVerticalStretch(0);
        sizePolicy2.setHeightForWidth(toolButton_3->sizePolicy().hasHeightForWidth());
        toolButton_3->setSizePolicy(sizePolicy2);
        toolButton_3->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        QIcon icon;
        icon.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\244\215\345\210\266\346\226\207\344\273\266.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_3->setIcon(icon);
        toolButton_3->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        gridLayout->addWidget(toolButton_3, 2, 0, 1, 1);

        toolButton_4 = new QToolButton(widget_11);
        toolButton_4->setObjectName("toolButton_4");
        sizePolicy2.setHeightForWidth(toolButton_4->sizePolicy().hasHeightForWidth());
        toolButton_4->setSizePolicy(sizePolicy2);
        toolButton_4->setSizeIncrement(QSize(0, 0));
        toolButton_4->setBaseSize(QSize(5, 5));
        toolButton_4->setCursor(QCursor(Qt::ArrowCursor));
        toolButton_4->setContextMenuPolicy(Qt::ContextMenuPolicy::DefaultContextMenu);
        toolButton_4->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        toolButton_4->setInputMethodHints(Qt::InputMethodHint::ImhNone);
        QIcon icon1;
        icon1.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\202\250\345\255\230.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_4->setIcon(icon1);
        toolButton_4->setAutoRepeatDelay(300);
        toolButton_4->setAutoRepeatInterval(100);
        toolButton_4->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);
        toolButton_4->setAutoRaise(false);

        gridLayout->addWidget(toolButton_4, 3, 0, 1, 1);

        toolButton_2 = new QToolButton(widget_11);
        toolButton_2->setObjectName("toolButton_2");
        sizePolicy2.setHeightForWidth(toolButton_2->sizePolicy().hasHeightForWidth());
        toolButton_2->setSizePolicy(sizePolicy2);
        toolButton_2->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        QIcon icon2;
        icon2.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\347\254\224\350\256\260.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_2->setIcon(icon2);
        toolButton_2->setAutoRepeatDelay(300);
        toolButton_2->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);
        toolButton_2->setAutoRaise(false);
        toolButton_2->setArrowType(Qt::ArrowType::NoArrow);

        gridLayout->addWidget(toolButton_2, 1, 0, 1, 1);

        toolButton_6 = new QToolButton(widget_11);
        toolButton_6->setObjectName("toolButton_6");
        sizePolicy2.setHeightForWidth(toolButton_6->sizePolicy().hasHeightForWidth());
        toolButton_6->setSizePolicy(sizePolicy2);
        toolButton_6->setFocusPolicy(Qt::FocusPolicy::TabFocus);
        toolButton_6->setAcceptDrops(true);
        toolButton_6->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        QIcon icon3;
        icon3.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\217\226\346\266\210.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_6->setIcon(icon3);
        toolButton_6->setCheckable(false);
        toolButton_6->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        gridLayout->addWidget(toolButton_6, 3, 1, 1, 1);

        toolButton = new QToolButton(widget_11);
        toolButton->setObjectName("toolButton");
        sizePolicy2.setHeightForWidth(toolButton->sizePolicy().hasHeightForWidth());
        toolButton->setSizePolicy(sizePolicy2);
        toolButton->setLayoutDirection(Qt::LayoutDirection::LeftToRight);
        toolButton->setAutoFillBackground(false);
        toolButton->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        QIcon icon4;
        icon4.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\346\211\223\345\215\260.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton->setIcon(icon4);
        toolButton->setPopupMode(QToolButton::ToolButtonPopupMode::DelayedPopup);
        toolButton->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);
        toolButton->setArrowType(Qt::ArrowType::NoArrow);

        gridLayout->addWidget(toolButton, 2, 1, 1, 1);

        toolButton_5 = new QToolButton(widget_11);
        toolButton_5->setObjectName("toolButton_5");
        sizePolicy2.setHeightForWidth(toolButton_5->sizePolicy().hasHeightForWidth());
        toolButton_5->setSizePolicy(sizePolicy2);
        toolButton_5->setStyleSheet(QString::fromUtf8("QToolButton:hover\n"
"{\n"
"    color:rgb(255,222,173);\n"
"    border:2px solid #78909C;\n"
"    background-color:#20B2AA;\n"
"}"));
        QIcon icon5;
        icon5.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\346\241\243\346\241\210.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_5->setIcon(icon5);
        toolButton_5->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        gridLayout->addWidget(toolButton_5, 1, 1, 1, 1);


        horizontalLayout_11->addLayout(gridLayout);


        horizontalLayout_8->addWidget(widget_11);

        horizontalSpacer = new QSpacerItem(178, 88, QSizePolicy::Policy::Fixed, QSizePolicy::Policy::Minimum);

        horizontalLayout_8->addItem(horizontalSpacer);


        verticalLayout->addWidget(widget_3);


        verticalLayout_4->addWidget(widget_5);


        horizontalLayout_9->addLayout(verticalLayout_4);


        verticalLayout_5->addLayout(horizontalLayout_9);


        horizontalLayout_10->addLayout(verticalLayout_5);

        QtWidgetsApplication2Class->setCentralWidget(centralWidget);
        menuBar = new QMenuBar(QtWidgetsApplication2Class);
        menuBar->setObjectName("menuBar");
        menuBar->setGeometry(QRect(0, 0, 950, 21));
        QtWidgetsApplication2Class->setMenuBar(menuBar);
        mainToolBar = new QToolBar(QtWidgetsApplication2Class);
        mainToolBar->setObjectName("mainToolBar");
        QtWidgetsApplication2Class->addToolBar(Qt::ToolBarArea::TopToolBarArea, mainToolBar);
        statusBar = new QStatusBar(QtWidgetsApplication2Class);
        statusBar->setObjectName("statusBar");
        QtWidgetsApplication2Class->setStatusBar(statusBar);
#if QT_CONFIG(shortcut)
#endif // QT_CONFIG(shortcut)

        retranslateUi(QtWidgetsApplication2Class);

        QMetaObject::connectSlotsByName(QtWidgetsApplication2Class);
    } // setupUi

    void retranslateUi(QMainWindow *QtWidgetsApplication2Class)
    {
        QtWidgetsApplication2Class->setWindowTitle(QCoreApplication::translate("QtWidgetsApplication2Class", "QtWidgetsApplication2", nullptr));
        label->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "COCO\347\233\256\346\240\207\346\243\200\346\265\213", nullptr));
        label_6->setText(QString());
        label_2->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\275\256\344\277\241\345\272\246\351\230\210\345\200\274", nullptr));
        label_3->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\344\272\244\345\271\266\346\257\224\351\230\210\345\200\274", nullptr));
        label_16->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\200\273\347\233\256\346\240\207\346\225\260", nullptr));
        label_4->setText(QString());
        label_17->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\224\250\346\227\266", nullptr));
        label_5->setText(QString());
        label_18->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\233\256\346\240\207\351\200\211\346\213\251\357\274\232", nullptr));
        label_19->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\261\273\345\236\213", nullptr));
        label_8->setText(QString());
        label_20->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\275\256\344\277\241\345\272\246", nullptr));
        label_7->setText(QString());
        label_22->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "xmin", nullptr));
        label_9->setText(QString());
        label_23->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "ymin", nullptr));
        label_10->setText(QString());
        label_24->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "xmax", nullptr));
        label_11->setText(QString());
        label_25->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "ymax", nullptr));
        label_12->setText(QString());
        toolButton_3->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\350\247\206\351\242\221", nullptr));
        toolButton_4->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\344\277\235\345\255\230", nullptr));
        toolButton_2->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\346\226\207\344\273\266\345\244\271", nullptr));
        toolButton_6->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\351\200\200\345\207\272", nullptr));
#if QT_CONFIG(shortcut)
        toolButton_6->setShortcut(QString());
#endif // QT_CONFIG(shortcut)
        toolButton->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\345\233\276\347\211\207", nullptr));
        toolButton_5->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\346\221\204\345\203\217\345\244\264", nullptr));
    } // retranslateUi

};

namespace Ui {
    class QtWidgetsApplication2Class: public Ui_QtWidgetsApplication2Class {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_QTWIDGETSAPPLICATION2_H
