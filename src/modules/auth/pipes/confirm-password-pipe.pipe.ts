import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ConfirmPasswordPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const { password, confirmPassword } = value;
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return value;
  }
}
