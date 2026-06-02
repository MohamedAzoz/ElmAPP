export interface IResJWT {
  jti: string;
  sub: string;
  iat: number;
  role: string;
  exp: number;
  iss: string;
  aud: string;
}

//  "jti": "e471a8f2-0669-4fae-b1d0-9f2cc780a87b",
//   "sub": "0f9c7e50-d963-4e73-8c3c-c2bb18d217bf",
//   "iat": 1780391850,
//   "role": "SuperAdmin",
//   "exp": 1780397250,
//   "iss": "ElmAPI",
//   "aud": "https://elm-university.netlify.app"
