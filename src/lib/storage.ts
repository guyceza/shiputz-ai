// Upload image to Supabase Storage and return URL
export async function uploadImage(
  base64Image: string, 
  userId: string, 
  folder: 'receipts' | 'photos' | 'vision' | 'quotes' = 'misc'
): Promise<string | null> {
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, folder, userId })
    });
    
    if (!response.ok) {
      console.error('Upload failed:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.url || null;
    
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// Check if a string is a base64 image (not a URL)
export function isBase64Image(str: string | undefined): boolean {
  if (!str) return false;
  return str.startsWith('data:image/') || 
         (str.length > 1000 && !str.startsWith('http'));
}

// Convert base64 images in project data to URLs
export async function migrateProjectImages(
  projectData: {
    expenses?: Array<{ imageUrl?: string }>;
    photos?: Array<{ imageUrl?: string }>;
    savedQuotes?: Array<{ imageUrl?: string }>;
  },
  userId: string
): Promise<boolean> {
  let migrated = false;
  
  // Migrate expense images
  if (projectData.expenses) {
    for (const expense of projectData.expenses) {
      if (expense.imageUrl && isBase64Image(expense.imageUrl)) {
        const url = await uploadImage(expense.imageUrl, userId, 'receipts');
        if (url) {
          expense.imageUrl = url;
          migrated = true;
        }
      }
    }
  }
  
  // Migrate photo images
  if (projectData.photos) {
    for (const photo of projectData.photos) {
      if (photo.imageUrl && isBase64Image(photo.imageUrl)) {
        const url = await uploadImage(photo.imageUrl, userId, 'photos');
        if (url) {
          photo.imageUrl = url;
          migrated = true;
        }
      }
    }
  }
  
  // Migrate quote images
  if (projectData.savedQuotes) {
    for (const quote of projectData.savedQuotes) {
      if (quote.imageUrl && isBase64Image(quote.imageUrl)) {
        const url = await uploadImage(quote.imageUrl, userId, 'quotes');
        if (url) {
          quote.imageUrl = url;
          migrated = true;
        }
      }
    }
  }
  
  return migrated;
}
