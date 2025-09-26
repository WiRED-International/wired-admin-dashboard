// export const apiPrefix = import.meta.env.VITE_MODE === 'dev' ? '/' : '/apiv2/'

export const apiPrefix = import.meta.env.MODE === 'development' ? '' : '/apiv2/';