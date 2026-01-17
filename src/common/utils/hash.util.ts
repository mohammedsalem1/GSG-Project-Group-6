import * as bcrypt from 'bcryptjs';

export const hashPassword = async (password: string):Promise<string>=> {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password , salt)
}
export const comparePassword = async (password:string , hashedPassword:string):Promise<boolean> => {
    return await bcrypt.compare(password , hashedPassword)
}

export const hashOTP= async (otp: string):Promise<string>=> {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(otp , salt)
}

export const compareOTP = async (otp:string , hashedOtp:string):Promise<boolean> => {
    return await bcrypt.compare(otp , hashedOtp)
}
