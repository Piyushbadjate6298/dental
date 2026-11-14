export const schemas = {
  login: (body) => {
    const errors = [];
    if (!body.username || typeof body.username !== 'string' || !body.username.trim()) {
      errors.push('Username is required');
    }
    if (!body.password || typeof body.password !== 'string' || !body.password.trim()) {
      errors.push('Password is required');
    }
    return errors;
  },

  changePassword: (body) => {
    const errors = [];
    if (!body.currentPassword || typeof body.currentPassword !== 'string') {
      errors.push('Current password is required');
    }
    if (!body.newPassword || typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }
    return errors;
  },

  doctor: (body) => {
    const errors = [];
    const name = body.doctor_name || body.name;
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('Doctor name is required');
    } else if (name.trim().length < 2) {
      errors.push('Doctor name must be at least 2 characters');
    } else if (name.trim().length > 150) {
      errors.push('Doctor name cannot exceed 150 characters');
    }
    return errors;
  },

  inquiry: (body) => {
    const errors = [];
    if (!body.patient || typeof body.patient !== 'string' || !body.patient.trim()) {
      errors.push('Patient name is required');
    }
    if (!body.doctor || typeof body.doctor !== 'string' || !body.doctor.trim()) {
      errors.push('Doctor name is required');
    }
    if (!body.date || typeof body.date !== 'string' || !body.date.trim()) {
      errors.push('Inquiry date is required');
    }
    return errors;
  },

  settings: (body) => {
    const errors = [];
    if (body.whatsapp !== undefined) {
      if (!body.whatsapp || typeof body.whatsapp !== 'string' || !body.whatsapp.replace(/\D/g, '')) {
        errors.push('Valid WhatsApp destination number is required');
      }
    }
    return errors;
  },
};
