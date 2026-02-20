const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function uploadBuffer(buffer, folder = 'contributor_questions') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// upload multiple buffers (in parallel)
async function uploadBuffers(buffers, folder = 'contributor_questions') {
  if (!Array.isArray(buffers)) return [];
  const uploads = buffers.map(b => uploadBuffer(b, folder).catch(err => ({ error: err })));
  return Promise.all(uploads);
}

module.exports = { cloudinary, uploadBuffer };

// delete a resource by its public id
async function deletePublicId(publicId) {
  if (!publicId) return { result: 'not_provided' };
  try {
    const res = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    console.log('[cloudinary] destroy result for', publicId, res);
    return res;
  } catch (err) {
    throw err;
  }
}

module.exports.deletePublicId = deletePublicId;

// delete multiple public ids
async function deletePublicIds(publicIds) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return [];
  const results = [];
  for (const pid of publicIds) {
    try {
      const r = await deletePublicId(pid);
      results.push(r);
    } catch (err) {
      results.push({ error: err && err.message, id: pid });
    }
  }
  return results;
}

module.exports.uploadBuffers = uploadBuffers;
module.exports.deletePublicIds = deletePublicIds;

// attempt to extract public id from a Cloudinary URL
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    // example URL formats:
    // https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/subfolder/public_id.jpg
    // https://res.cloudinary.com/<cloud>/image/upload/folder/subfolder/public_id.png
    const parts = url.split('/');
    // find the 'upload' segment
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    const publicPathParts = parts.slice(uploadIndex + 1);
    if (publicPathParts.length === 0) return null;
    // join and strip version prefix if present (v12345)
    let publicPath = publicPathParts.join('/');
    publicPath = publicPath.replace(/^v\d+\//, '');
    // remove file extension and query params
    publicPath = publicPath.split('?')[0];
    const lastDot = publicPath.lastIndexOf('.');
    if (lastDot !== -1) publicPath = publicPath.substring(0, lastDot);
    return publicPath;
  } catch (e) {
    return null;
  }
}

module.exports.extractPublicIdFromUrl = extractPublicIdFromUrl;
