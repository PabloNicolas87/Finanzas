import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCreditCardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  closingDay: number;

  @IsNumber()
  dueDay: number;

  @IsNumber()
  accountId: number;
}
