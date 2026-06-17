import { EventEmitter } from "events";

class AppointmentEventEmitter extends EventEmitter {}

export const appointmentEvents = new AppointmentEventEmitter();
