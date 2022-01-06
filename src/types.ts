export interface Token {
    name: string,
    key: string
}

export interface Cube {
    id: string,
    ip: string,
    location: string,
    sensors: Array<Sensor>,
    actuators: Array<string>
}

export interface CubeVariables {
    location: string,
    sensors: Array<Sensor>,
    actuators: string
}

export interface Sensor {
    type: string,
    scanInterval: number
}