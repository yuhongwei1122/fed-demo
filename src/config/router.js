export default [
    {
        path: '/error',
        name: '错误信息',
        private: false,
        component: () => import('../pages/error'),
        role: [1,2,3]
    },
    {
        path: '/demo',
        name: '演示',
        private: false,
        component: () => import('../pages/newdemo'),
        role: [1,2,3]
    }
]
