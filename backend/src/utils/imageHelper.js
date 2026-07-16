export const handleImageError = (e) => {
  console.error('Image failed to load:', e.target.src);
  
  // Create fallback avatar
  const parent = e.target.parentElement;
  const username = parent.dataset.username || '';
  const initial = username.charAt(0).toUpperCase() || 'U';
  
  // Replace with SVG avatar
  const svg = `
    <div class="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
      ${initial}
    </div>
  `;
  
  parent.innerHTML = svg;
};

export const getProfileImageUrl = (profilePicture, baseUrl = '') => {
  if (!profilePicture) return null;
  
  // If it's already a full URL, return as is
  if (profilePicture.startsWith('http')) {
    return profilePicture;
  }
  
  // If it's a relative path starting with /, prepend base URL
  if (profilePicture.startsWith('/')) {
    return `${baseUrl}${profilePicture}`;
  }
  
  // Default to relative path from root
  return profilePicture;
};