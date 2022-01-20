/**
 * Module for MQTT util methods.
 * 
 * @module
 */

//type imports
import { MqttClient, ISubscriptionMap, IPublishPacket, ISubscriptionGrant } from "mqtt";
import { Cube } from "../types";
//external imports
import mqtt from "mqtt";
//internal imports
import { addCube, deleteCubeWithId, getCubes, updateCubeWithId } from "../model/cube";
import { persistSensorData } from "../model/sensor_data";
import { checkForServerToken } from "../model/token";

/**
 * Holds the connection to the MQTT broker.
 */
var mqttClient: MqttClient;
/**
 * Holds the default topics, that should be subscribed to
 */
var defaultTopics: ISubscriptionMap = {
    'cube/#': {
        'qos': 2,
    }
};

/**
 * Sets up the connection to the MQTT broker and subscribes to the MQTT topics of
 * each registered [Cube]{@link types.Cube}.
 */
export async function setupMQTT(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        console.log('attempting MQTT server connection ...');

        //Get broker address
        let mqttUrl: string = process.env.MQTTURL || 'test.mosquitto.org';
        let mqttPort: number = parseInt(process.env.MQTTPORT || '1883');
        //Connect to broker
        mqttClient = mqtt.connect([{
            host: 'mqtt://'+mqttUrl,
            port: mqttPort
        }]);

        mqttClient.on('connect', async function() {
            console.log('connected to MQTT server');

            //Set event listeners
            mqttClient.on('reconnect', () => logMQTTEvent('Reconnect'));
            mqttClient.on('close', () => logMQTTEvent('Close'));
            mqttClient.on('disconnect', () => logMQTTEvent('Disconnect'));
            mqttClient.on('offline', () => logMQTTEvent('Offline'));
            mqttClient.on('error', (error) => logMQTTEvent('Error', [error]));
            mqttClient.on('end', () => logMQTTEvent('End'));
            mqttClient.on('packetsend', () => logMQTTEvent('Packetsend'));
            mqttClient.on('packetreceive', (packet) => logMQTTEvent('Packetreceive', [packet]));
            mqttClient.on('message', handleMQTTMessage);
            
            // Only subscribe to topics, if the app is setup
            let setup: boolean = await checkForServerToken();
            if (setup) {
                // Set default topics
                subscribeDefaultTopics();

                // Subscribe to sensor data of existing cubes
                let cubes: Cube[] = await getCubes();
                let ids: string[] = [];
                cubes.forEach((cube: Cube) => {
                    ids.push(cube.id);
                });
                subscribeCubeMQTTTopics(ids);
            }
        });
    });
}

/**
 * Wrapper to subscribe to the default MQTT topics.
 */
export async function subscribeDefaultTopics(): Promise<void> {
    return subscribeMQTTTopics(defaultTopics);
}

/**
 * Wrapper to unsubscribe from the default MQTT topics.
 */
 export async function unsubscribeDefaultTopics(): Promise<void> {
    return unsubscribeMQTTTopics(Object.keys(defaultTopics));
}

/**
 * Wrapper to subscribe to the MQTT topics for existing cubes.
 * 
 * @param cubeIds ids of [Cubes]{@link types.Cube}
 */
export async function subscribeCubeMQTTTopics(cubeIds: string[]): Promise<void> {
    let topics: ISubscriptionMap = {};
    cubeIds.forEach((id) => {
        let topic: string = 'sensor/+/'+id+'/#';
        topics[topic] = {'qos': 2};
    });
    
    return subscribeMQTTTopics(topics);
}

/**
 * Wrapper to unsubscribe from the MQTT topics for existing cubes.
 * 
 * @param cubeIds ids of [Cubes]{@link types.Cube}
 */
 export async function unsubscribeCubeMQTTTopics(cubeIds: string[]): Promise<void> {
    let topics: Array<string> = [];
    cubeIds.forEach((id: string) => {
        let topic: string = 'sensor/+/'+id+'/#';
        topics.push(topic);
    });
    
    return unsubscribeMQTTTopics(topics);
}

/**
 * Subscribe to specified topics.
 * 
 * @param topics topics to be subscribed to
 */
function subscribeMQTTTopics(topics: ISubscriptionMap): Promise<void> {
    return new Promise((resolve, reject) => {
        //Subscribe to topics
        mqttClient.subscribe(topics, function(err: Error, granted: ISubscriptionGrant[]) {
            if(err) {
                console.log(err);
                reject(err);
            }

            if (granted) {
                granted.forEach(function(value: ISubscriptionGrant) {
                    console.log(`MQTT: Subscribed to ${value.topic} with QoS level ${value.qos}.`);
                })

                resolve();
            }
        });
    });
}

/**
 * Unsubscribe from specified topics.
 * 
 * @param topics topics to be unsubscribed from
 */
 function unsubscribeMQTTTopics(topics: Array<string>): Promise<void> {
    return new Promise((resolve, reject) => {
        if (topics.length === 0) {
            resolve();
        }
        
        //Unsubscribe from topics
        mqttClient.unsubscribe(topics, function(err: Error) {
            if(err) {
                console.log(err);
                reject(err);
            } else {
                console.log("MQTT: unsubscribed from: " + topics);
                resolve();
            }
        });
    });
}

/**
 * Log MQTT events.
 * 
 * @param event string for the event that has happend
 * @param options options of that event
 */
function logMQTTEvent(event: string, options: Array<any> = []): void {
    // console.log(`Event emitted: ${event}`);
}

/**
 * Handler for MQTT messages.
 * 
 * Currently only listens to topics that start with "sensor"
 * 
 * @param topicString the whole topic of the message
 * @param messageBuffer the message
 * @param packet the options for this message
 */
function handleMQTTMessage(topicString: string, messageBuffer: Buffer, packet: IPublishPacket): void {
    let message: string = messageBuffer.toString();
    let topic: Array<string> = topicString.split('/');

    switch (topic[0]) {
        case 'sensor':
            handleSensorData(topic, message);
            break;
        case 'cube':
            handleCubeData(topic, message);
            break;
        default:
            console.log('Unrecognized topic: ' + topic[0]);
    }
}

async function handleCubeData(topic: Array<string>, message: string) {
    var cube: Cube = JSON.parse(message);

    switch (topic[1]) {
        case 'create':
            try {
                await addCube(cube.id, cube.location);
                console.log("added cube "+ cube.id +" at location " + cube.location);
            } catch (error) {
                console.log(error);
            }
            break;
        case 'update':
            try {
                await updateCubeWithId(cube.id, {location: cube.location});
                console.log("updated cube "+ cube.id +" at location " + cube.location);
            } catch (error) {
                console.log(error);
            }
            break;
        case 'delete':
            try {
                await deleteCubeWithId(cube.id);
                console.log("deleted cube "+ cube.id);
            } catch (error) {
                console.log(error);
            }
            break;
        default:
            console.log('Unrecognized topic: ' + topic[0] + "/" + topic[1]);
    }
}

/**
 * Handler for persisting sensor data.
 * 
 * @param topic topic of the message formatted like this: sensor/sensor_type/cubeId
 */
function handleSensorData(topic: Array<string>, message: string): void {
    if (topic[1] === "co2") {
        persistSensorData(topic[2], message)
            .catch((err: Error) => {
                console.log(err.stack);
            });
    }
}