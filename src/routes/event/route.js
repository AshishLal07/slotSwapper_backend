import express from "express";
import {createEvent,getEvent, updateEventStatus, deleteEvent, swappableSlot, swapRequest, outgoingRequest, incommingRequest, swapResponse} from '../../controllers/event/controller.js'

const eventRoutes = express.Router();

eventRoutes.route('/slot').get(getEvent);
eventRoutes.route('/slot').post(createEvent)
eventRoutes.route('/slot/:eventId/:userId/').put(updateEventStatus)
eventRoutes.route('/slot/:eventId').delete(deleteEvent)
eventRoutes.route('/slot/swappable').get(swappableSlot)
eventRoutes.route('/slot/swap-request').post(swapRequest)
eventRoutes.route('/slot/swap-requests/outgoing').get(outgoingRequest)
eventRoutes.route('/slot/swap-requests/incoming').get(incommingRequest);
eventRoutes.route('/slot/swap-response/:requestId').post(swapResponse)

export default eventRoutes