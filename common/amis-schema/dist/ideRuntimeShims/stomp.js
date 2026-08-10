"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStompInitDestination = isStompInitDestination;
exports.subscribeWithInitial = subscribeWithInitial;
exports.subscribeTopic = subscribeTopic;
exports.subscribeQueue = subscribeQueue;
exports.subscribeUserTopic = subscribeUserTopic;
exports.subscribe = subscribe;
exports.unsubscribeTopic = unsubscribeTopic;
exports.unsubscribeQueue = unsubscribeQueue;
exports.unsubscribeUserTopic = unsubscribeUserTopic;
exports.unsubscribe = unsubscribe;
exports.unsubscribeAll = unsubscribeAll;
exports.unsubscribeAllTopics = unsubscribeAllTopics;
exports.unsubscribeAllQueues = unsubscribeAllQueues;
exports.unsubscribeAllUserTopics = unsubscribeAllUserTopics;
exports.sendBinary = sendBinary;
exports.sendText = sendText;
exports.sendJson = sendJson;
exports.send = send;
exports.connect = connect;
exports.disconnect = disconnect;
exports.reconnect = reconnect;
exports.onStompConnected = onStompConnected;
exports.onStompDisconnected = onStompDisconnected;
exports.isConnected = isConnected;
exports.isActive = isActive;
exports.isStompAuthenticated = isStompAuthenticated;
const noopUnsubscribe = () => undefined;
function isStompInitDestination(destination) {
    return destination.startsWith('/app/') && destination.endsWith('/init');
}
function subscribeWithInitial() {
    return { bootstrapDone: Promise.resolve(), unsubscribe: noopUnsubscribe };
}
function subscribeTopic() {
    return noopUnsubscribe;
}
function subscribeQueue() {
    return noopUnsubscribe;
}
function subscribeUserTopic() {
    return noopUnsubscribe;
}
function subscribe() {
    return noopUnsubscribe;
}
function unsubscribeTopic() { }
function unsubscribeQueue() { }
function unsubscribeUserTopic() { }
function unsubscribe() { }
function unsubscribeAll() { }
function unsubscribeAllTopics() { }
function unsubscribeAllQueues() { }
function unsubscribeAllUserTopics() { }
async function sendBinary() { }
async function sendText() { }
async function sendJson() { }
async function send() { }
async function connect() { }
async function disconnect() { }
async function reconnect() { }
function onStompConnected() {
    return noopUnsubscribe;
}
function onStompDisconnected() {
    return noopUnsubscribe;
}
function isConnected() {
    return false;
}
function isActive() {
    return false;
}
function isStompAuthenticated() {
    return false;
}
class StompClient {
}
exports.default = StompClient;
