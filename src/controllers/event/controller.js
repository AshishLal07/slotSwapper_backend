import mongoose from "mongoose";
import Event from "../../models/event/schema.js";
import SwapRequest  from "../../models/swapRequest/schema.js";
import Notification from "../../models/notification/schema.js";
import { sendSocketNotification } from "../../../index.js";

const createEvent = async (req, res) => {
    
  try {
    const { title, date, startTime, endTime } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const event = new Event({
      userId: req.userId,
      title,
      date,
      startTime,
      endTime,
      status: 'BUSY'
    });

    await event.save();
    res.status(200).json({message:"Event Created successfully", event });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
}}
;

const getEvent = async (req,res) => {
    try {

    const userEvent = await Event.find({userId:req.userId},{_id:1,title:1, startTime:1, endTime:1,date:1,status:1})
    
    
    res.status(200).json({message:"Event Created successfully", userEvent });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
}
}

const updateEventStatus = async (req,res) => {
    try {
        const {eventId,userId} = req.params;
        const {status} = req.query;

        if(!eventId && !userId && !status){
            return res.status(400).json({message:"Values are missing"})

        }
        
        if(userId !== req.userId.toString()){
            return res.status(401).json({message:"Unauthorized access"})
        }

        const updateEvent = await Event.findOne({_id:eventId, userId});
        if(!updateEvent){
            return res.status(400).json({message:"Event is not available"})
        }
        updateEvent.status = status;
        await updateEvent.save()

        return res.status(200).json("Event updated Successfully")
        // console.log(req.params, req.query)
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
}

const deleteEvent = async (req,res ) => {
    const {eventId} = req.params;
    if(!eventId){
        return res.status(400).json({message:"Values are missing"})
    }
     const updateEvent = await Event.deleteOne({_id:eventId, userId: req.userId});
        if(!updateEvent){
            return res.status(400).json({message:"Event is not available"})
        }

        return res.status(200).json({message:"Deleted successfully"})

}

 const swappableSlot = async (req,res) => {
    try{    
      const slots = await Event.find({
        userId: { $ne: req.userId },
        status: 'SWAPPABLE'
        }).populate('userId', 'userName');
        console.log(slots, req.userId);

      res.status(200).json({message:"Event swappable slot available" , slots });
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Failed to fetch swappable slots' });
  }

}


const swapRequest = async (req,res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Both slot IDs are required' });
    }

    // Fetch both slots
    const mySlot = await Event.findById(mySlotId).session(session);
    const theirSlot = await Event.findById(theirSlotId).session(session);
    console.log(mySlot, "+++++++->");
    console.log(theirSlot, "----->")
    console.log(req.userId);
    console.log(mySlot.userId , req.userId);
    

    // Validation
    if (!mySlot || !theirSlot) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'One or both slots not found' });
    }

    if (mySlot.userId.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ error: 'You do not own the offered slot' });
    }

    if (theirSlot.userId.toString() === req.userId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot swap with your own slot' });
    }

    if (mySlot.status !== 'SWAPPABLE') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Your slot must be SWAPPABLE' });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Requested slot is no longer available' });
    }

    // Create swap request
    const swapRequest = new SwapRequest({
      fromUserId: req.userId,
      toUserId: theirSlot.userId,
      offerSlotId: mySlotId,
      requestSlotId: theirSlotId,
      status: 'PENDING'
    });

    await swapRequest.save({ session });

    // Update both slots to SWAP_PENDING
    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';

    await mySlot.save({ session });
    await theirSlot.save({ session });

    // // Create notification
    const notification = new Notification({
      userId: theirSlot.userId,
      type: 'SWAP_REQUEST',
      message: `${req.userName} wants to swap "${mySlot.title}" for your "${theirSlot.title}"`,
      swapRequestId: swapRequest._id
    });

    await notification.save({ session });

    await session.commitTransaction();

    // // Send real-time notification via Socket.IO
    sendSocketNotification(theirSlot.userId, {
      type: 'SWAP_REQUEST',
      message: notification.message,
      swapRequestId: swapRequest._id,
      timestamp: new Date()
    });

    res.status(200).json({ 
      swapRequest,
      message: 'Swap request sent successfully' 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Swap request error:', error);
    res.status(500).json({ error: 'Failed to create swap request' });
  } finally {
    session.endSession();
  }
};

const swapResponse = async (req,res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;
    const { accept } = req.body;

    if (typeof accept !== 'boolean') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Accept parameter must be boolean' });
    }

    // Fetch swap request with populated slots
    const swapRequest = await SwapRequest.findById(requestId)
      .session(session)
      .populate('offerSlotId')
      .populate('requestSlotId')
      .populate('fromUserId', 'userName')
      .populate('toUserId', 'userName');

    if (!swapRequest) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Swap request not found' });
    }

    // Verify the user is the recipient
    if (swapRequest.toUserId._id.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ error: 'Unauthorized to respond to this swap request' });
    }

    // Check if already responded
    if (swapRequest.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Swap request already responded to' });
    }

    const offerSlot = swapRequest.offerSlotId;
    const requestSlot = swapRequest.requestSlotId;

    if (accept) {
      // ACCEPT: Perform the swap
      
      // Exchange ownership
      const tempUserId = offerSlot.userId;
      offerSlot.userId = requestSlot.userId;
      requestSlot.userId = tempUserId;

      // Set both slots back to BUSY
      offerSlot.status = 'BUSY';
      requestSlot.status = 'BUSY';

      await offerSlot.save({ session });
      await requestSlot.save({ session });

      // Update swap request
      swapRequest.status = 'ACCEPTED';
      swapRequest.respondedAt = new Date();
      await swapRequest.save({ session });

    //   Create notifications for both users
      const notificationToRequester = new Notification({
        userId: swapRequest.fromUserId._id,
        type: 'SWAP_ACCEPTED',
        message: `${swapRequest.toUserId.userName} accepted your swap request!`,
        swapRequestId: swapRequest._id
      });

      const notificationToResponder = new Notification({
        userId: swapRequest.toUserId._id,
        type: 'SWAP_ACCEPTED',
        message: `You accepted the swap with ${swapRequest.fromUserId.userName}`,
        swapRequestId: swapRequest._id
      });

      await notificationToRequester.save({ session });
      await notificationToResponder.save({ session });

      await session.commitTransaction();

      // Send real-time notifications
      sendSocketNotification(swapRequest.fromUserId._id, {
        type: 'SWAP_ACCEPTED',
        message: notificationToRequester.message,
        swapRequestId: swapRequest._id,
        timestamp: new Date()
      });

      sendSocketNotification(swapRequest.toUserId._id, {
        type: 'SWAP_ACCEPTED',
        message: notificationToResponder.message,
        swapRequestId: swapRequest._id,
        timestamp: new Date()
      });

      res.json({ 
        message: 'Swap accepted successfully',
        swapRequest 
      });

    } else {
      // REJECT: Restore slots to SWAPPABLE
      
      offerSlot.status = 'SWAPPABLE';
      requestSlot.status = 'SWAPPABLE';

      await offerSlot.save({ session });
      await requestSlot.save({ session });

      // Update swap request
      swapRequest.status = 'REJECTED';
      swapRequest.respondedAt = new Date();
      await swapRequest.save({ session });

      // Create notification for requester
      const notification = new Notification({
        userId: swapRequest.fromUserId._id,
        type: 'SWAP_REJECTED',
        message: `${swapRequest.toUserId.userName} declined your swap request`,
        swapRequestId: swapRequest._id
      });

      await notification.save({ session });

      await session.commitTransaction();

    //   // Send real-time notification
      sendSocketNotification(swapRequest.fromUserId._id, {
        type: 'SWAP_REJECTED',
        message: notification.message,
        swapRequestId: swapRequest._id,
        timestamp: new Date()
      });

      res.json({ 
        message: 'Swap rejected',
        swapRequest 
      });
    }

  } catch (error) {
    await session.abortTransaction();
    console.error('Swap response error:', error);
    res.status(500).json({ error: 'Failed to process swap response' });
  } finally {
    session.endSession();
  }

}

const incommingRequest = async (req, res ) => {
    try {
    const requests = await SwapRequest.find({
      toUserId: req.userId,
      status: 'PENDING'
    })
    .populate('fromUserId', 'userName')
    .populate('offerSlotId', '_id title date endTime startTime')
    .populate('requestSlotId', '_id title date endTime startTime')
    .sort({ createdAt: -1 });

    res.status(200).json({ requests });

    } catch (error) {
      await session.abortTransaction();
      console.error('Swap request error:', error);
      res.status(500).json({ error: 'Failed to create swap request' });
    }
}

const outgoingRequest = async (req, res ) => {
    try {
    const requests = await SwapRequest.find({
      fromUserId: req.userId,
      status: 'PENDING'
    })
    .populate('toUserId', 'userName')
    .populate('offerSlotId', '_id title date endTime startTime')
    .populate('requestSlotId', '_id title date endTime startTime')
    .sort({ createdAt: -1 });

    res.status(200).json({ requests });
    } catch (error) {
      await session.abortTransaction();
      console.error('Swap request error:', error);
      res.status(500).json({ error: 'Failed to create swap request' });
    }
}

export {
    createEvent,
    getEvent,
    updateEventStatus,
    deleteEvent,
    swappableSlot,
    swapRequest,
    incommingRequest,
    outgoingRequest,
    swapResponse
};