const env = import.meta.env

export const TCB_ENV_ID = (env.VITE_TCB_ENV_ID as string) || ''
export const ADMIN_API_URL = (env.VITE_ADMIN_API_URL as string) || ''
export const TCB_STORAGE_BUCKET = (env.VITE_TCB_STORAGE_BUCKET as string) || 'mzzx'
export const COS_BUCKET = (env.VITE_COS_BUCKET as string) || 'ray-1536606545'
export const COS_REGION = (env.VITE_COS_REGION as string) || 'ap-beijing'
export const UPDATE_NOTICE = (env.VITE_UPDATE_NOTICE as string) || ''
export const IS_TCB = Boolean(TCB_ENV_ID)
export const IS_DEMO = !IS_TCB

export const DEMO_ADMIN_USER = (env.VITE_DEMO_ADMIN_USER as string) || 'admin'
export const DEMO_ADMIN_PASS = (env.VITE_DEMO_ADMIN_PASS as string) || 'mzzx2027'

export const SITE_TITLE_DEFAULT = '绵竹中学 · mzzx.photo'