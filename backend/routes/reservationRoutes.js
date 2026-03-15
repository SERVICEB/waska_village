const express = require('express');
const router = express.Router();
const { 
  createReservation, 
  getReservations, 
  checkIn, 
  checkOut, 
  moveRoom 
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getReservations).post(createReservation);
router.patch('/:id/checkin', checkIn);
router.patch('/:id/checkout', checkOut);
router.patch('/:id/move', moveRoom);

module.exports = router;