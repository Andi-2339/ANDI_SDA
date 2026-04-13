import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const activeGroupId = authService.currentUser()?.activeGroupId;

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (activeGroupId) {
    headers = headers.set('x-group-id', activeGroupId.toString());
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
