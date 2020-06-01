#include "mainwindow.h"
#include "./ui_mainwindow.h"

#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSslCipher>
#include <QSslConfiguration>
#include <QSslKey>
#include <QSslPreSharedKeyAuthenticator>
#include <QStringBuilder>
#include <QWebSocketCorsAuthenticator>

const QByteArray PRIVATE_KEY  = ""; // SSL Private key
const QByteArray CERT = ""; // SSL Certificatee
const QString URL = "https://<url>/game/"

static QSslKey keyFromFile(const QString &filename)
{
    QFile file(filename);
    file.open(QFile::ReadOnly);
    QByteArray data = file.readAll();
    file.close();
    return QSslKey(data, QSsl::Rsa);
}

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow),
      m_teamIds({"", "", "", ""}),
    m_dialog(new Dialog(this))
{
    ui->setupUi(this);
    m_dialog->show();
    for (int i = 0; i < ui->tableWidget->rowCount() ; ++i) {
        ui->tableWidget->setItem(i, 2, new QTableWidgetItem(URL % m_teamIds[i]));
    }

    QSslConfiguration sslConfig;

    QSslKey privateKey(PRIVATE_KEY, QSsl::Rsa);
    sslConfig.setPrivateKey(privateKey);

    QSslCertificate certificate(CERT);
    qDebug() << certificate;
    //sslConfig.addCaCertificate(certificate);
    sslConfig.setCiphers(QSslConfiguration::supportedCiphers());

    sslConfig.setPeerVerifyMode(QSslSocket::VerifyNone);
    sslConfig.setLocalCertificate(certificate);
    QSslConfiguration::setDefaultConfiguration(sslConfig);
    qDebug() << sslConfig.isNull();
    qDebug() << sslConfig.ciphers();


    m_server = new QWebSocketServer("liteq", QWebSocketServer::SecureMode, this);

    connect(m_server, &QWebSocketServer::newConnection, this, [this]() {
        while (m_server->hasPendingConnections()) {
            auto socket = m_server->nextPendingConnection();
            if (!socket) {
                continue;
            }

            m_sockets.append(socket);

            connect(socket, &QWebSocket::textMessageReceived, this, &MainWindow::onMessage);

        }
    });

    connect(m_server, &QWebSocketServer::sslErrors, this, [this](const QList<QSslError> errors) {
        qDebug() << errors;
    });

    connect(m_server, &QWebSocketServer::serverError, this, [this](QWebSocketProtocol::CloseCode closeCode) {
        qDebug() << closeCode;
    });

    connect(m_server, &QWebSocketServer::originAuthenticationRequired, this, [this](QWebSocketCorsAuthenticator * authenticator) {
        qDebug() << "originAuthenticationRequired";
    });

    connect(m_server, &QWebSocketServer::acceptError, this, [this](QAbstractSocket::SocketError socketError) {
        qDebug() << "acceptError" << socketError;
    });

    connect(m_server, &QWebSocketServer::peerVerifyError, this, [this](const QSslError & error) {
        qDebug() << "peerVerifyError" << error;
    });

    connect(m_server, &QWebSocketServer::preSharedKeyAuthenticationRequired, this, [this](QSslPreSharedKeyAuthenticator * authenticator) {
        qDebug() << "preSharedKeyAuthenticationRequired";
    });


    bool ok = m_server->listen(QHostAddress::Any, 8081);
    qDebug() << ok << m_server->serverPort() << m_server->serverUrl();
}

MainWindow::~MainWindow()
{
    m_server->close();
    for (const auto &socket : m_sockets) {
        socket->close();
    }
    delete ui;
}


void MainWindow::on_pushButton_clicked()
{
    qDebug() << "Clear\n Answers were:";
    for (int i = 0 ; i < ui->tableWidget->rowCount() ; ++i) {
        auto item = ui->tableWidget->item(i, 1);
        qDebug() << "Team" << i << ":" << item->text();
        item->setText("");
    }

    m_nuggetBlock = false;
    for (const auto &socket : m_sockets) {
        socket->sendTextMessage(R"({"type":"clear"})");
    }
    qDebug() << "Clear complete";
}

void MainWindow::on_pushButton_2_clicked()
{
    m_nuggetBlock = true;
}

void MainWindow::onMessage(const QString &message)
{
    QWebSocket *socket = qobject_cast<QWebSocket *>(sender());

    if (!socket) {
        return;
    }

    qDebug() << message;
    auto doc = QJsonDocument::fromJson(message.toUtf8());
    auto obj = doc.object();
    const QString teamId = obj["id"].toString();
    int index = m_teamIds.indexOf(teamId);
    if (index < 0) {
        qCritical() << "Unkown ID" << teamId;
        return ;
    }

    const QString type = obj["type"].toString();

    if (type == "nuggets") {
        if (m_nuggetBlock)
            return;

        auto item = ui->tableWidget->item(index, 1);
        item->setText(obj["answer"].toString());

        const QString msg = QStringLiteral(R"({ "type": "nuggets", "answer": "%1"})").arg(item->text());
        for (auto it = m_socketTeam.constBegin() ; it != m_socketTeam.constEnd() ; ++it) {
            if (it.value() == teamId) {
                it.key()->sendTextMessage(msg);
            }
        }


    } else if (type == "sp") {
        if (m_spBlock)
            return;

        const QString a = obj["answer"].toString();
        if(a.length() > 4)
            return;

        m_spBlock = true;
        m_dialog->setValues(ui->tableWidget->item(index, 0)->text(), a);
    } else if (type == "join") {
        m_socketTeam.insert(socket, teamId);
    }


}

void MainWindow::on_pushButton_3_clicked()
{
    m_spBlock = false;
    m_dialog->reset();
}
