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
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QHeaderView>
#include <QtWidgets/QLabel>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QSpinBox>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QTableView>
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
    QTableView *tableView_2;
    QLabel *label_17;
    QTableView *tableView_3;
    QWidget *widget_9;
    QHBoxLayout *horizontalLayout_6;
    QLabel *label_18;
    QComboBox *comboBox;
    QWidget *widget_6;
    QHBoxLayout *horizontalLayout_3;
    QLabel *label_19;
    QTableView *tableView_4;
    QLabel *label_20;
    QTableView *tableView_5;
    QWidget *widget_10;
    QHBoxLayout *horizontalLayout_7;
    QLabel *label_21;
    QWidget *widget_7;
    QHBoxLayout *horizontalLayout_4;
    QLabel *label_22;
    QTableView *tableView_6;
    QLabel *label_23;
    QTableView *tableView_7;
    QWidget *widget_8;
    QHBoxLayout *horizontalLayout_5;
    QLabel *label_24;
    QTableView *tableView_8;
    QLabel *label_25;
    QTableView *tableView_9;
    QWidget *widget_3;
    QHBoxLayout *horizontalLayout_8;
    QWidget *widget_11;
    QVBoxLayout *verticalLayout_2;
    QToolButton *toolButton;
    QToolButton *toolButton_3;
    QToolButton *toolButton_4;
    QWidget *widget_12;
    QVBoxLayout *verticalLayout_3;
    QToolButton *toolButton_2;
    QToolButton *toolButton_5;
    QToolButton *toolButton_6;
    QMenuBar *menuBar;
    QToolBar *mainToolBar;
    QStatusBar *statusBar;

    void setupUi(QMainWindow *QtWidgetsApplication2Class)
    {
        if (QtWidgetsApplication2Class->objectName().isEmpty())
            QtWidgetsApplication2Class->setObjectName("QtWidgetsApplication2Class");
        QtWidgetsApplication2Class->resize(1226, 729);
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
        label->setContextMenuPolicy(Qt::ContextMenuPolicy::NoContextMenu);
        label->setStyleSheet(QString::fromUtf8("font: 24pt \"\345\215\216\346\226\207\346\245\267\344\275\223\";\n"
"color: rgb(85, 170, 0);"));
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
        label_6->setTextFormat(Qt::TextFormat::MarkdownText);
        label_6->setAlignment(Qt::AlignmentFlag::AlignCenter);

        horizontalLayout_9->addWidget(label_6);

        verticalLayout_4 = new QVBoxLayout();
        verticalLayout_4->setSpacing(6);
        verticalLayout_4->setObjectName("verticalLayout_4");
        widget_5 = new QWidget(centralWidget);
        widget_5->setObjectName("widget_5");
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

        horizontalLayout->addWidget(label_2);

        spinBox = new QSpinBox(widget_2);
        spinBox->setObjectName("spinBox");

        horizontalLayout->addWidget(spinBox);

        label_3 = new QLabel(widget_2);
        label_3->setObjectName("label_3");

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

        horizontalLayout_2->addWidget(label_16);

        tableView_2 = new QTableView(widget_4);
        tableView_2->setObjectName("tableView_2");

        horizontalLayout_2->addWidget(tableView_2);

        label_17 = new QLabel(widget_4);
        label_17->setObjectName("label_17");

        horizontalLayout_2->addWidget(label_17);

        tableView_3 = new QTableView(widget_4);
        tableView_3->setObjectName("tableView_3");

        horizontalLayout_2->addWidget(tableView_3);


        verticalLayout->addWidget(widget_4);

        widget_9 = new QWidget(widget_5);
        widget_9->setObjectName("widget_9");
        horizontalLayout_6 = new QHBoxLayout(widget_9);
        horizontalLayout_6->setSpacing(6);
        horizontalLayout_6->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_6->setObjectName("horizontalLayout_6");
        label_18 = new QLabel(widget_9);
        label_18->setObjectName("label_18");

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

        horizontalLayout_3->addWidget(label_19);

        tableView_4 = new QTableView(widget_6);
        tableView_4->setObjectName("tableView_4");

        horizontalLayout_3->addWidget(tableView_4);

        label_20 = new QLabel(widget_6);
        label_20->setObjectName("label_20");

        horizontalLayout_3->addWidget(label_20);

        tableView_5 = new QTableView(widget_6);
        tableView_5->setObjectName("tableView_5");

        horizontalLayout_3->addWidget(tableView_5);


        verticalLayout->addWidget(widget_6);

        widget_10 = new QWidget(widget_5);
        widget_10->setObjectName("widget_10");
        horizontalLayout_7 = new QHBoxLayout(widget_10);
        horizontalLayout_7->setSpacing(6);
        horizontalLayout_7->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_7->setObjectName("horizontalLayout_7");
        label_21 = new QLabel(widget_10);
        label_21->setObjectName("label_21");

        horizontalLayout_7->addWidget(label_21);


        verticalLayout->addWidget(widget_10);

        widget_7 = new QWidget(widget_5);
        widget_7->setObjectName("widget_7");
        horizontalLayout_4 = new QHBoxLayout(widget_7);
        horizontalLayout_4->setSpacing(6);
        horizontalLayout_4->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_4->setObjectName("horizontalLayout_4");
        label_22 = new QLabel(widget_7);
        label_22->setObjectName("label_22");

        horizontalLayout_4->addWidget(label_22);

        tableView_6 = new QTableView(widget_7);
        tableView_6->setObjectName("tableView_6");

        horizontalLayout_4->addWidget(tableView_6);

        label_23 = new QLabel(widget_7);
        label_23->setObjectName("label_23");

        horizontalLayout_4->addWidget(label_23);

        tableView_7 = new QTableView(widget_7);
        tableView_7->setObjectName("tableView_7");

        horizontalLayout_4->addWidget(tableView_7);


        verticalLayout->addWidget(widget_7);

        widget_8 = new QWidget(widget_5);
        widget_8->setObjectName("widget_8");
        horizontalLayout_5 = new QHBoxLayout(widget_8);
        horizontalLayout_5->setSpacing(6);
        horizontalLayout_5->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_5->setObjectName("horizontalLayout_5");
        label_24 = new QLabel(widget_8);
        label_24->setObjectName("label_24");

        horizontalLayout_5->addWidget(label_24);

        tableView_8 = new QTableView(widget_8);
        tableView_8->setObjectName("tableView_8");

        horizontalLayout_5->addWidget(tableView_8);

        label_25 = new QLabel(widget_8);
        label_25->setObjectName("label_25");

        horizontalLayout_5->addWidget(label_25);

        tableView_9 = new QTableView(widget_8);
        tableView_9->setObjectName("tableView_9");

        horizontalLayout_5->addWidget(tableView_9);


        verticalLayout->addWidget(widget_8);


        verticalLayout_4->addWidget(widget_5);

        widget_3 = new QWidget(centralWidget);
        widget_3->setObjectName("widget_3");
        horizontalLayout_8 = new QHBoxLayout(widget_3);
        horizontalLayout_8->setSpacing(6);
        horizontalLayout_8->setContentsMargins(11, 11, 11, 11);
        horizontalLayout_8->setObjectName("horizontalLayout_8");
        widget_11 = new QWidget(widget_3);
        widget_11->setObjectName("widget_11");
        sizePolicy.setHeightForWidth(widget_11->sizePolicy().hasHeightForWidth());
        widget_11->setSizePolicy(sizePolicy);
        verticalLayout_2 = new QVBoxLayout(widget_11);
        verticalLayout_2->setSpacing(6);
        verticalLayout_2->setContentsMargins(11, 11, 11, 11);
        verticalLayout_2->setObjectName("verticalLayout_2");
        toolButton = new QToolButton(widget_11);
        toolButton->setObjectName("toolButton");
        QSizePolicy sizePolicy1(QSizePolicy::Policy::Fixed, QSizePolicy::Policy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(toolButton->sizePolicy().hasHeightForWidth());
        toolButton->setSizePolicy(sizePolicy1);
        toolButton->setLayoutDirection(Qt::LayoutDirection::LeftToRight);
        toolButton->setAutoFillBackground(false);
        toolButton->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        QIcon icon;
        icon.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\346\211\223\345\215\260.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton->setIcon(icon);
        toolButton->setPopupMode(QToolButton::ToolButtonPopupMode::DelayedPopup);
        toolButton->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);
        toolButton->setArrowType(Qt::ArrowType::NoArrow);

        verticalLayout_2->addWidget(toolButton);

        toolButton_3 = new QToolButton(widget_11);
        toolButton_3->setObjectName("toolButton_3");
        toolButton_3->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        QIcon icon1;
        icon1.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\244\215\345\210\266\346\226\207\344\273\266.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_3->setIcon(icon1);
        toolButton_3->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        verticalLayout_2->addWidget(toolButton_3);

        toolButton_4 = new QToolButton(widget_11);
        toolButton_4->setObjectName("toolButton_4");
        sizePolicy.setHeightForWidth(toolButton_4->sizePolicy().hasHeightForWidth());
        toolButton_4->setSizePolicy(sizePolicy);
        toolButton_4->setSizeIncrement(QSize(0, 0));
        toolButton_4->setBaseSize(QSize(5, 5));
        toolButton_4->setCursor(QCursor(Qt::ArrowCursor));
        toolButton_4->setContextMenuPolicy(Qt::ContextMenuPolicy::DefaultContextMenu);
        toolButton_4->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        toolButton_4->setInputMethodHints(Qt::InputMethodHint::ImhNone);
        QIcon icon2;
        icon2.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\202\250\345\255\230.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_4->setIcon(icon2);
        toolButton_4->setAutoRepeatDelay(300);
        toolButton_4->setAutoRepeatInterval(100);
        toolButton_4->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);
        toolButton_4->setAutoRaise(false);

        verticalLayout_2->addWidget(toolButton_4);


        horizontalLayout_8->addWidget(widget_11);

        widget_12 = new QWidget(widget_3);
        widget_12->setObjectName("widget_12");
        verticalLayout_3 = new QVBoxLayout(widget_12);
        verticalLayout_3->setSpacing(6);
        verticalLayout_3->setContentsMargins(11, 11, 11, 11);
        verticalLayout_3->setObjectName("verticalLayout_3");
        toolButton_2 = new QToolButton(widget_12);
        toolButton_2->setObjectName("toolButton_2");
        toolButton_2->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        QIcon icon3;
        icon3.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\347\254\224\350\256\260.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_2->setIcon(icon3);
        toolButton_2->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        verticalLayout_3->addWidget(toolButton_2);

        toolButton_5 = new QToolButton(widget_12);
        toolButton_5->setObjectName("toolButton_5");
        sizePolicy1.setHeightForWidth(toolButton_5->sizePolicy().hasHeightForWidth());
        toolButton_5->setSizePolicy(sizePolicy1);
        toolButton_5->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        QIcon icon4;
        icon4.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\346\241\243\346\241\210.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_5->setIcon(icon4);
        toolButton_5->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        verticalLayout_3->addWidget(toolButton_5);

        toolButton_6 = new QToolButton(widget_12);
        toolButton_6->setObjectName("toolButton_6");
        sizePolicy1.setHeightForWidth(toolButton_6->sizePolicy().hasHeightForWidth());
        toolButton_6->setSizePolicy(sizePolicy1);
        toolButton_6->setFocusPolicy(Qt::FocusPolicy::TabFocus);
        toolButton_6->setStyleSheet(QString::fromUtf8("QToolButton {\n"
"    /* \350\256\276\347\275\256\346\225\264\344\275\223\345\261\205\344\270\255 */\n"
"    text-align: center;\n"
"    background-color: transparent; /* \345\217\257\351\200\211\357\274\214\351\200\217\346\230\216\350\203\214\346\231\257 */\n"
"    border: none; /* \345\217\257\351\200\211\357\274\214\347\247\273\351\231\244\350\276\271\346\241\206 */\n"
"\n"
"    /* \345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\344\271\213\351\227\264\347\232\204\351\227\264\350\267\235\357\274\214\345\217\257\350\260\203 */\n"
"    padding: 5px;\n"
"\n"
"    /* \350\256\276\347\275\256\345\206\205\350\276\271\350\267\235\344\273\245\347\241\256\344\277\235\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\345\261\205\344\270\255 */\n"
"    /* \344\273\245\344\270\213\345\200\274\344\273\205\344\270\272\347\244\272\344\276\213\357\274\214\351\234\200\346\240\271\346\215\256\345\256\236\351\231\205\346\203\205\345\206\265\350\260\203\346\225\264 */\n"
"    padding-left: 6px;\n"
"    p"
                        "adding-right: 6px;\n"
"    /* \346\210\226\350\200\205\347\233\264\346\216\245\346\214\207\345\256\232\346\234\200\345\260\217\345\256\275\345\272\246\344\275\277\345\276\227\345\206\205\345\256\271\345\261\205\344\270\255 */\n"
"    min-width: 50px;\n"
"}\n"
"\n"
"/* \345\246\202\346\236\234\351\234\200\350\246\201\345\215\225\347\213\254\346\216\247\345\210\266\345\233\276\346\240\207\345\222\214\346\226\207\346\234\254\347\232\204\351\227\264\350\267\235 */\n"
"/* \345\271\266\344\270\224\344\275\240\347\232\204QToolButton\345\214\205\345\220\253QIcon\345\222\214\346\226\207\346\234\254 */\n"
"QToolButton::icon {\n"
"    margin-left: 4px; /* \345\267\246\344\276\247\350\267\235\347\246\273 */\n"
"    margin-right: 4px; /* \345\217\263\344\276\247\350\267\235\347\246\273 */\n"
"}"));
        QIcon icon5;
        icon5.addFile(QString::fromUtf8("E:/\346\265\217\350\247\210\345\231\250\344\270\213\350\275\275\346\226\207\344\273\266/image/\345\217\226\346\266\210.png"), QSize(), QIcon::Normal, QIcon::Off);
        toolButton_6->setIcon(icon5);
        toolButton_6->setCheckable(false);
        toolButton_6->setToolButtonStyle(Qt::ToolButtonStyle::ToolButtonTextBesideIcon);

        verticalLayout_3->addWidget(toolButton_6);


        horizontalLayout_8->addWidget(widget_12);


        verticalLayout_4->addWidget(widget_3);


        horizontalLayout_9->addLayout(verticalLayout_4);


        verticalLayout_5->addLayout(horizontalLayout_9);


        horizontalLayout_10->addLayout(verticalLayout_5);

        QtWidgetsApplication2Class->setCentralWidget(centralWidget);
        menuBar = new QMenuBar(QtWidgetsApplication2Class);
        menuBar->setObjectName("menuBar");
        menuBar->setGeometry(QRect(0, 0, 1226, 21));
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
        label->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\230\216\347\201\253\346\243\200\346\265\213", nullptr));
        label_6->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "TextLabel", nullptr));
        label_2->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\275\256\344\277\241\345\272\246\351\230\210\345\200\274", nullptr));
        label_3->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\344\272\244\345\271\266\346\257\224\351\230\210\345\200\274", nullptr));
        label_16->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\200\273\347\233\256\346\240\207\346\225\260", nullptr));
        label_17->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\224\250\346\227\266", nullptr));
        label_18->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\233\256\346\240\207\351\200\211\346\213\251\357\274\232", nullptr));
        label_19->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\261\273\345\236\213", nullptr));
        label_20->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\275\256\344\277\241\345\272\246", nullptr));
        label_21->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\347\233\256\346\240\207\344\275\215\347\275\256", nullptr));
        label_22->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "xmin", nullptr));
        label_23->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "ymin", nullptr));
        label_24->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "xmax", nullptr));
        label_25->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "ymax", nullptr));
        toolButton->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\345\233\276\347\211\207", nullptr));
        toolButton_3->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\350\247\206\351\242\221", nullptr));
        toolButton_4->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\344\277\235\345\255\230", nullptr));
        toolButton_2->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\346\226\207\344\273\266\345\244\271", nullptr));
        toolButton_5->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\346\211\223\345\274\200\346\221\204\345\203\217\345\244\264", nullptr));
        toolButton_6->setText(QCoreApplication::translate("QtWidgetsApplication2Class", "\351\200\200\345\207\272", nullptr));
#if QT_CONFIG(shortcut)
        toolButton_6->setShortcut(QString());
#endif // QT_CONFIG(shortcut)
    } // retranslateUi

};

namespace Ui {
    class QtWidgetsApplication2Class: public Ui_QtWidgetsApplication2Class {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_QTWIDGETSAPPLICATION2_H
