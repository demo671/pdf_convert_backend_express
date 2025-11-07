/**
 * Get current user information from request
 */
const getCurrentUserId = (req) => {
  if (!req.user || !req.user.userId) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
};

const getCurrentUserEmail = (req) => {
  if (!req.user || !req.user.email) {
    throw new Error('User not authenticated');
  }
  return req.user.email;
};

const getCurrentUserRole = (req) => {
  if (!req.user || !req.user.role) {
    throw new Error('User not authenticated');
  }
  return req.user.role;
};

/**
 * Format file size in human-readable format
 */
const formatFileSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Validate RFC format
 */
const isValidRfc = (rfc) => {
  if (!rfc) return false;
  const rfcPattern = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(rfc);
};

/**
 * Validate period format (MM/YYYY)
 */
const isValidPeriodo = (periodo) => {
  if (!periodo) return false;
  return /^\d{2}\/\d{4}$/.test(periodo);
};

/**
 * Validate amount format
 */
const isValidMonto = (monto) => {
  if (!monto) return false;
  const cleanMonto = monto.toString().replace(/[$,]/g, '');
  return !isNaN(parseFloat(cleanMonto));
};

module.exports = {
  getCurrentUserId,
  getCurrentUserEmail,
  getCurrentUserRole,
  formatFileSize,
  isValidRfc,
  isValidPeriodo,
  isValidMonto
};

