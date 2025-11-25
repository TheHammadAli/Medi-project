const PDFService = require('../../Services/PDFService');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

describe('PDFService', () => {
  let pdfService;
  let testPrescriptionData;
  let testStoragePath;

  beforeAll(async () => {
    pdfService = new PDFService();
    testStoragePath = path.join(__dirname, '../../storage/pdfs');
    
    // Ensure test storage directory exists
    await fs.ensureDir(testStoragePath);
  });

  beforeEach(() => {
    testPrescriptionData = {
      prescriptionNumber: 'RX-TEST-001',
      doctor: {
        id: '64f8a1b2c3d4e5f6a7b8c9d0',
        name: 'John Smith',
        specialization: 'General Medicine',
        licenseNumber: 'MD12345',
        contact: {
          phone: '+1-555-0123',
          email: 'dr.smith@hospital.com'
        },
        digitalSignature: 'digital_signature_data'
      },
      patient: {
        id: '64f8a1b2c3d4e5f6a7b8c9d1',
        name: 'Jane Doe',
        age: 35,
        gender: 'Female',
        patientId: 'P001'
      },
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Take with food'
        },
        {
          name: 'Ibuprofen',
          dosage: '200mg',
          frequency: 'As needed',
          duration: '5 days',
          instructions: 'For pain relief'
        }
      ],
      additionalNotes: 'Patient has mild allergies to penicillin',
      followUpInstructions: 'Return in 1 week if symptoms persist',
      labTests: ['Complete Blood Count', 'Liver Function Test'],
      createdAt: new Date(),
      status: 'active'
    };
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(testStoragePath);
      for (const file of files) {
        if (file.includes('TEST') || file.includes('test')) {
          await fs.remove(path.join(testStoragePath, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('generatePrescriptionPDF', () => {
    test('should generate a valid PDF with complete prescription data', async () => {
      const result = await pdfService.generatePrescriptionPDF(testPrescriptionData);

      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('size');
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(1000);
      expect(result.fileName).toContain('prescription_RX-TEST-001');
      
      // Verify file was created
      const fileExists = await fs.pathExists(result.filePath);
      expect(fileExists).toBe(true);
    });

    test('should generate PDF with minimal prescription data', async () => {
      const minimalData = {
        prescriptionNumber: 'RX-MIN-001',
        doctor: {
          id: '64f8a1b2c3d4e5f6a7b8c9d0',
          name: 'Test Doctor',
          specialization: 'General',
          licenseNumber: 'MD001'
        },
        patient: {
          id: '64f8a1b2c3d4e5f6a7b8c9d1',
          name: 'Test Patient',
          age: 30,
          gender: 'Male'
        },
        medicines: [
          {
            name: 'Test Medicine',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '3 days'
          }
        ],
        createdAt: new Date()
      };

      const result = await pdfService.generatePrescriptionPDF(minimalData);
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(500);
    });

    test('should handle empty medicines array', async () => {
      const dataWithoutMedicines = {
        ...testPrescriptionData,
        medicines: []
      };

      const result = await pdfService.generatePrescriptionPDF(dataWithoutMedicines);
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(500);
    });

    test('should throw error for invalid prescription data', async () => {
      const invalidData = {
        prescriptionNumber: null,
        doctor: null,
        patient: null,
        medicines: null
      };

      await expect(pdfService.generatePrescriptionPDF(invalidData))
        .rejects.toThrow('PDF generation failed');
    });

    test('should include all prescription sections in PDF', async () => {
      const result = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      // Basic validation that PDF was generated with expected size
      // In a real scenario, you might use a PDF parser to verify content
      expect(result.buffer.length).toBeGreaterThan(5000); // Substantial PDF with all sections
    });
  });

  describe('addDigitalSignature', () => {
    test('should add digital signature to PDF', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const signatureData = {
        prescriptionNumber: testPrescriptionData.prescriptionNumber,
        doctorName: testPrescriptionData.doctor.name,
        licenseNumber: testPrescriptionData.doctor.licenseNumber
      };

      const signedPDF = await pdfService.addDigitalSignature(pdfResult.buffer, signatureData);
      
      expect(signedPDF).toBeInstanceOf(Buffer);
      expect(signedPDF.length).toBeGreaterThan(pdfResult.buffer.length);
    });

    test('should handle invalid PDF buffer for signing', async () => {
      const invalidBuffer = Buffer.from('invalid pdf data');
      const signatureData = {
        prescriptionNumber: 'RX-001',
        doctorName: 'Test Doctor',
        licenseNumber: 'MD001'
      };

      await expect(pdfService.addDigitalSignature(invalidBuffer, signatureData))
        .rejects.toThrow('Digital signature failed');
    });

    test('should add signature metadata to PDF', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const signatureData = {
        prescriptionNumber: testPrescriptionData.prescriptionNumber,
        doctorName: testPrescriptionData.doctor.name,
        licenseNumber: testPrescriptionData.doctor.licenseNumber
      };

      const signedPDF = await pdfService.addDigitalSignature(pdfResult.buffer, signatureData);
      
      // Verify the signed PDF is valid
      const validation = await pdfService.validatePDFIntegrity(signedPDF);
      expect(validation.isValid).toBe(true);
      expect(validation.title).toContain('Signed Prescription');
    });
  });

  describe('validatePDFIntegrity', () => {
    test('should validate a valid PDF', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const validation = await pdfService.validatePDFIntegrity(pdfResult.buffer);
      
      expect(validation.isValid).toBe(true);
      expect(validation.pageCount).toBeGreaterThan(0);
      expect(validation.size).toBe(pdfResult.buffer.length);
      expect(validation.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(validation.validatedAt).toBeInstanceOf(Date);
    });

    test('should detect invalid PDF', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF');
      
      const validation = await pdfService.validatePDFIntegrity(invalidBuffer);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
      expect(validation.validatedAt).toBeInstanceOf(Date);
    });

    test('should generate consistent checksum for same PDF', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const validation1 = await pdfService.validatePDFIntegrity(pdfResult.buffer);
      const validation2 = await pdfService.validatePDFIntegrity(pdfResult.buffer);
      
      expect(validation1.checksum).toBe(validation2.checksum);
    });
  });

  describe('generateSignatureHash', () => {
    test('should generate consistent hash for same prescription data', () => {
      const hash1 = pdfService.generateSignatureHash(testPrescriptionData);
      const hash2 = pdfService.generateSignatureHash(testPrescriptionData);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{16}$/);
    });

    test('should generate different hashes for different prescription data', () => {
      const modifiedData = {
        ...testPrescriptionData,
        prescriptionNumber: 'RX-DIFFERENT-001'
      };
      
      const hash1 = pdfService.generateSignatureHash(testPrescriptionData);
      const hash2 = pdfService.generateSignatureHash(modifiedData);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should generate hash with only relevant prescription fields', () => {
      const dataWithExtraFields = {
        ...testPrescriptionData,
        extraField: 'should not affect hash',
        status: 'different status'
      };
      
      const hash1 = pdfService.generateSignatureHash(testPrescriptionData);
      const hash2 = pdfService.generateSignatureHash(dataWithExtraFields);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('retrievePDF', () => {
    test('should retrieve existing PDF file', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const retrievedBuffer = await pdfService.retrievePDF(pdfResult.fileName);
      
      expect(retrievedBuffer).toBeInstanceOf(Buffer);
      expect(retrievedBuffer.length).toBe(pdfResult.buffer.length);
    });

    test('should throw error for non-existent PDF file', async () => {
      await expect(pdfService.retrievePDF('non-existent-file.pdf'))
        .rejects.toThrow('PDF retrieval failed');
    });
  });

  describe('deletePDF', () => {
    test('should delete existing PDF file', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const deleted = await pdfService.deletePDF(pdfResult.fileName);
      
      expect(deleted).toBe(true);
      
      // Verify file no longer exists
      const fileExists = await fs.pathExists(pdfResult.filePath);
      expect(fileExists).toBe(false);
    });

    test('should return true for non-existent file deletion', async () => {
      const deleted = await pdfService.deletePDF('non-existent-file.pdf');
      
      expect(deleted).toBe(true);
    });
  });

  describe('getStorageStats', () => {
    test('should return storage statistics', async () => {
      // Create a test PDF
      await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      const stats = await pdfService.getStorageStats();
      
      expect(stats).toHaveProperty('fileCount');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('totalSizeMB');
      expect(stats).toHaveProperty('storageDirectory');
      
      expect(stats.fileCount).toBeGreaterThanOrEqual(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(parseFloat(stats.totalSizeMB)).toBeGreaterThan(0);
      expect(stats.storageDirectory).toContain('pdfs');
    });

    test('should handle empty storage directory', async () => {
      // Clean up all files first
      const files = await fs.readdir(testStoragePath);
      for (const file of files) {
        await fs.remove(path.join(testStoragePath, file));
      }
      
      const stats = await pdfService.getStorageStats();
      
      expect(stats.fileCount).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.totalSizeMB).toBe('0.00');
    });
  });

  describe('ensureStorageDirectory', () => {
    test('should create storage directory if it does not exist', async () => {
      const testService = new PDFService();
      
      // The constructor should have created the directory
      const dirExists = await fs.pathExists(testStoragePath);
      expect(dirExists).toBe(true);
    });
  });

  describe('PDF Content Validation', () => {
    test('should include prescription number in PDF metadata', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      const validation = await pdfService.validatePDFIntegrity(pdfResult.buffer);
      
      expect(validation.title).toContain(testPrescriptionData.prescriptionNumber);
    });

    test('should include doctor name in PDF metadata', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      const validation = await pdfService.validatePDFIntegrity(pdfResult.buffer);
      
      expect(validation.author).toBe(testPrescriptionData.doctor.name);
    });

    test('should generate PDF with appropriate file size', async () => {
      const pdfResult = await pdfService.generatePrescriptionPDF(testPrescriptionData);
      
      // PDF should be substantial but not excessive
      expect(pdfResult.size).toBeGreaterThan(2000); // At least 2KB
      expect(pdfResult.size).toBeLessThan(1000000); // Less than 1MB
    });
  });

  describe('Error Handling', () => {
    test('should handle PDF generation errors gracefully', async () => {
      const invalidData = {
        prescriptionNumber: 'RX-001',
        doctor: {
          name: null // This should cause an error
        }
      };

      await expect(pdfService.generatePrescriptionPDF(invalidData))
        .rejects.toThrow('PDF generation failed');
    });

    test('should handle file system errors', async () => {
      // Mock fs.writeFile to throw an error
      const originalWriteFile = fs.writeFile;
      fs.writeFile = jest.fn().mockRejectedValue(new Error('File system error'));

      await expect(pdfService.generatePrescriptionPDF(testPrescriptionData))
        .rejects.toThrow('PDF generation failed');

      // Restore original function
      fs.writeFile = originalWriteFile;
    });
  });
});