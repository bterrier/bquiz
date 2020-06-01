#ifndef IMAGEVIEWER_H
#define IMAGEVIEWER_H

#include <QWidget>
class ImageViewer : public QWidget
{
    Q_OBJECT
public:
    explicit ImageViewer(QWidget *parent = nullptr);
    ~ImageViewer() override;

    QPixmap pixmap() const;
    void setPixmap(const QPixmap &pixmap);

signals:
private:
    QPixmap m_pixmap;
    QPixmap m_cache;
    QSize m_cachesize;
    void refreshCache();


    // QWidget interface
protected:
    void paintEvent(QPaintEvent *event) override;

    // QWidget interface
protected:
    void resizeEvent(QResizeEvent *event) override;
};

#endif // IMAGEVIEWER_H
