const got = require('got');
const http2wrapper = require('http2-wrapper');

// Helper to determine if content type is binary
function isBinaryContent(contentType) {
  if (!contentType) return false;
  const binaryTypes = ['image/', 'audio/', 'video/', 'application/octet-stream', 'application/pdf'];
  return binaryTypes.some(type => contentType.toLowerCase().includes(type));
}

exports.handler = async (event, context) => {
  // Get the URL from query parameters
  const targetUrl = event.queryStringParameters.url;

  // Validate URL parameter
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  try {
    // Fetch the resource using got with HTTP/2 support
    const response = await got(targetUrl, {
      http2: true,
      responseType: 'buffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      throwHttpErrors: false
    });

    if (response.statusCode !== 200) {
      return {
        statusCode: response.statusCode,
        body: JSON.stringify({ error: `Failed to fetch resource: ${response.statusMessage}` }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Get content type from the response
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const isBinary = isBinaryContent(contentType);

    // Get the response buffer
    const buffer = response.body;

    // Return based on content type
    if (isBinary) {
      // Return binary content (images, etc.) as base64
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      // Return text content (HTML, JSON, etc.) as plain text
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: buffer.toString('utf8'),
        isBase64Encoded: false
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error fetching resource: ${error.message}` }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
