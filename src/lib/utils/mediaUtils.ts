
export const getMediaTypeFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    if (contentType?.startsWith('image/')) return 'image';
    if (contentType?.startsWith('audio/')) return 'audio';
    if (contentType?.startsWith('video/')) return 'video';
    return 'unknown';
  } catch (error) {
    console.error('Error detecting media type:', error);
    return 'unknown';
  }
};