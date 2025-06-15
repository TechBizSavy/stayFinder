import express from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests, totalPrice } = req.body;

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if dates are available
    const existingBookings = await prisma.booking.findMany({
      where: {
        listingId,
        status: {
          in: ['CONFIRMED', 'PENDING']
        },
        OR: [
          {
            checkIn: {
              lte: new Date(checkOut)
            },
            checkOut: {
              gte: new Date(checkIn)
            }
          }
        ]
      }
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ error: 'Selected dates are not available' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        listingId,
        userId: req.user.id,
        checkIn,
        checkOut
      }
    });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: parseInt(guests),
        totalPrice: parseFloat(totalPrice),
        userId: req.user.id,
        listingId,
        status: 'PENDING'
      },
      include: {
        listing: {
          select: {
            title: true,
            location: true,
            images: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true,
            host: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get host's bookings
router.get('/host-bookings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isHost) {
      return res.status(403).json({ error: 'Only hosts can access this endpoint' });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        listing: {
          hostId: req.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        listing: {
          select: {
            title: true,
            location: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists and belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        listing: {
          select: {
            title: true,
            location: true
          }
        }
      }
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;