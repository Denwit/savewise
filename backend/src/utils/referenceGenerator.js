// Generate unique reference ID
export const generateReferenceId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CONTACT-${timestamp}-${random}`;
};

// Alternative: Sequential reference ID
export const generateSequentialReferenceId = (counter) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const seq = counter.toString().padStart(4, '0');
  return `CT${year}${month}${day}-${seq}`;
};