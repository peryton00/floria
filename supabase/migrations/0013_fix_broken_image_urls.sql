-- Fix broken Unsplash image URLs (photos were removed from Unsplash)
UPDATE product_images
SET image_url = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80'
WHERE image_url LIKE '%photo-1593482892290-f54927ae1bf6%';

UPDATE product_images
SET image_url = 'https://images.unsplash.com/photo-1589393922695-ef4c2f236b67?w=600&auto=format&fit=crop&q=80'
WHERE image_url LIKE '%photo-1593691509543-c55fb32e7355%';

