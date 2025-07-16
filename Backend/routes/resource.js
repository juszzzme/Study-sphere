const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promises for async/await
const Resource = require('../models/resource');
const auth = require('../middleware/auth');

// Setup multer storage
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../private_uploads'); // Private directory
        
        try {
            await fs.access(uploadDir); // Check if directory exists
        } catch (err) {
            await fs.mkdir(uploadDir, { recursive: true }); // Create if not exists
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Use original filename + unique suffix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.originalname}-${uniqueSuffix}${ext}`);
    }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/markdown'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Markdown files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/resources (Upload)
router.post('/api/resources/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, year, tags } = req.body;
        // Input validation
        if (!title || !subject || !year || !req.file) {
            return res.status(400).json({ error: 'Missing required fields or file' });
        }
        // Determine file type
        let fileType = 'other';
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === '.pdf') fileType = 'pdf';
        else if (['.md', '.markdown'].includes(ext)) fileType = 'markdown';

        // Create new resource
        const newResource = new Resource({
            title,
            subject,
            year,
            fileType,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            filePath: req.file.path,
            uploadedBy: req.user.id
        });

        const resource = await newResource.save();
        res.status(201).json(resource);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resources (All resources)
router.get('/', async (req, res) => {
    try {
        const resources = await Resource.find()
            .sort({ uploadDate: -1 })
            .populate('uploadedBy', 'username');
        
        // Format response to match what ResourceHub component expects
        const formattedResources = {
            notes: resources.filter(r => r.type === 'notes' || r.fileType === 'markdown'),
            papers: resources.filter(r => r.type === 'papers' || r.fileType === 'pdf')
        };
        
        res.json(formattedResources);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resources/search (Search)
router.get('/search', async (req, res) => {
    try {
        const { query, subject, year } = req.query;
        let searchQuery = {};

        if (query) searchQuery.$text = { $search: query };
        if (subject) searchQuery.subject = subject;
        if (year) searchQuery.year = year;

        const resources = await Resource.find(searchQuery)
            .sort(query ? { score: { $meta: 'textScore' } } : { uploadDate: -1 })
            .populate('uploadedBy', 'username');

        // Format response to match what ResourceHub component expects
        const formattedResults = {
            notes: resources.filter(r => r.type === 'notes' || r.fileType === 'markdown'),
            papers: resources.filter(r => r.type === 'papers' || r.fileType === 'pdf')
        };
        
        res.json(formattedResults);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resources/:id (Single resource)
router.get('/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('uploadedBy', 'username');
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        res.json(resource);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resources/:id/content (Get file content)
router.get('/:id/content', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        // Check if file exists
        try {
            await fs.access(resource.filePath);
            const fileType = path.extname(resource.filePath).toLowerCase();
            
            // For text files (markdown, txt), read and return content
            if (['.md', '.markdown', '.txt'].includes(fileType)) {
                const content = await fs.readFile(resource.filePath, 'utf8');
                return res.json({
                    content,
                    fileType: fileType.substring(1),
                    fileName: path.basename(resource.filePath)
                });
            } else {
                // For binary files (pdf, etc), return file info
                const stats = await fs.stat(resource.filePath);
                return res.json({
                    content: null,
                    fileType: fileType.substring(1),
                    fileName: path.basename(resource.filePath),
                    fileSize: stats.size,
                    downloadUrl: `/api/resources/download/${resource._id}`
                });
            }
        } catch (error) {
            console.error('File access error:', error);
            return res.status(404).json({ error: 'File not found on server' });
        }
    } catch (err) {
        console.error('Error fetching resource content:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resources/download/:id (Download)
router.get('/download/:id', async (req, res) => { // Removed auth middleware for testing
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        // Check if file exists
        try {
            await fs.access(resource.filePath);
            // Increment download count
            resource.downloadCount += 1;
            await resource.save();

            // Serve file securely
            res.download(resource.filePath, `${resource.title}${path.extname(resource.filePath)}`);
        } catch (error) {
            console.error('File access error:', error);
            return res.status(404).json({ error: 'File not found on server' });
        }
    } catch (err) {
        console.error('Download error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/resources/:id (Delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        // Check ownership
        if (resource.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Delete file from filesystem
        await fs.unlink(resource.filePath); // Uses fs.promises

        // Delete resource from database
        await Resource.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Multer error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

module.exports = router;
