/**
 * Validation Utilities for Week 2 API
 * Input validation and error formatting
 */

import { ValidationError, PublishDatasetPayload } from './week2Types';

export class ValidationUtils {
  static validatePublishDatasetPayload(payload: any): {
    valid: boolean;
    errors?: ValidationError[];
    data?: PublishDatasetPayload;
  } {
    const errors: ValidationError[] = [];

    // Validate datasetId
    if (!payload.datasetId || typeof payload.datasetId !== 'string') {
      errors.push({
        field: 'datasetId',
        message: 'Dataset ID is required and must be a string',
      });
    } else if (payload.datasetId.length < 3 || payload.datasetId.length > 100) {
      errors.push({
        field: 'datasetId',
        message: 'Dataset ID must be between 3 and 100 characters',
      });
    }

    // Validate name
    if (!payload.name || typeof payload.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Dataset name is required and must be a string',
      });
    } else if (payload.name.length < 3 || payload.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Dataset name must be between 3 and 255 characters',
      });
    }

    // Validate description
    if (!payload.description || typeof payload.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Dataset description is required and must be a string',
      });
    } else if (payload.description.length < 20 || payload.description.length > 5000) {
      errors.push({
        field: 'description',
        message: 'Dataset description must be between 20 and 5000 characters',
      });
    }

    // Validate sourceType
    const validSourceTypes = ['code', 'data', 'ml-model'];
    if (!payload.sourceType || !validSourceTypes.includes(payload.sourceType)) {
      errors.push({
        field: 'sourceType',
        message: `Source type must be one of: ${validSourceTypes.join(', ')}`,
      });
    }

    // Validate licenseType
    const validLicenseTypes = ['open-source', 'research', 'professional', 'commercial'];
    if (!payload.licenseType || !validLicenseTypes.includes(payload.licenseType)) {
      errors.push({
        field: 'licenseType',
        message: `License type must be one of: ${validLicenseTypes.join(', ')}`,
      });
    }

    // Validate visibility (optional, default: request-only)
    if (payload.visibility) {
      const validVisibility = ['private', 'request-only', 'public'];
      if (!validVisibility.includes(payload.visibility)) {
        errors.push({
          field: 'visibility',
          message: `Visibility must be one of: ${validVisibility.join(', ')}`,
        });
      }
    }

    // Validate tags (optional, max 10)
    if (payload.tags) {
      if (!Array.isArray(payload.tags)) {
        errors.push({
          field: 'tags',
          message: 'Tags must be an array',
        });
      } else if (payload.tags.length > 10) {
        errors.push({
          field: 'tags',
          message: 'Maximum 10 tags allowed',
        });
      } else {
        for (let i = 0; i < payload.tags.length; i++) {
          const tag = payload.tags[i];
          if (typeof tag !== 'string' || tag.length < 2 || tag.length > 50) {
            errors.push({
              field: `tags[${i}]`,
              message: 'Each tag must be between 2 and 50 characters',
            });
          }
        }
      }
    }

    // Validate quality (optional, 0-5)
    if (payload.quality !== undefined && payload.quality !== null) {
      if (typeof payload.quality !== 'number' || payload.quality < 0 || payload.quality > 5) {
        errors.push({
          field: 'quality',
          message: 'Quality rating must be a number between 0 and 5',
        });
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: {
        datasetId: payload.datasetId,
        name: payload.name,
        description: payload.description,
        sourceType: payload.sourceType,
        licenseType: payload.licenseType,
        visibility: payload.visibility || 'request-only',
        tags: payload.tags || [],
        quality: payload.quality || 3,
      },
    };
  }

  static validateAccessRequestPayload(payload: any): {
    valid: boolean;
    errors?: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Validate requestId
    if (!payload.requestId || typeof payload.requestId !== 'string') {
      errors.push({
        field: 'requestId',
        message: 'Request ID is required and must be a string',
      });
    }

    // Validate action
    const validActions = ['approve', 'reject'];
    if (!payload.action || !validActions.includes(payload.action)) {
      errors.push({
        field: 'action',
        message: `Action must be one of: ${validActions.join(', ')}`,
      });
    }

    // Validate notes (optional, max 1000 chars)
    if (payload.notes && typeof payload.notes !== 'string') {
      errors.push({
        field: 'notes',
        message: 'Notes must be a string',
      });
    } else if (payload.notes && payload.notes.length > 1000) {
      errors.push({
        field: 'notes',
        message: 'Notes must be less than 1000 characters',
      });
    }

    // Validate accessDurationDays (optional, 1-365)
    if (payload.accessDurationDays !== undefined && payload.accessDurationDays !== null) {
      if (
        typeof payload.accessDurationDays !== 'number' ||
        payload.accessDurationDays < 1 ||
        payload.accessDurationDays > 365
      ) {
        errors.push({
          field: 'accessDurationDays',
          message: 'Access duration must be between 1 and 365 days',
        });
      }
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  static formatValidationError(errors: ValidationError[]) {
    return {
      error: 'validation_error',
      message: 'Validation failed',
      details: errors,
    };
  }

  static formatError(code: string, message: string) {
    return {
      error: code,
      message: message,
    };
  }
}
