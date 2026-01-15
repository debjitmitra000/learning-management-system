import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  constructor(private readonly field: string) {}

  transform(value: any) {
    if (!value || !value[this.field]) {
      return value;
    }

    const fieldValue = value[this.field];

    if (Array.isArray(fieldValue)) {
      return value;
    }

    if (typeof fieldValue === 'string') {
      const trimmed = fieldValue.trim();
      
      if (trimmed === '' || trimmed === '[]') {
        value[this.field] = [];
        return value;
      }

      try {
        const parsed = JSON.parse(trimmed);
        
        if (Array.isArray(parsed)) {
          value[this.field] = parsed;
        } else {
          value[this.field] = [];
        }
      } catch (error) {
        throw new BadRequestException(`Invalid JSON format for ${this.field}`);
      }
    }

    return value;
  }
}