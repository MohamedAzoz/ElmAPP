import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { IResJWT } from '../models/ires-jwt';

@Injectable({
  providedIn: 'root',
})
export class JWT {
  public decodeToken(token: string) {
    if (!token) {
      return {} as IResJWT;
    }
    try {
      return jwtDecode<IResJWT>(token);
    } catch (error) {
      return {} as IResJWT;
    }
  }
  // public isTokenExpired() {
  //   return this.jwt.isTokenExpired(this.token);
  // }
}
