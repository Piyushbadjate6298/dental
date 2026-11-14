import * as inquiryService from '../services/inquiryService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getInquiries(req, res, next) {
  try {
    const {
      search,
      status,
      doctorId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await inquiryService.getInquiries({
      search,
      status,
      doctorId,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit !== undefined ? Number(limit) : 0, // 0 = return all for desktop/mobile views unless paginated
    });

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getInquiryById(req, res, next) {
  try {
    const inquiry = await inquiryService.getInquiryById(req.params.id);
    if (!inquiry) {
      return sendError(res, 'Inquiry record not found', 404);
    }
    return sendSuccess(res, inquiry);
  } catch (err) {
    next(err);
  }
}

export async function createInquiry(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const inquiry = await inquiryService.createInquiry(req.body, performedBy);
    return sendSuccess(res, inquiry, 'Inquiry submitted and saved successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

export async function updateInquiry(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const inquiry = await inquiryService.updateInquiry(req.params.id, req.body, performedBy);
    return sendSuccess(res, inquiry, 'Inquiry updated successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

export async function deleteInquiry(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const result = await inquiryService.deleteInquiry(req.params.id, performedBy);
    return sendSuccess(res, result, 'Inquiry record deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}
