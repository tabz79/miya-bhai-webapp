// src/routes/user.js
import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getUserProfile, upsertUserAddress } from '../services/userService.js';

const router = express.Router();

// All routes in this file require authentication
router.use(requireAuth);

/**
 * GET /api/user/profile
 * Fetches the logged-in user's profile and their most recent address.
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getUserProfile(userId);
    res.json(profile || {}); // Return profile or empty object if not found
  } catch (error) {
    console.error(`[GET /api/user/profile] Error for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Could not fetch user profile.' });
  }
});

/**
 * PUT /api/user/profile
 * Updates the logged-in user's profile data (name, phone).
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    const savedProfile = await updateUserProfile(userId, profileData);
    res.status(200).json(savedProfile);
  } catch (error) {
    console.error(`[PUT /api/user/profile] Error for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Could not update user profile.' });
  }
});

/**
 * PUT /api/user/profile/address
 * Creates or updates the logged-in user's address.
 */
router.put('/profile/address', async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    if (!addressData) {
      return res.status(400).json({ error: 'Address data is required.' });
    }

    const savedAddress = await upsertUserAddress(userId, addressData);
    res.status(200).json(savedAddress);
  } catch (error) {
    console.error(`[PUT /api/user/profile/address] Error for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Could not save user address.' });
  }
});

export default router;
