const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// MODULE_CONFIG maps modules to their table names and owner columns
const MODULE_CONFIG = {
  'content':       { table: 'content',      owner_col: 'uploader_id' },
  'notices':       { table: 'notices',      owner_col: 'author_id'   },
  'requests':      { table: 'requests',     owner_col: 'author_id'   },
  'lost-found':    { table: 'lost_found',   owner_col: 'created_by'  },
  'accommodation': { table: 'accommodation', owner_col: 'created_by' },
  'placement':     { table: 'companies',     owner_col: 'created_by' },
};

/**
 * DELETE /api/delete/:module/:id
 * Unified delete endpoint with RBAC and ownership checks.
 */
router.delete('/:module/:id', verifyToken, async (req, res) => {
  try {
    const { module, id } = req.params;
    const userId  = req.user.id;
    // ✅ CRITICAL FIX: role is on req.dbUser (fetched from DB), NOT req.user (Supabase Auth object)
    const userRole = req.dbUser?.role;

    const config = MODULE_CONFIG[module];
    if (!config) {
      return res.status(400).json({ success: false, error: `Invalid module: ${module}` });
    }

    // 1. Fetch the record (service-role client bypasses RLS so it sees all records)
    const { data: record, error: fetchError } = await req.supabase
      .from(config.table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    // 2. Idempotent: already deleted — return safe success, don't crash
    if (record.deleted_at) {
      return res.json({ success: true, message: 'Content was already deleted.' });
    }

    // 3. RBAC: only admin OR the owner may delete
    const isOwner = record[config.owner_col] === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this content.' });
    }

    // 4. Storage cleanup — delete any associated files first
    const filesToDelete = [];
    if (record.file_url) filesToDelete.push(record.file_url);
    if (Array.isArray(record.images)) filesToDelete.push(...record.images);

    for (const url of filesToDelete) {
      try {
        const urlParts = url.split('/storage/v1/object/public/afin-storage/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          const { error: storageError } = await req.supabase
            .storage
            .from('afin-storage')
            .remove([filePath]);
          if (storageError) {
            console.warn(`[DELETE] Storage removal failed for "${filePath}":`, storageError.message);
          }
        }
      } catch (e) {
        console.error(`[DELETE] Could not parse file URL "${url}":`, e.message);
      }
    }

    // 5. Soft-delete: stamp deleted_at
    const { error: deleteError } = await req.supabase
      .from(config.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 6. Audit log
    await req.supabase
      .from('audit_logs')
      .insert([{
        action: 'DELETE',
        actor_id: userId,
        target_type: module,
        target_id: id,
        metadata: {
          module,
          content_type: module,
          original_owner: record[config.owner_col],
          deleted_by_role: userRole,
        },
      }]);

    return res.json({ success: true, message: 'Deleted successfully.' });

  } catch (error) {
    console.error('[DELETE] Unhandled error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete content.' });
  }
});

module.exports = router;
