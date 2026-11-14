import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const COOKIE_NAME = 'token';
const isProduction = process.env.NODE_ENV === 'production';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);

    if (!result) {
      return sendError(res, 'Invalid username or password', 401);
    }

    // Set secure HttpOnly cookie
    res.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return sendSuccess(res, result, 'Signed in successfully');
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
  return sendSuccess(res, null, 'Signed out successfully');
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}
