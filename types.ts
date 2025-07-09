export enum SQSocketEventType {
    CODE = 0,
    ATTACHED = 1,
    START = 2,
    END = 3,
    PROBLEM = 4,
    TIMER_STOP = 5,
    TIMER_RESUME = 6,
    TIMESYNC = 7,
    DETACH = 8
}

export enum SMSocketEventType {
    IDENTIFY = 0,
    UNAUTHORIZED = 1,
    INVALID_CODE = 2,
    IDENTIFIED = 3,
    START = 4,
    END = 5,
    PROBLEM = 6,
    TIMER_STOP = 7,
    TIMER_RESUME = 8,
    TIMESYNC = 9,
    DETACH = 10
}

export enum SQState {
    PENDING = 0,
    ONGOING = 1,
    TIMER_STOPPED = 2
}