import { request } from '../http'

interface Ilogin {
  token: string
}

export function fetchLogin(data: Ilogin) {
  const methodInstance = request.Post<Service.ResponseResult<Api.Login.Info>>('/api/auth/login', data)
  methodInstance.meta = {
    authRole: null,
  }
  return methodInstance
}

export function fetchChangePassword(data: { oldPassword?: string; newPassword: string }) {
  return request.Post<Service.ResponseResult<{ success: boolean }>>('/api/auth/change-password', data)
}
export function fetchUpdateToken(data: any) {
  const method = request.Post<Service.ResponseResult<Api.Login.Info>>('/updateToken', data)
  method.meta = {
    authRole: 'refreshToken',
  }
  return method
}
//
// export function fetchUserRoutes(params: { id: number }) {
//   return request.Get<Service.ResponseResult<AppRoute.RowRoute[]> >('/getUserRoutes', { params })
// }
