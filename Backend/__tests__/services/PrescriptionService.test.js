const PrescriptionService = require('../../Services/PrescriptionService');
const Prescription = require('../../Model/Prescription');
const AuditLog = require('../../Model/AuditLog');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../../Model/Prescription');
jest.mock('../../Model/AuditLog');

describe('PrescriptionService', () => {
  let prescriptionService;
  let mockUser;
  let mockPrescriptionData;

  beforeEach(() => {
    prescriptionService = new PrescriptionService();
    
    mockUser = {
      id: new mongoose.Types.ObjectId(),
      userType: 'doctor',
      name: 'Dr. John Smith'
    };

    mockPrescriptionData = {
      doctor: {
        id: mockUser.id,
        name: 'Dr. John Smith',
        specialization: 'Cardiology',
        licenseNumber: 'DOC123456'
      },
      patient: {
        id: new mongoose.Types.ObjectId(),
        name: 'Jane Doe',
        age: 35,
        gender: 'Female',
        patientId: 'PAT001'
      },
      medicines: [
        {
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take with food'
        }
      ],
      additionalNotes: 'Follow up in 2 weeks'
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createPrescription', () => {
    it('should create a prescription successfully', async () => {
      const mockSavedPrescription = {
        _id: new mongoose.Types.ObjectId(),
        ...mockPrescriptionData,
        prescriptionNumber: 'RX-TEST-12345'
      };

      // Mock Prescription constructor and save method
      const mockPrescriptionInstance = {
        save: jest.fn().mockResolvedValue(mockSavedPrescription)
      };
      Prescription.mockImplementation(() => mockPrescriptionInstance);
      
      // Mock findOne to return null (prescription number is unique)
      Prescription.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock AuditLog.createLog
      AuditLog.createLog = jest.fn().mockResolvedValue({});

      const result = await prescriptionService.createPrescription(
        mockPrescriptionData,
        mockUser,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSavedPrescription);
      expect(result.message).toBe('Prescription created successfully');
      expect(mockPrescriptionInstance.save).toHaveBeenCalled();
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          performedBy: expect.objectContaining({
            userId: mockUser.id,
            userType: 'doctor',
            userName: mockUser.name
          })
        })
      );
    });

    it('should throw error for invalid prescription data', async () => {
      const invalidData = {
        ...mockPrescriptionData,
        medicines: [] // Empty medicines array
      };

      await expect(
        prescriptionService.createPrescription(invalidData, mockUser)
      ).rejects.toThrow('Validation failed: At least one medicine is required');
    });

    it('should throw error if prescription number generation fails', async () => {
      // Mock findOne to always return a prescription (simulating collision)
      Prescription.findOne = jest.fn().mockResolvedValue({ prescriptionNumber: 'existing' });

      await expect(
        prescriptionService.createPrescription(mockPrescriptionData, mockUser)
      ).rejects.toThrow('Failed to generate unique prescription number after multiple attempts');
    });
  });

  describe('updatePrescription', () => {
    it('should update prescription successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const updateData = {
        additionalNotes: 'Updated notes'
      };

      const mockExistingPrescription = {
        _id: prescriptionId,
        ...mockPrescriptionData,
        canBeModified: jest.fn().mockReturnValue(true),
        toObject: jest.fn().mockReturnValue(mockPrescriptionData),
        save: jest.fn().mockResolvedValue({
          ...mockPrescriptionData,
          ...updateData
        })
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockExistingPrescription);
      AuditLog.createLog = jest.fn().mockResolvedValue({});

      const result = await prescriptionService.updatePrescription(
        prescriptionId,
        updateData,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Prescription updated successfully');
      expect(mockExistingPrescription.save).toHaveBeenCalled();
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated'
        })
      );
    });

    it('should throw error if prescription not found', async () => {
      Prescription.findById = jest.fn().mockResolvedValue(null);

      await expect(
        prescriptionService.updatePrescription(
          new mongoose.Types.ObjectId(),
          { additionalNotes: 'test' },
          mockUser
        )
      ).rejects.toThrow('Failed to update prescription: Prescription not found');
    });

    it('should throw error if prescription cannot be modified', async () => {
      const mockPrescription = {
        canBeModified: jest.fn().mockReturnValue(false)
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      await expect(
        prescriptionService.updatePrescription(
          new mongoose.Types.ObjectId(),
          { additionalNotes: 'test' },
          mockUser
        )
      ).rejects.toThrow('Prescription cannot be modified - it has been dispensed or deleted');
    });
  });

  describe('deletePrescription', () => {
    it('should soft delete prescription successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockPrescription = {
        _id: prescriptionId,
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);
      AuditLog.createLog = jest.fn().mockResolvedValue({});

      const result = await prescriptionService.deletePrescription(
        prescriptionId,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Prescription deleted successfully');
      expect(mockPrescription.isDeleted).toBe(true);
      expect(mockPrescription.deletedAt).toBeInstanceOf(Date);
      expect(mockPrescription.save).toHaveBeenCalled();
    });

    it('should throw error if trying to delete dispensed prescription', async () => {
      const mockPrescription = {
        status: 'dispensed'
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      await expect(
        prescriptionService.deletePrescription(
          new mongoose.Types.ObjectId(),
          mockUser
        )
      ).rejects.toThrow('Cannot delete dispensed prescription');
    });
  });

  describe('getPrescriptions', () => {
    it('should get prescriptions for doctor', async () => {
      const mockPrescriptions = [
        { _id: new mongoose.Types.ObjectId(), ...mockPrescriptionData }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };
      
      // Chain the populate calls
      mockQuery.populate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPrescriptions)
      });

      Prescription.find = jest.fn().mockReturnValue(mockQuery);
      Prescription.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await prescriptionService.getPrescriptions(mockUser);

      expect(result.success).toBe(true);
      expect(result.data.prescriptions).toEqual(mockPrescriptions);
      expect(result.data.pagination.total).toBe(1);
      expect(Prescription.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'doctor.id': mockUser.id,
          isDeleted: false
        })
      );
    });

    it('should get prescriptions for patient', async () => {
      const patientUser = {
        id: new mongoose.Types.ObjectId(),
        userType: 'patient',
        name: 'Jane Doe'
      };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };
      
      mockQuery.populate.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      Prescription.find = jest.fn().mockReturnValue(mockQuery);
      Prescription.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await prescriptionService.getPrescriptions(patientUser);

      expect(result.success).toBe(true);
      expect(Prescription.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'patient.id': patientUser.id,
          isDeleted: false
        })
      );
    });
  });

  describe('validatePrescriptionData', () => {
    it('should validate correct prescription data', () => {
      const result = prescriptionService.validatePrescriptionData(mockPrescriptionData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidData = {
        doctor: {},
        patient: {},
        medicines: []
      };

      const result = prescriptionService.validatePrescriptionData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Doctor name is required');
      expect(result.errors).toContain('Doctor specialization is required');
      expect(result.errors).toContain('Patient name is required');
      expect(result.errors).toContain('At least one medicine is required');
    });

    it('should validate patient age', () => {
      const invalidData = {
        ...mockPrescriptionData,
        patient: {
          ...mockPrescriptionData.patient,
          age: -5
        }
      };

      const result = prescriptionService.validatePrescriptionData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patient age must be a valid number between 1 and 150');
    });

    it('should validate patient gender', () => {
      const invalidData = {
        ...mockPrescriptionData,
        patient: {
          ...mockPrescriptionData.patient,
          gender: 'Invalid'
        }
      };

      const result = prescriptionService.validatePrescriptionData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patient gender must be Male, Female, or Other');
    });
  });

  describe('validateMedicineData', () => {
    it('should validate correct medicine data', () => {
      const medicine = {
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'Once daily',
        duration: '30 days'
      };

      const errors = prescriptionService.validateMedicineData(medicine);
      
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing medicine fields', () => {
      const medicine = {
        name: '',
        dosage: '',
        frequency: '',
        duration: ''
      };

      const errors = prescriptionService.validateMedicineData(medicine);
      
      expect(errors).toContain('Medicine name is required');
      expect(errors).toContain('Medicine dosage is required');
      expect(errors).toContain('Medicine frequency is required');
      expect(errors).toContain('Medicine duration is required');
    });
  });

  describe('generatePrescriptionNumber', () => {
    it('should generate unique prescription number', async () => {
      Prescription.findOne = jest.fn().mockResolvedValue(null);

      const prescriptionNumber = await prescriptionService.generatePrescriptionNumber();
      
      expect(prescriptionNumber).toMatch(/^RX-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(Prescription.findOne).toHaveBeenCalledWith({
        prescriptionNumber,
        isDeleted: false
      });
    });
  });

  describe('checkUserAuthorization', () => {
    it('should authorize doctor for their own prescription', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockPrescription = {
        doctor: { id: mockUser.id },
        isDeleted: false
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      const result = await prescriptionService.checkUserAuthorization(prescriptionId, mockUser);
      
      expect(result).toBe(true);
    });

    it('should authorize patient for their own prescription', async () => {
      const patientUser = {
        id: new mongoose.Types.ObjectId(),
        userType: 'patient'
      };
      const mockPrescription = {
        patient: { id: patientUser.id },
        doctor: { id: new mongoose.Types.ObjectId() },
        isDeleted: false
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      const result = await prescriptionService.checkUserAuthorization(
        new mongoose.Types.ObjectId(),
        patientUser
      );
      
      expect(result).toBe(true);
    });

    it('should authorize admin for any prescription', async () => {
      const adminUser = {
        id: new mongoose.Types.ObjectId(),
        userType: 'admin'
      };
      const mockPrescription = {
        doctor: { id: new mongoose.Types.ObjectId() },
        isDeleted: false
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      const result = await prescriptionService.checkUserAuthorization(
        new mongoose.Types.ObjectId(),
        adminUser
      );
      
      expect(result).toBe(true);
    });

    it('should deny unauthorized access', async () => {
      const unauthorizedUser = {
        id: new mongoose.Types.ObjectId(),
        userType: 'doctor'
      };
      const mockPrescription = {
        doctor: { id: new mongoose.Types.ObjectId() },
        patient: { id: new mongoose.Types.ObjectId() },
        isDeleted: false
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      const result = await prescriptionService.checkUserAuthorization(
        new mongoose.Types.ObjectId(),
        unauthorizedUser
      );
      
      expect(result).toBe(false);
    });
  });

  describe('getPrescriptionById', () => {
    it('should get prescription by ID with authorization', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockPrescription = {
        _id: prescriptionId,
        doctor: { id: mockUser.id },
        isDeleted: false
      };

      Prescription.findById = jest.fn()
        .mockResolvedValueOnce(mockPrescription) // For authorization check
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockPrescription)
          })
        }); // For actual data retrieval

      AuditLog.createLog = jest.fn().mockResolvedValue({});

      const result = await prescriptionService.getPrescriptionById(
        prescriptionId,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPrescription);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'viewed'
        })
      );
    });

    it('should throw error for unauthorized access', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const unauthorizedUser = {
        id: new mongoose.Types.ObjectId(),
        userType: 'doctor'
      };
      const mockPrescription = {
        doctor: { id: new mongoose.Types.ObjectId() },
        patient: { id: new mongoose.Types.ObjectId() },
        isDeleted: false
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);

      await expect(
        prescriptionService.getPrescriptionById(prescriptionId, unauthorizedUser)
      ).rejects.toThrow('Unauthorized access to prescription');
    });
  });

  describe('updatePrescriptionStatus', () => {
    it('should update prescription status successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockPrescription = {
        _id: prescriptionId,
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);
      AuditLog.createLog = jest.fn().mockResolvedValue({});

      const result = await prescriptionService.updatePrescriptionStatus(
        prescriptionId,
        'completed',
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Prescription status updated to completed');
      expect(mockPrescription.status).toBe('completed');
      expect(mockPrescription.save).toHaveBeenCalled();
    });

    it('should set verification details when status is dispensed', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockPrescription = {
        _id: prescriptionId,
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);
      AuditLog.createLog = jest.fn().mockResolvedValue({});

      await prescriptionService.updatePrescriptionStatus(
        prescriptionId,
        'dispensed',
        mockUser
      );

      expect(mockPrescription.status).toBe('dispensed');
      expect(mockPrescription.verifiedBy).toBe(mockUser.id);
      expect(mockPrescription.verifiedAt).toBeInstanceOf(Date);
    });
  });
});