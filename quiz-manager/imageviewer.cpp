#include "imageviewer.h"

#include <QPainter>
#include <QPaintEvent>

#include <QDebug>

ImageViewer::ImageViewer(QWidget *parent) : QWidget(parent)
{
    setContentsMargins(6, 6, 6, 6);
}

ImageViewer::~ImageViewer()
{
    qDebug() << Q_FUNC_INFO;
}

QPixmap ImageViewer::pixmap() const
{
    return m_pixmap;
}

void ImageViewer::setPixmap(const QPixmap &pixmap)
{
    m_pixmap = pixmap;
    m_cachesize = QSize();
    refreshCache();
    update();
}

void ImageViewer::refreshCache()
{
    const auto size = contentsRect().size();
    if (size != m_cachesize) {
        qDebug() << "Update cache" << size;
        m_cache = m_pixmap.scaled(contentsRect().size(), Qt::KeepAspectRatio, Qt::SmoothTransformation);
        m_cachesize = size;
    }
}


void ImageViewer::paintEvent(QPaintEvent *event)
{
    if (m_pixmap.isNull()) {
        return;
    }

    const auto size = contentsRect().size();



    QPainter p(this);
    p.setClipRect(event->rect());


    p.drawPixmap(QPointF{(size.width() - m_cache.width()) / 2.0 + contentsMargins().left(),
                         (size.height() - m_cache.height()) / 2.0  + contentsMargins().right()},
                 m_cache);
}


void ImageViewer::resizeEvent(QResizeEvent *event)
{
    QWidget::resizeEvent(event);
    refreshCache();
}
