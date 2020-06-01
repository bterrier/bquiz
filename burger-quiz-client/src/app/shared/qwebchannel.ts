/****************************************************************************
**
** TypeScript implementation of qwebchannel.js
**
** Original file under BSD license can be found at:
**
** - https://github.com/qt/qtwebengine/blob/5.10/examples/webenginewidgets/markdowneditor/resources/qwebchannel.js
** - https://code.qt.io/cgit/qt/qtwebengine.git/tree/examples/webenginewidgets/markdowneditor/resources/qwebchannel.js?h=v5.10.1
**
** Newest file versions under LGPLv3 license can be found at:
**
** - https://code.qt.io/cgit/qt/qtwebchannel.git/tree/examples/webchannel/shared/qwebchannel.js
**
** Copyright (C) 2016 The Qt Company Ltd.
** Copyright (C) 2014 Klarälvdalens Datakonsult AB, a KDAB Group company, info@kdab.com, author Milian Wolff <milian.wolff@kdab.com>
** Contact: https://www.qt.io/licensing/
**
** BSD License Usage
** Alternatively, you may use this file under the terms of the BSD license
** as follows:
**
** "Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are
** met:
**   * Redistributions of source code must retain the above copyright
**     notice, this list of conditions and the following disclaimer.
**   * Redistributions in binary form must reproduce the above copyright
**     notice, this list of conditions and the following disclaimer in
**     the documentation and/or other materials provided with the
**     distribution.
**   * Neither the name of The Qt Company Ltd nor the names of its
**     contributors may be used to endorse or promote products derived
**     from this software without specific prior written permission.
**
**
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
** "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
** LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
** A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
** OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
** LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
** THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
** (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
**
**
**
** GNU Lesser General Public License Usage
** Alternatively, this file may be used under the terms of the GNU Lesser
** General Public License version 3 as published by the Free Software
** Foundation and appearing in the file LICENSE.LGPL3 included in the
** packaging of this file. Please review the following information to
** ensure the GNU Lesser General Public License version 3 requirements
** will be met: https://www.gnu.org/licenses/lgpl-3.0.html.
**
****************************************************************************/


enum QWebChannelMessageTypes {
    signal = 1,
    propertyUpdate = 2,
    init = 3,
    idle = 4,
    debug = 5,
    invokeMethod = 6,
    connectToSignal = 7,
    disconnectFromSignal = 8,
    setProperty = 9,
    response = 10,
}

type InitCallback = (channel: QWebChannel) => void;

type Callback = (message: MessageData) => void;
type SignalCallback = (...args: any) => void;

interface Map<T> {
    [id: number]: T;
}

interface Dic<T> {
    [id: string]: T;
}

interface MessageData {

}

interface Message {
    id: number;
    type: QWebChannelMessageTypes;
    object: number;
    signal: any;
    args: any;
}

interface ResponseData extends MessageData {
    [id: string]: any;
}

interface PropertyMessage extends Message {
    data: any[];
}

interface ResponseMessage extends Message {

    data: ResponseData;
}

interface QSignal {
    connect(callback: SignalCallback): void;
}

class QSignalImpl implements QSignal {

    constructor(private object: QObject, private signalName: string, private signalIndex: number, private isPropertyNotifySignal: boolean) {

    }

    connect(callback: SignalCallback) {
        if (typeof (callback) !== "function") {
            console.error("Bad callback given to connect to signal " + this.signalName);
            return;
        }

        this.object.__objectSignals__[this.signalIndex] = this.object.__objectSignals__[this.signalIndex] || [];
        this.object.__objectSignals__[this.signalIndex].push(callback);

        // only required for "pure" signals, handled separately for properties in propertyUpdate
        if (this.isPropertyNotifySignal)
            return;

        // also note that we always get notified about the destroyed signal
        if (this.signalName === "destroyed" || this.signalName === "destroyed()" || this.signalName === "destroyed(QObject*)")
            return;

        // and otherwise we only need to be connected only once
        if (this.object.__objectSignals__[this.signalIndex].length == 1) {
            this.object.webChannel.exec({
                type: QWebChannelMessageTypes.connectToSignal,
                object: this.object.__id__,
                signal: this.signalIndex
            }, null);
        }
    }

    disconnect(callback: SignalCallback) {
        if (typeof (callback) !== "function") {
            console.error("Bad callback given to disconnect from signal " + this.signalName);
            return;
        }
        this.object.__objectSignals__[this.signalIndex] = this.object.__objectSignals__[this.signalIndex] || [];
        var idx = this.object.__objectSignals__[this.signalIndex].indexOf(callback);
        if (idx === -1) {
            console.error("Cannot find connection of signal " + this.signalName + " to " + callback.name);
            return;
        }
        this.object.__objectSignals__[this.signalIndex].splice(idx, 1);
        if (!this.isPropertyNotifySignal && this.object.__objectSignals__[this.signalIndex].length === 0) {
            // only required for "pure" signals, handled separately for properties in propertyUpdate
            this.object.webChannel.exec({
                type: QWebChannelMessageTypes.disconnectFromSignal,
                object: this.object.__id__,
                signal: this.signalIndex
            }, null);
        }
    }
}

class QObject {

    /** @internal */
    __id__: string;
    /** @internal */
    __objectSignals__: Map<SignalCallback[]> = {};
    private __propertyCache__: any = {};
    /** @internal */
    webChannel: QWebChannel;
    destroyed: QSignal = { connect: () => { } };


    constructor(name: string, data: any, webChannel: QWebChannel) {
        this.__id__ = name;
        webChannel.objects[name] = this;
        this.webChannel = webChannel;

        data.methods.forEach((m: any) => this.addMethod(m));

        data.properties.forEach((m: any) => this.bindGetterSetter(m));

        data.signals.forEach((signal: any) => { this.addSignal(signal, false); });

        Object.assign(this, data.enums);
    }

    private unwrapQObject(response: any): any {
        if (response instanceof Array) {
            // support list of objects
            return response.map(qobj => this.unwrapQObject(qobj))
        }
        if (!(response instanceof Object))
            return response;

        if (!response["__QObject*__"] || response.id === undefined) {
            const jObj: any = {};
            for (const propName of Object.keys(response)) {
                jObj[propName] = this.unwrapQObject(response[propName]);
            }
            return jObj;
        }

        var objectId = response.id;
        if (this.webChannel.objects[objectId])
            return this.webChannel.objects[objectId];

        if (!response.data) {
            console.error("Cannot unwrap unknown QObject " + objectId + " without data.");
            return;
        }

        const qObject = new QObject(objectId, response.data, this.webChannel);
        qObject.destroyed.connect(() => {
            if (this.webChannel.objects[objectId] === qObject) {
                delete this.webChannel.objects[objectId];
                // reset the now deleted QObject to an empty {} object
                // just assigning {} though would not have the desired effect, but the
                // below also ensures all external references will see the empty map
                // NOTE: this detour is necessary to workaround QTBUG-40021
                Object.keys(qObject).forEach(name => delete (<any>qObject)[name]);
            }
        });
        // here we are already initialized, and thus must directly unwrap the properties
        qObject.unwrapProperties();
        return qObject;
    }

    /** @internal */
    unwrapProperties() {
        for (const propertyIdx of Object.keys(this.__propertyCache__)) {
            this.__propertyCache__[propertyIdx] = this.unwrapQObject(this.__propertyCache__[propertyIdx]);
        }
    }

    private addSignal(signalData: any[], isPropertyNotifySignal: boolean) {
        var signalName = signalData[0];
        var signalIndex = signalData[1];
        (<any>this)[signalName] = new QSignalImpl(this, signalName, signalIndex, isPropertyNotifySignal);

    }

    /**
     * Invokes all callbacks for the given signalname. Also works for property notify callbacks.
     */
    private invokeSignalCallbacks(signalIndex: number, signalArgs: any) {
        var connections = this.__objectSignals__[signalIndex];
        if (connections) {
            connections.forEach(function (callback) {
                callback.apply(callback, signalArgs);
            });
        }
    }

    propertyUpdate(signals: any[], propertyMap: Dic<any>) {
        // update property cache
        for (const propertyIndex of Object.keys(propertyMap)) {
            var propertyValue = propertyMap[propertyIndex];
            this.__propertyCache__[propertyIndex] = this.unwrapQObject(propertyValue);
        }

        for (const signalName of Object.keys(signals)) {
            // Invoke all callbacks, as signalEmitted() does not. This ensures the
            // property cache is updated before the callbacks are invoked.
            this.invokeSignalCallbacks(<number><unknown>signalName, signals[<number><unknown>signalName]);
        }
    }

    /** @internal */
    signalEmitted(signalIndex: number, signalArgs: unknown) {
        this.invokeSignalCallbacks(signalIndex, this.unwrapQObject(signalArgs));
    }

    private addMethod(methodData: any[]) {
        var methodName = methodData[0];
        var methodIdx = methodData[1];

        // Fully specified methods are invoked by id, others by name for host-side overload resolution
        var invokedMethod = methodName[methodName.length - 1] === ')' ? methodIdx : methodName;

            (<any>this)[methodName] = function() {
                const args = [];
                let callback: SignalCallback | null = null;
                let errCallback: SignalCallback;
                for (let i = 0; i < arguments.length; ++i) {
                    var argument = arguments[i];
                    if (typeof argument === "function")
                        callback = argument;
                    else
                        args.push(argument);
                }

                var result;
                // during test, webChannel.exec synchronously calls the callback
                // therefore, the promise must be constucted before calling
                // webChannel.exec to ensure the callback is set up
                if (!callback && (typeof (Promise) === 'function')) {
                    result = new Promise(function (resolve, reject) {
                        callback = resolve;
                        errCallback = reject;
                    });
                }

                this.webChannel.exec({
                    "type": QWebChannelMessageTypes.invokeMethod,
                    "object": this.__id__,
                    "method": methodIdx,
                    "args": args
                }, (response: any) => {
                    if (response !== undefined) {
                        var result = this.unwrapQObject(response);
                        if (callback) {
                            (callback)(result);
                        }
                    } else if (errCallback) {
                        (errCallback)();
                    }
                });

                return result;
            };
    }

    toJSON(): Object {
        if (this.__id__ === undefined)
            return {};
        return {
            id: this.__id__,
            "__QObject*__": true
        };
    }

    private bindGetterSetter(propertyInfo: any[]) {
        var propertyIndex = propertyInfo[0];
        var propertyName = propertyInfo[1];
        var notifySignalData = propertyInfo[2];
        // initialize property cache with current value
        // NOTE: if this is an object, it is not directly unwrapped as it might
        // reference other QObject that we do not know yet
        this.__propertyCache__[propertyIndex] = propertyInfo[3];

        if (notifySignalData) {
            if (notifySignalData[0] === 1) {
                // signal name is optimized away, reconstruct the actual name
                notifySignalData[0] = propertyName + "Changed";
            }
            this.addSignal(notifySignalData, true);
        }

        Object.defineProperty(this, propertyName, {
            configurable: true,
            get: function () {
                var propertyValue = this.__propertyCache__[propertyIndex];
                if (propertyValue === undefined) {
                    // This shouldn't happen
                    console.warn("Undefined value in property cache for property \"" + propertyName + "\" in object " + this.__id__);
                }

                return propertyValue;
            },
            set: function (value) {
                if (value === undefined) {
                    console.warn("Property setter for " + propertyName + " called with undefined value!");
                    return;
                }
                this.__propertyCache__[propertyIndex] = value;
                var valueToSend = value;
                this.webChannel.exec({
                    "type": QWebChannelMessageTypes.setProperty,
                    "object": this.__id__,
                    "property": propertyIndex,
                    "value": valueToSend
                });
            }
        });

    }
}

export class QWebChannel {
    private transport: WebSocket;
    private execCallbacks: Map<Callback> = {};
    objects: Dic<QObject> = {};
    private execId: number = 0;

    constructor(transport: WebSocket, initCallback: InitCallback) {
        this.transport = transport;
        this.transport.onmessage = (message: MessageEvent) => this.onMessage(message);

        this.exec({ type: QWebChannelMessageTypes.init }, (data: ResponseData) => {
            for (const objectName of Object.keys(data)) {
                new QObject(objectName, data[objectName], this);
            }

            // now unwrap properties, which might reference other registered objects
            for (const objectName of Object.keys(this.objects)) {
                this.objects[objectName].unwrapProperties();
            }

            if (initCallback) {
                initCallback(this);
            }
            this.exec({ type: QWebChannelMessageTypes.idle }, null);
        });
    }

    private send(data: any) {
        if (typeof (data) !== "string") {
            data = JSON.stringify(data);
        }
        this.transport.send(data);
    }

    private onMessage(message: MessageEvent) {
        let data = message.data;
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        switch (data.type) {
            case QWebChannelMessageTypes.signal:
                this.handleSignal(data);
                break;
            case QWebChannelMessageTypes.response:
                this.handleResponse(data);
                break;
            case QWebChannelMessageTypes.propertyUpdate:
                this.handlePropertyUpdate(data);
                break;
            default:
                console.error("invalid message received:", message.data);
                break;
        }
    }


    /** @internal */
    exec(data: any, callback: any) {
        if (!callback) {
            // if no callback is given, send directly
            this.send(data);
            return;
        }
        if (this.execId === Number.MAX_VALUE) {
            // wrap
            this.execId = Number.MIN_VALUE;
        }
        if (data.hasOwnProperty("id")) {
            console.error("Cannot exec message with property id: " + JSON.stringify(data));
            return;
        }
        data.id = this.execId++;
        this.execCallbacks[data.id] = callback;
        this.send(data);
    }

    private handleSignal(message: Message) {
        var object = this.objects[message.object];
        if (object) {
            object.signalEmitted(message.signal, message.args);
        } else {
            console.warn("Unhandled signal: " + message.object + "::" + message.signal);
        }
    }

    private handleResponse(message: ResponseMessage) {
        if (!message.hasOwnProperty("id")) {
            console.error("Invalid response message received: ", JSON.stringify(message));
            return;
        }
        this.execCallbacks[message.id](message.data);
        delete this.execCallbacks[message.id];
    }

    private handlePropertyUpdate(message: PropertyMessage) {
        message.data.forEach(data => {
            var object = this.objects[data.object];
            if (object) {
                object.propertyUpdate(data.signals, data.properties);
            } else {
                console.warn("Unhandled property update: " + data.object + "::" + data.signal);
            }
        });
        this.exec({ type: QWebChannelMessageTypes.idle }, null);
    }

    private debug(message: Message) {
        this.send({ type: QWebChannelMessageTypes.debug, data: message });
    };
}