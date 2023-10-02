import {IsEmail, IsPhoneNumber, IsNotEmpty, IsString, Length} from 'class-validator';

export class CreateUserDto{
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    @Length(8)
    userHash: string;

    @IsNotEmpty()
    @IsString()
    userName: string;

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsPhoneNumber('KR')
    phoneNumber: string;
}