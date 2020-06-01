#include "dialog.h"
#include "ui_dialog.h"

Dialog::Dialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::Dialog)
{
    ui->setupUi(this);
    setModal(false);
}

Dialog::~Dialog()
{
    delete ui;
}

void Dialog::setValues(const QString &team, const QString &answer)
{
    ui->label->setText(team);
    ui->label_2->setText(answer);
}

void Dialog::reset()
{
    setValues("-", "-");
}
