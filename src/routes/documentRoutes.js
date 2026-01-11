import express from "express"
import db from "./../config/db.js"
import multer from "multer";
import path from "path";
import upload_helper from "./../services/upload_helper.js";
import documentController from "./../controller/documentController.js";

const documentRouter = express.Router();


/* LIST MY DOCUMENTS */
documentRouter.get("/documents", (req, res) => {
    documentController.list_document(req,res);
});



/* VIEW DOCUMENT (IDOR VULNERABLE) */
documentRouter.get("/view_document", (req, res) => {
  documentController.view_document(req,res);
});


/* UPLOAD DOCUMENT */
documentRouter.post("/upload", upload_helper.single("document"), (req, res) => {
  documentController.upload_document(req,res);  
});


/* DELETE DOCUMENT (IDOR VULNERABLE) */
documentRouter.delete("/delete_document", (req, res) => {
  documentController.delete_document(req,res);
});

documentRouter.get("/dashboard", (req, res) => {
    documentController.get_dashboard(req,res);
});

documentRouter.get("/download/:id", (req, res) => {
  documentController.download_document(req,res);
});


export default documentRouter;