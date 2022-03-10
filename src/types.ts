export interface Token {
    name: string,
    key: string
}

export interface Cube {
    id: string,
    location: string
}

export interface CubeVariables {
    location: string
}

export interface ActuatorData {
    value: number,
    time?: number
}