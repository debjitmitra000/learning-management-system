import { IsAlphanumeric, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class registerDto{
    @IsString() @IsNotEmpty()
    fname: string;

    @IsString() @IsNotEmpty()
    lname: string;

    @IsEmail() @IsNotEmpty() 
    email: string;

    @IsAlphanumeric() @IsNotEmpty()
    password: string;
}