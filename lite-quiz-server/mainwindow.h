#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QWebSocket>
#include <QWebSocketServer>

#include "dialog.h"

QT_BEGIN_NAMESPACE
namespace Ui
{
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void on_pushButton_clicked();

    void on_pushButton_2_clicked();

    void onMessage(const QString &message);

    void on_pushButton_3_clicked();

private:
    Ui::MainWindow *ui;

    QStringList m_teamIds;
    QWebSocketServer *m_server;
    QList<QWebSocket *>m_sockets;
    QHash<QWebSocket *, QString> m_socketTeam;

    bool m_nuggetBlock = false;
    bool m_spBlock = false;
    Dialog *m_dialog;
};
#endif // MAINWINDOW_H
