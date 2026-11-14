import * as doctorService from '../services/doctorService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getDoctors(req, res, next) {
  try {
    const activeOnly = req.query.active_only === 'true' || req.query.active === 'true';
    const doctors = await doctorService.getDoctors({ activeOnly });
    return sendSuccess(res, doctors);
  } catch (err) {
    next(err);
  }
}

export async function getDoctorById(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }
    return sendSuccess(res, doctor);
  } catch (err) {
    next(err);
  }
}

export async function createDoctor(req, res, next) {
  try {
    const name = req.body.doctor_name || req.body.name;
    const performedBy = req.user?.username || 'admin';
    const doctor = await doctorService.addDoctor(name, performedBy);
    return sendSuccess(res, doctor, 'Doctor added successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

export async function updateDoctor(req, res, next) {
  try {
    const name = req.body.doctor_name || req.body.name;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : true;
    const performedBy = req.user?.username || 'admin';
    const doctor = await doctorService.updateDoctor(req.params.id, name, isActive, performedBy);
    return sendSuccess(res, doctor, 'Doctor updated successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

export async function deleteDoctor(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const result = await doctorService.deleteDoctor(req.params.id, performedBy);
    return sendSuccess(res, result, 'Doctor removed successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}
