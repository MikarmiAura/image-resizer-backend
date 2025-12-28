import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

async function parseImageData(req) {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data)));
      req.on('error', reject);
    });
    
    const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    return {
      buffer,
      width: parseInt(body.width) || null,
      height: parseInt(body.height) || null,
      format: body.format || 'webp',
      quality: parseInt(body.quality) || 80,
    };
  }
  
  throw new Error('Unsupported content type');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.' 
    });
  }
  
  try {
    const { buffer, width, height, format, quality } = await parseImageData(req);
    
    if (buffer.length > 4.5 * 1024 * 1024) {
      return res.status(413).json({ 
        error: 'Image too large. Maximum size is 4.5MB.' 
      });
    }
    
    let transformer = sharp(buffer);
    
    if (width || height) {
      transformer = transformer.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    const formatOptions = {
      quality,
      progressive: true,
      compressionLevel: 9,
      effort: 6,
    };
    
    switch (format.toLowerCase()) {
      case 'webp':
        transformer = transformer.webp(formatOptions);
        break;
      case 'png':
        transformer = transformer.png(formatOptions);
        break;
      case 'jpeg':
      case 'jpg':
        transformer = transformer.jpeg(formatOptions);
        break;
      default:
        transformer = transformer.webp(formatOptions);
    }
    
    const outputBuffer = await transformer.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();
    
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Image-Width', metadata.width);
    res.setHeader('X-Image-Height', metadata.height);
    res.setHeader('X-Image-Format', metadata.format);
    
    res.status(200).send(outputBuffer);
    
  } catch (error) {
    console.error('Image processing error:', error);
    
    res.status(500).json({ 
      error: 'Failed to process image',
      message: error.message
    });
  }
}
