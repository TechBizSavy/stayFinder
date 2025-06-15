import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all listings with filters
router.get('/', async (req, res) => {
  try {
    const { location, minPrice, maxPrice, guests } = req.query;
    
    const where = {};
    
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    if (guests) {
      where.maxGuests = {
        gte: parseInt(guests)
      };
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookings: {
          select: {
            checkIn: true,
            checkOut: true,
            status: true
          },
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create new listing (host only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isHost) {
      return res.status(403).json({ error: 'Only hosts can create listings' });
    }

    const {
      title,
      description,
      price,
      location,
      latitude,
      longitude,
      images,
      amenities,
      maxGuests,
      bedrooms,
      bathrooms
    } = req.body;

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: images || [],
        amenities: amenities || [],
        maxGuests: parseInt(maxGuests),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        hostId: req.user.id
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing (host only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if listing exists and belongs to the user
    const existingListing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const {
      title,
      description,
      price,
      location,
      latitude,
      longitude,
      images,
      amenities,
      maxGuests,
      bedrooms,
      bathrooms
    } = req.body;

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: images || [],
        amenities: amenities || [],
        maxGuests: parseInt(maxGuests),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms)
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing (host only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if listing exists and belongs to the user
    const existingListing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await prisma.listing.delete({
      where: { id }
    });

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Get host's listings
router.get('/host/my-listings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isHost) {
      return res.status(403).json({ error: 'Only hosts can access this endpoint' });
    }

    const listings = await prisma.listing.findMany({
      where: {
        hostId: req.user.id
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(listings);
  } catch (error) {
    console.error('Error fetching host listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

export default router;