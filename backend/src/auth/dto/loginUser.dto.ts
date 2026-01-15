import { IsAlphanumeric, IsEmail, IsNotEmpty } from "class-validator";

export class loginDto {
    @IsEmail() @IsNotEmpty()
    email : string;

    @IsAlphanumeric() @IsNotEmpty()
    password : string;
}