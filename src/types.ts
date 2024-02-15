export interface Token {
    name: string,
    key: string,
    created: Date,
    ttl: number
}

export interface Cube {
    id: string,
    location: string,
    actuators: Array<Actuator>
}

export interface CubeVariables {
    location: string
}

export interface Actuator {
    type: string,
    values: Array<string>
}

export interface ActuatorData {
    value: object,
    time?: number
}