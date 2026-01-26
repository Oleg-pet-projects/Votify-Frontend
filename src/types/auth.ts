export interface ILoginPayload {
  login: string;
  password: string;
}

export interface IRegisterPayload extends ILoginPayload {
  email: string;
}

export interface IAuthForm {
  login: string;
  password: string;
  email?: string;
}
