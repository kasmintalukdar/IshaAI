import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ Attach the cookie to every request automatically
  const clonedRequest = req.clone({
    withCredentials: true
  });
  
  return next(clonedRequest);
};