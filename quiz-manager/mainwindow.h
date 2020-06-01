#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QFileSystemWatcher>
#include <QMainWindow>

QT_BEGIN_NAMESPACE
namespace Ui
{
class MainWindow;
}

class QListWidgetItem;

QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

    QString path() const;
    void setPath(const QString &path);

private slots:
    void on_pbBrowse_clicked();
    void refreshDir();

    void on_listWidget_currentItemChanged(QListWidgetItem *current, QListWidgetItem *previous);

    void on_pushButton_clicked();

    void on_pushButton_2_clicked();

private:
    QString currentPath() const;
    void refreshCurrentImage();

    Ui::MainWindow *ui;
    QString m_path;
    QFileSystemWatcher m_watcher;
};
#endif // MAINWINDOW_H
