import db from "./../config/db.js";
import upload_helper from "./../services/upload_helper.js"
import path from "path";
import fs from "fs";

const get_dashboard = async (req,res) => {
    try{

      const pool = db.getDB();
      const userId = req.user;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }


      // Get user info
      const userResult = await pool.query(
        `SELECT id, username, email, role, created_at
        FROM vulnerable_dms.users
        WHERE id = $1`,
        [userId]
      );


      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get document stats
      const docStats = await pool.query(
        `SELECT COUNT(*) AS total_documents
        FROM vulnerable_dms.documents
        WHERE owner_id = $1`,
        [userId]
      );


      res.json({
        user: userResult.rows[0],
        stats: {
          total_documents: parseInt(docStats.rows[0].total_documents, 10)
        }
      });


    } catch(error){

      console.error({
        system: "drawing dashboard",
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        status: false,
        message: "Internal Server Error Getting dashboard Data",
      });

    }
};



const delete_document = async (req,res) => {
    try{

      const docId = req.query.doc_id;

      const pool = db.getDB();

      await pool.query(
        `DELETE FROM vulnerable_dms.documents WHERE id = $1;`,
        [docId]
      );

      return res.status(200).json({
      status: true
    });


    } catch(error){
      console.error({
        system: "Document Delete fail",
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

    return res.status(500).json({
      status: false,
      message: "Internal Server Error Deleting Document",
    });
    }
};



const upload_document = async(req,res) => {
    try{

      const pool = db.getDB();
      const userId = req.user;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // multer attaches file info to req.file
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { originalname, filename, path: filePath } = req.file;
      const { title } = req.body;

      await pool.query(
        `INSERT INTO vulnerable_dms.documents
        (owner_id, title, filename, file_path)
        VALUES ($1, $2, $3, $4)`,
        [userId, title || originalname, filename, filePath]
      );

      res.status(201).json({
        message: "Document uploaded successfully"
      });

    } catch(error){
      console.error({
        system: "Document Upload Fail",
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        status: false,
        message: "Internal Server Error Uploading Document",
      });

    }
};


const view_document = (req,res) => {
    try{

      const docId = req.query.doc_id;

      const pool = db.getDB();

      pool.query(
  "SELECT * FROM vulnerable_dms.documents WHERE id = $1",
  [docId],
  (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }

    if (result.rows.length === 0) {
      return res.status(404).send("Document not found");
    }

    const doc = result.rows[0];

    // No ownership check (IDOR)
    res.sendFile(path.resolve(doc.file_path));
  }
);

    } catch(error){
   console.error({
      system: "Document view Failed",
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Internal Server Error Viewing Document",
    });
    }
};



const list_document = async (req,res) => {
    try{

      const pool = db.getDB();

    // assume user_id is set during login
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await pool.query(
      `SELECT id, title, filename, uploaded_at
       FROM vulnerable_dms.documents
       WHERE owner_id = $1
       ORDER BY id ASC`,
      [userId]
    );

    res.json({
      documents: result.rows
    });

    } catch(error){
   console.error({
      system: "Document Listing Failed",
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Internal Server Error Listing Documents",
    });
    }
};


const download_document = async (req, res) => {
  try {
    const pool = db.getDB();
    const userId = req.user;
    const docId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await pool.query(
      `SELECT filename, file_path
       FROM vulnerable_dms.documents
       WHERE id = $1 AND owner_id = $2`,
      [docId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { filename, file_path } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(file_path, filename);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
};



export default {
    get_dashboard,
    list_document,
    view_document,
    upload_document,
    delete_document,
    download_document
}