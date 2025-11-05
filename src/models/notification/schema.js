import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SWAP_REQUEST', 'SWAP_ACCEPTED', 'SWAP_REJECTED'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  swapRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest'
  },
  read: {
    type: Boolean,
    default: false
  },
   createdAt: { type: Date, default: Date.now, expires: 2592000 } // Auto-delete after 30 days

});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;