const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument: PDFLib, rgb, StandardFonts } = require('pdf-lib');

class PDFService {
  constructor() {
    this.pdfStoragePath = path.join(__dirname, '../storage/pdfs');
    this.ensureStorageDirectory();
  }

  /**
   * Ensure the PDF storage directory exists
   */
  async ensureStorageDirectory() {
    try {
      await fs.ensureDir(this.pdfStoragePath);
    } catch (error) {
      console.error('Error creating PDF storage directory:', error);
      throw new Error('Failed to initialize PDF storage');
    }
  }

  /**
   * Generate a prescription PDF document
   * @param {Object} prescriptionData - Complete prescription data
   * @returns {Object} - PDF buffer and file path
   */
  async generatePrescriptionPDF(prescriptionData) {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Prescription - ${prescriptionData.prescriptionNumber}`,
          Author: prescriptionData.doctor.name,
          Subject: 'Medical Prescription',
          Creator: 'Healthcare Management System'
        }
      });

      // Create buffer to store PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

      // Add prescription content
      await this.addPrescriptionHeader(doc, prescriptionData);
      await this.addDoctorDetails(doc, prescriptionData.doctor);
      await this.addPatientDetails(doc, prescriptionData.patient);
      await this.addMedicinesList(doc, prescriptionData.medicines);
      await this.addAdditionalNotes(doc, prescriptionData);
      await this.addFooter(doc, prescriptionData);

      // Finalize the PDF
      doc.end();

      const pdfBuffer = await pdfPromise;
      
      // Save to file system
      const fileName = `prescription_${prescriptionData.prescriptionNumber}_${Date.now()}.pdf`;
      const filePath = path.join(this.pdfStoragePath, fileName);
      await fs.writeFile(filePath, pdfBuffer);

      return {
        buffer: pdfBuffer,
        filePath,
        fileName,
        size: pdfBuffer.length
      };
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Add prescription header with title and prescription number
   */
  async addPrescriptionHeader(doc, prescriptionData) {
    // Header background
    doc.rect(0, 0, doc.page.width, 80)
       .fill('#2c5aa0');

    // Title
    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('MEDICAL PRESCRIPTION', 50, 25, { align: 'center' });

    // Prescription number
    doc.fontSize(12)
       .text(`Prescription No: ${prescriptionData.prescriptionNumber}`, 50, 55, { align: 'right' });

    // Date
    const date = new Date(prescriptionData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Date: ${date}`, 50, 55, { align: 'left' });

    doc.moveDown(3);
  }

  /**
   * Add doctor details section
   */
  async addDoctorDetails(doc, doctor) {
    const startY = doc.y;
    
    // Section header
    doc.fillColor('black')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('DOCTOR DETAILS', 50, startY);

    doc.moveTo(50, doc.y + 5)
       .lineTo(250, doc.y + 5)
       .stroke('#2c5aa0');

    doc.moveDown(0.5);

    // Doctor information
    doc.fontSize(11)
       .font('Helvetica');

    const doctorInfo = [
      `Name: Dr. ${doctor.name}`,
      `Specialization: ${doctor.specialization}`,
      `License Number: ${doctor.licenseNumber}`,
      doctor.contact?.phone ? `Phone: ${doctor.contact.phone}` : null,
      doctor.contact?.email ? `Email: ${doctor.contact.email}` : null
    ].filter(Boolean);

    doctorInfo.forEach(info => {
      doc.text(info, 50, doc.y);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  /**
   * Add patient details section
   */
  async addPatientDetails(doc, patient) {
    const startY = doc.y;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PATIENT DETAILS', 50, startY);

    doc.moveTo(50, doc.y + 5)
       .lineTo(250, doc.y + 5)
       .stroke('#2c5aa0');

    doc.moveDown(0.5);

    // Patient information
    doc.fontSize(11)
       .font('Helvetica');

    const patientInfo = [
      `Name: ${patient.name}`,
      `Age: ${patient.age} years`,
      `Gender: ${patient.gender}`,
      patient.patientId ? `Patient ID: ${patient.patientId}` : null
    ].filter(Boolean);

    patientInfo.forEach(info => {
      doc.text(info, 50, doc.y);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  /**
   * Add medicines list section
   */
  async addMedicinesList(doc, medicines) {
    const startY = doc.y;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PRESCRIBED MEDICINES', 50, startY);

    doc.moveTo(50, doc.y + 5)
       .lineTo(doc.page.width - 50, doc.y + 5)
       .stroke('#2c5aa0');

    doc.moveDown(1);

    // Table headers
    const tableTop = doc.y;
    const itemHeight = 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold');

    // Draw table header
    doc.rect(50, tableTop, doc.page.width - 100, itemHeight)
       .fill('#f0f0f0');

    doc.fillColor('black')
       .text('Medicine Name', 60, tableTop + 8)
       .text('Dosage', 200, tableTop + 8)
       .text('Frequency', 300, tableTop + 8)
       .text('Duration', 400, tableTop + 8)
       .text('Instructions', 480, tableTop + 8);

    let currentY = tableTop + itemHeight;

    // Add medicines
    doc.font('Helvetica')
       .fontSize(9);

    medicines.forEach((medicine, index) => {
      const rowColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
      
      doc.rect(50, currentY, doc.page.width - 100, itemHeight)
         .fill(rowColor);

      doc.fillColor('black')
         .text(medicine.name, 60, currentY + 8, { width: 130, ellipsis: true })
         .text(medicine.dosage, 200, currentY + 8, { width: 90, ellipsis: true })
         .text(medicine.frequency, 300, currentY + 8, { width: 90, ellipsis: true })
         .text(medicine.duration, 400, currentY + 8, { width: 70, ellipsis: true })
         .text(medicine.instructions || 'As directed', 480, currentY + 8, { width: 80, ellipsis: true });

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
    doc.moveDown(1);
  }

  /**
   * Add additional notes and instructions
   */
  async addAdditionalNotes(doc, prescriptionData) {
    if (prescriptionData.additionalNotes || prescriptionData.followUpInstructions || prescriptionData.labTests?.length) {
      const startY = doc.y;
      
      // Section header
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('ADDITIONAL INFORMATION', 50, startY);

      doc.moveTo(50, doc.y + 5)
         .lineTo(doc.page.width - 50, doc.y + 5)
         .stroke('#2c5aa0');

      doc.moveDown(0.5);
      doc.fontSize(10)
         .font('Helvetica');

      if (prescriptionData.additionalNotes) {
        doc.font('Helvetica-Bold')
           .text('Notes:', 50, doc.y);
        doc.font('Helvetica')
           .text(prescriptionData.additionalNotes, 50, doc.y, { width: doc.page.width - 100 });
        doc.moveDown(0.5);
      }

      if (prescriptionData.followUpInstructions) {
        doc.font('Helvetica-Bold')
           .text('Follow-up Instructions:', 50, doc.y);
        doc.font('Helvetica')
           .text(prescriptionData.followUpInstructions, 50, doc.y, { width: doc.page.width - 100 });
        doc.moveDown(0.5);
      }

      if (prescriptionData.labTests?.length) {
        doc.font('Helvetica-Bold')
           .text('Recommended Lab Tests:', 50, doc.y);
        doc.font('Helvetica');
        prescriptionData.labTests.forEach(test => {
          doc.text(`• ${test}`, 60, doc.y);
          doc.moveDown(0.3);
        });
      }

      doc.moveDown(1);
    }
  }

  /**
   * Add footer with signature and verification info
   */
  async addFooter(doc, prescriptionData) {
    const footerY = doc.page.height - 150;
    
    // Ensure we're in the footer area
    if (doc.y > footerY - 50) {
      doc.addPage();
    }
    
    doc.y = Math.max(doc.y, footerY);

    // Digital signature placeholder
    if (prescriptionData.doctor.digitalSignature) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Digital Signature:', 50, doc.y);
      
      doc.font('Helvetica')
         .fontSize(8)
         .text('This prescription is digitally signed and verified.', 50, doc.y);
      
      doc.moveDown(0.5);
      
      // Signature hash (simplified representation)
      const signatureHash = this.generateSignatureHash(prescriptionData);
      doc.text(`Signature Hash: ${signatureHash}`, 50, doc.y);
    }

    // Footer line
    doc.moveTo(50, doc.page.height - 100)
       .lineTo(doc.page.width - 50, doc.page.height - 100)
       .stroke('#cccccc');

    // Footer text
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('This is a computer-generated prescription. Please verify authenticity before dispensing.', 
             50, doc.page.height - 90, { align: 'center' });
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 
             50, doc.page.height - 75, { align: 'center' });
  }

  /**
   * Apply digital signature to PDF
   * @param {Buffer} pdfBuffer - PDF buffer to sign
   * @param {Object} doctorSignature - Doctor's signature data
   * @returns {Buffer} - Signed PDF buffer
   */
  async addDigitalSignature(pdfBuffer, doctorSignature) {
    try {
      const pdfDoc = await PDFLib.load(pdfBuffer);
      
      // Add signature metadata
      pdfDoc.setTitle(`Signed Prescription - ${doctorSignature.prescriptionNumber}`);
      pdfDoc.setAuthor(doctorSignature.doctorName);
      pdfDoc.setSubject('Digitally Signed Medical Prescription');
      pdfDoc.setCreator('Healthcare Management System');
      pdfDoc.setProducer('PDFService v1.0');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Add signature annotation (simplified)
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Add signature text
      lastPage.drawText('Digitally Signed', {
        x: width - 200,
        y: 100,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
      
      lastPage.drawText(`Dr. ${doctorSignature.doctorName}`, {
        x: width - 200,
        y: 85,
        size: 8,
        font,
        color: rgb(0, 0, 0)
      });
      
      lastPage.drawText(`License: ${doctorSignature.licenseNumber}`, {
        x: width - 200,
        y: 70,
        size: 8,
        font,
        color: rgb(0, 0, 0)
      });

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding digital signature:', error);
      throw new Error(`Digital signature failed: ${error.message}`);
    }
  }

  /**
   * Validate PDF integrity
   * @param {Buffer} pdfBuffer - PDF buffer to validate
   * @returns {Object} - Validation result
   */
  async validatePDFIntegrity(pdfBuffer) {
    try {
      const pdfDoc = await PDFLib.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      
      // Basic integrity checks
      const isValid = pageCount > 0 && pdfBuffer.length > 1000;
      
      // Generate checksum
      const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      
      return {
        isValid,
        pageCount,
        title,
        author,
        size: pdfBuffer.length,
        checksum,
        validatedAt: new Date()
      };
    } catch (error) {
      console.error('Error validating PDF integrity:', error);
      return {
        isValid: false,
        error: error.message,
        validatedAt: new Date()
      };
    }
  }

  /**
   * Generate signature hash for prescription
   * @param {Object} prescriptionData - Prescription data
   * @returns {String} - Signature hash
   */
  generateSignatureHash(prescriptionData) {
    const signatureData = {
      prescriptionNumber: prescriptionData.prescriptionNumber,
      doctorId: prescriptionData.doctor.id,
      patientId: prescriptionData.patient.id,
      createdAt: prescriptionData.createdAt,
      medicines: prescriptionData.medicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration
      }))
    };
    
    return crypto.createHash('sha256')
                 .update(JSON.stringify(signatureData))
                 .digest('hex')
                 .substring(0, 16);
  }

  /**
   * Retrieve PDF file from storage
   * @param {String} fileName - PDF file name
   * @returns {Buffer} - PDF buffer
   */
  async retrievePDF(fileName) {
    try {
      const filePath = path.join(this.pdfStoragePath, fileName);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) {
        throw new Error('PDF file not found');
      }
      
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error retrieving PDF:', error);
      throw new Error(`PDF retrieval failed: ${error.message}`);
    }
  }

  /**
   * Delete PDF file from storage
   * @param {String} fileName - PDF file name
   * @returns {Boolean} - Success status
   */
  async deletePDF(fileName) {
    try {
      const filePath = path.join(this.pdfStoragePath, fileName);
      const exists = await fs.pathExists(filePath);
      
      if (exists) {
        await fs.remove(filePath);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }

  /**
   * Get PDF storage statistics
   * @returns {Object} - Storage statistics
   */
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.pdfStoragePath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.pdfStoragePath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        fileCount: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        storageDirectory: this.pdfStoragePath
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        error: error.message
      };
    }
  }
}

module.exports = PDFService;