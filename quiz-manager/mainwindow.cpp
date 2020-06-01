#include "mainwindow.h"
#include "./ui_mainwindow.h"

#include <sys/utime.h>

#include <QDir>
#include <QFileDialog>
#include <QListWidgetItem>
#include <QMimeDatabase>
#include <QPainter>
#include <QPixmap>
#include <QStandardPaths>
#include <QStringBuilder>

#include <QDebug>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    connect(&m_watcher, &QFileSystemWatcher::fileChanged, this, [this](const QString & path) {
        qDebug() << "File changed:" << path;
        refreshCurrentImage();
    });

    setPath(QStandardPaths::writableLocation(QStandardPaths::HomeLocation));
}

MainWindow::~MainWindow()
{
    delete ui;
}


void MainWindow::on_pbBrowse_clicked()
{
    const QString dir = QFileDialog::getExistingDirectory(this, "Select directory", QDir::fromNativeSeparators(ui->lineEdit->text()));

    if (dir.isEmpty()) {
        return;
    }

    setPath(dir);
}

void MainWindow::refreshDir()
{
    qDebug() << Q_FUNC_INFO;
    ui->listWidget->clear();
    QDir dir(m_path);

    QMimeDatabase db;

    QSet<QString> allowed_mimes = {"image/png"};

    const auto files = dir.entryInfoList(QDir::Files | QDir::Readable, QDir::Name);
    qDebug() << files;
    for (const auto &file : files) {
        const auto mime = db.mimeTypeForFile(file);

        if (!allowed_mimes.contains(mime.name())) {
            qDebug() << mime.name();
            continue;
        }

        if (file.baseName() == "current") {
            continue;
        }

        auto item = new QListWidgetItem();
        item->setText(file.fileName());
        item->setData(Qt::UserRole, file.absoluteFilePath());
        item->setIcon(QIcon(file.absoluteFilePath()));
        ui->listWidget->addItem(item);
    }
}

QString MainWindow::path() const
{
    return m_path;
}

void MainWindow::setPath(const QString &path)
{
    qDebug() << Q_FUNC_INFO << path;
    if (path == m_path) {
        return;
    }

    m_path = path;


    ui->lineEdit->setText(QDir::toNativeSeparators(m_path));
    refreshDir();
    m_watcher.removePaths(m_watcher.files());
    refreshCurrentImage();
}

void MainWindow::on_listWidget_currentItemChanged(QListWidgetItem *current, QListWidgetItem *previous)
{
    if (!current) {
        ui->widget->setPixmap(QPixmap());
        ui->pushButton->setEnabled(false);
        return;
    }


    ui->widget->setPixmap(current->data(Qt::UserRole).toString());
    ui->pushButton->setEnabled(true);

}

void MainWindow::on_pushButton_clicked()
{
    const auto item = ui->listWidget->currentItem();

    if (!item) {
        return;
    }

    const QString path = m_path % "/current.png";
    m_watcher.removePath(currentPath());
    QFile::remove(path);
    QFile::copy(item->data(Qt::UserRole).toString(), path);
    _utime(QDir::toNativeSeparators(path).toUtf8(), NULL);
    refreshCurrentImage();
}

QString MainWindow::currentPath() const
{
    return m_path % "/current.png";
}

void MainWindow::refreshCurrentImage()
{
    ui->widget_2->setPixmap(currentPath());
}

void MainWindow::on_pushButton_2_clicked()
{
    QImage image({1920, 1080 }, QImage::Format_ARGB32);
    image.fill(qRgba(0, 0, 0, 0));
    QPainter p(&image);

    p.setRenderHints(QPainter::Antialiasing
                     | QPainter::TextAntialiasing
                     );

    QFont font;
    font.setPixelSize(128);
    font.setFamily("HooliganJF");

    p.setFont(font);
    QColor c(ui->leColor->text());
    p.setPen(c);

    QRectF teamRect;
    for (int i = 0 ; i < ui->tableWidget->rowCount() ; ++i) {
        const QString str =  ui->tableWidget->item(i, 0)->text() % ' ';
        QRect r(0, i * 1080 / 3, 1920, 1080 / 3);
        QRectF bRect;
        p.drawText(r, Qt::AlignVCenter | Qt::AlignLeft, str, &bRect);
        teamRect = teamRect.united(bRect);
    }

    font.setFamily("Horseshoes And Lemonade");
    font.setPixelSize(160);
    p.setFont(font);

    for (int i = 0 ; i < ui->tableWidget->rowCount() ; ++i) {
        const QString str = ui->tableWidget->item(i, 1)->text();
        QRect r(teamRect.width() + 32, i * 1080 / 3, 192, 1080 / 3);
        QRectF bRect;
        p.drawText(r, Qt::AlignVCenter | Qt::AlignRight, str, &bRect);
    }

    p.end();

    const bool ok = image.save(m_path % "/scores.png");
    qDebug() << ok;
    ui->widget_3->setPixmap(QPixmap{m_path % "/scores.png"});
}
