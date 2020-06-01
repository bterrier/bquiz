#ifndef DIALOG_H
#define DIALOG_H

#include <QDialog>

namespace Ui {
class Dialog;
}

class Dialog : public QDialog
{
    Q_OBJECT

public:
    explicit Dialog(QWidget *parent = nullptr);
    ~Dialog();

    void setValues(const QString &team, const QString &answer);
    void reset();

private:
    Ui::Dialog *ui;
};

#endif // DIALOG_H
